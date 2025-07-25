import { protectedProcedure, baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";
export const messagesRouter = createTRPCRouter({
   getMany: protectedProcedure
   .input(
    z.object({
        
        projectID:z.string().min(1,"Project ID is required"),


    }),
   )
    .query(async ({input,ctx}) => {
    const messages=await prisma.message.findMany({
        where:{projectID:input.projectID,project:{userId:ctx.auth.userId}},
        orderBy:{
            updatedAt:"asc"
        },
        include:{
            fragment:true
        }
    })
    return messages;
   }),
   create: protectedProcedure
    .input(
    z.object({
        value: z.string().min(1,"Value is required").max(10000,"Value is too long"),
        projectID:z.string().min(1,"Project ID is required"),


    }),
   )

   .mutation(async({input,ctx})=>{
    const existingProject=await prisma.project.findUnique({
        where:{id:input.projectID,userId:ctx.auth.userId}
    })
    if(!existingProject){
        throw new TRPCError({
            code:"NOT_FOUND",
            message:"Project not found"
        })
    }
    try{
      await consumeCredits()
    }catch(error){
        if(error instanceof Error){
            throw new TRPCError({
                code:"BAD_REQUEST",
                message:"SOMETHING WENT WRONG"
            })

        }else{
            throw new TRPCError({
                code:"TOO_MANY_REQUESTS",
                message:"YOU HAVE RUN OUT OF CREDITS FOR THIS MONTH"
            })
        }
    }
    
    const newMessage=await prisma.message.create({
        data:{
            projectID: existingProject.id, // Assuming projectID is passed in the input
            content: input.value,
            role:"USER",
            type:"RESULT",
            //project: "default", // Assuming a default project for simplicity

        }
    })
      await inngest.send({
             name: 'code-agent/run',
             data: {
               value: input.value,
               projectID: input.projectID, // Pass the project
             },
           });
           return newMessage;
   })
});