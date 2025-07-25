import { inngest } from "./client";
import { Agent,anthropic, openai, createAgent, createTool, createNetwork, type Tool, type Message, createState } from "@inngest/agent-kit";
import Sandbox, { Result } from "@e2b/code-interpreter";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import path from "path";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";  
import {prisma} from "@/lib/db";
import { fr } from "date-fns/locale";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState{
  summary:string,
  files:{[path:string]:string}
}

export const CodeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxID = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create('apple-vibe-test');
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      return sandbox.sandboxId;
    });

    const previousMessages=await step.run("get-previous-messages", async () => {
      const formattedMessages: Message[]=[]
      const messages=await prisma.message.findMany({
        where:{projectID:event.data.projectID},
        orderBy:{createdAt:"desc"}, //TODO:change to asc if ai doesnt understand prev msg
        take:5,
      })
      for (const message of messages){
        formattedMessages.push({
          type:"text",
          role:message.role==="ASSISTANT"?"assistant":"user",
          content:message.content
        })
      }
      return formattedMessages.reverse()
    })

    const state=createState<AgentState>({
      summary:"",
      files:{},
    },{
      messages:previousMessages
    })

    const codeAgent = createAgent<AgentState>({
      name: "coding agent", 
      system: PROMPT,
      description:"An expert coding Agent",
      model: anthropic({ model: "claude-3-5-sonnet-20241022", defaultParameters: { max_tokens:8192 } }), // Changed from haiku to sonnet
      tools: [
        createTool({
          name: "terminal",
          description: "Execute terminal commands in the sandbox environment. Use this to install packages, run build commands, etc.",
          parameters: z.object({
            command: z.string().min(1, "Command cannot be empty"),
          }),
          handler: async ({ command }, { step }) => {
            console.log("Terminal command:", command);
            return await step?.run('terminal', async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxID);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout || buffers.stdout;
              } catch (e) {
                console.error(`command failed: ${e}\n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`);
                return `command failed: ${e}\n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        
        createTool({
          name: "CreateOrUpdateFile",
          description: `Create or update files in the sandbox filesystem. 
          
          IMPORTANT: You must provide an array of files, each with:
          - path: relative file path (e.g., "app/page.tsx", "components/button.tsx")
          - content: complete file content as a string
          
          Example usage:
          {
            "files": [
              {
                "path": "app/page.tsx",
                "content": "export default function Page() { return <div>Hello</div>; }"
              }
            ]
          }`,
          parameters: z.object({
            files: z.array(z.object({
              path: z.string().min(1, "File path is required and cannot be empty"),
              content: z.string(),
            })).min(1, "At least one file must be provided")
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            // Add validation logging
            console.log("CreateOrUpdateFile called with:", { filesCount: files?.length, files });
            
            if (!files || files.length === 0) {
              console.error("No files provided to CreateOrUpdateFile");
              return "Error: No files provided. Please specify at least one file with path and content.";
            }

            // Validate each file
            for (const file of files) {
              if (!file.path || file.path.trim() === "") {
                console.error("Invalid file path:", file);
                return `Error: Invalid file path provided: ${file.path}`;
              }
              if (file.content === undefined || file.content === null) {
                console.error("Invalid file content:", file);
                return `Error: Invalid content for file: ${file.path}`;
              }
            }

            const newFiles = await step?.run('create-or-update-files', async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxID);
                
                for (const file of files) {
                  console.log(`Writing file: ${file.path}`);
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                
                return updatedFiles;
              } catch (e) {
                console.error(`File operation failed: ${e}`);
                return `File operation failed: ${e}`;
              }
            });

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
              return `Successfully created/updated ${files.length} file(s): ${files.map(f => f.path).join(', ')}`;
            }
            
            return newFiles; // This will be the error message if newFiles is a string
          },
        }),

        createTool({
          name: "ReadFile",
          description: `Read files from the sandbox filesystem.
          
          IMPORTANT: Provide an array of file paths to read.
          
          Example usage:
          {
            "files": ["app/page.tsx", "components/ui/button.tsx"]
          }`,
          parameters: z.object({
            files: z.array(z.string().min(1, "File path cannot be empty")).min(1, "At least one file path is required"),
          }),
          handler: async ({ files }, { step }) => {
            console.log("ReadFile called with:", { filesCount: files?.length, files });
            
            if (!files || files.length === 0) {
              console.error("No files provided to ReadFile");
              return "Error: No file paths provided. Please specify at least one file path to read.";
            }

            return await step?.run('read-files', async () => {
              try {
                const sandbox = await getSandbox(sandboxID);
                const contents = [];

                for (const file of files) {
                  console.log(`Reading file: ${file}`);
                  try {
                    const content = await sandbox.files.read(file);
                    contents.push({ path: file, content });
                  } catch (fileError) {
                    console.error(`Error reading file ${file}:`, fileError);
                    contents.push({ path: file, content: `Error reading file: ${fileError}` });
                  }
                }

                return JSON.stringify(contents);    
              } catch (e) {
                console.error(`Error in ReadFile:`, e);
                return `Error reading files: ${e}`;
              }
            });
          }
        })
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText; // updated to match router
            } 
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: 'code-agent-network',
      agents: [codeAgent],
      maxIter: 10,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, { state });
    
    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator", 
      system: FRAGMENT_TITLE_PROMPT,
      description: "A fragment title generator",
      model: openai({ model: "gpt-4o" }),
    });
    
    const responseGenerator = createAgent({
      name: "response-generator", 
      system: RESPONSE_PROMPT,
      description: "A response generator",
      model: openai({ model: "gpt-4o" }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(result.state.data.summary);
    const { output: responseOutput } = await responseGenerator.run(result.state.data.summary);

    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0].type !== "text") {
        return "fragment";
      }
      if (Array.isArray(fragmentTitleOutput[0].content)) {
        return fragmentTitleOutput[0].content.map((txt) => txt).join("");
      }
      else {
        return fragmentTitleOutput[0].content;
      }
    };

    const generateResponse = () => {
      if (responseOutput[0].type !== "text") {
        return "Here you go";
      }
      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((txt) => txt).join("");
      }
      else {
        return responseOutput[0].content;
      }
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxID);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectID: event.data.projectID,
            content: `Something went wrong. Please try again`,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectID: event.data.projectID,
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              SandboxURL: sandboxURL,
              title: generateFragmentTitle(),
              files: result.state.data.files,
            }
          }
        }
      });
    });

    return {  
      url: sandboxURL,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);