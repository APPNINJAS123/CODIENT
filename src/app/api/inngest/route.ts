import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { CodeAgentFunction } from "@/inngest/functions";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    CodeAgentFunction,
    /* your functions will be passed here later! */
  ],  
});
