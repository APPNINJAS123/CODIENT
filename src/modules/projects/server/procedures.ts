import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {generateSlug} from 'random-word-slugs'
import { inngest } from "@/inngest/client";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";
export const projectsRouter = createTRPCRouter({
   getOne: protectedProcedure
   .input(z.object({
    id:z.string().min(1,"ID is required"),
   })
       
   )
    .query(async ({input,ctx}) => {
    const existingproject=await prisma.project.findUnique({
        
        where:{id:input.id,userId:ctx.auth.userId},

        //orderBy:{
            //updatedAt:"desc"
        //},
        //include:{
            //fragment:true
        //}
    })
    if(!existingproject){
        throw new TRPCError({
            code:"NOT_FOUND",
            message:"Project not found"
        })
    }
    return  existingproject;
   }),
   //new getMany addition might cause error
   getMany: protectedProcedure
    .query(async ({ctx}) => {
      const projects = await prisma.project.findMany({
        where: {
          userId: ctx.auth.userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      return projects;
    }),
   create: protectedProcedure
    .input(
    z.object({
        value: z.string().min(1,"Value is required").max(10000,"Value is too long"),


    }), 
)
   
   .mutation(async({input,ctx})=>{

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
    const createdProject=await prisma.project.create({
        data:{
            userId:ctx.auth.userId,
            name:generateSlug(2,{
                format: "kebab",
            }),
        messages:{
            create:{
                content: input.value,
                role:"USER",
                type:"RESULT",
                //project: "default", // Assuming a default project for simplicity
            }
        }
        }
    })
    
      await inngest.send({
             name: 'code-agent/run',
             data: {
               value: input.value,
                projectID: createdProject.id, // Pass the project
             },
           });
           return createdProject;
   })
});