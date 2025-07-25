"use client"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import TextareaAutosize from "react-textarea-autosize"
import {z} from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowUpIcon,Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { trpc } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import {Form,FormField} from "@/components/ui/form"
import { useRouter } from "next/navigation"
import { create } from "domain"
import { PROJECT_TEMPLATES } from "../../constants"
import { useClerk } from "@clerk/nextjs"

interface Props{
  projectID: string
}

const formSchema = z.object({
  value: z.string().min(1,"Value is required").max(10000,"Value is too long"),
})

export const ProjectForm = () => {
  const router=useRouter()
  const clerk=useClerk()
  const [isFocused, setIsFocused] = useState(false)
  const showUsage = false
  
  const utils = trpc.useUtils()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: ""
    }
  })

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      
      utils.projects.getMany.invalidate()
      utils.usage.status.invalidate()
      router.push(`/projects/${data.id}`)
    },
    onError: (error) => {
        toast.error(error.message)
        if(error.data?.code==="UNAUTHORIZED"){
            clerk.openSignIn
        }
        if(error.data?.code==="TOO_MANY_REQUESTS"){
          router.push("/pricing")
            
        }
      
    }
  })

  const isPending = createProject.isPending
  const isButtonDisabled = isPending || !form.formState.isValid

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
      
    })
  }
  const onSelect=(value:string)=>{
    form.setValue("value",value,{
        shouldDirty:true,
        shouldValidate:true,
        shouldTouch:true
    })
  }

  return (
    <Form {...form}>
        <section className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && 'shadow-xs',
          showUsage && 'rounded-t-none'
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({field}) => (
            <TextareaAutosize
              disabled={isPending}
              {...field}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would u like to build ?"
              onKeyDown={(e) => {
                if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
                  e.preventDefault()
                  form.handleSubmit(onSubmit)(e)
                }
              }}
            />
          )}
        />
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>⌘</span>
              Enter
            </kbd>
            &nbsp;to submit
          </div>
          <Button
            disabled={isButtonDisabled} 
            className={cn(
              "size-8 rounded-full",
              isButtonDisabled && "bg-muted-foreground border"
            )}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin size-4"/>
            ) : (
              <ArrowUpIcon/>
            )}
          </Button>
        </div>
      </form>
      <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
        {PROJECT_TEMPLATES.map((template)=>(
            <Button key={template.title} variant="outline" size="sm" className="bg-white dark:bg-sidebar" onClick={()=>{onSelect(template.prompt)}} >
                {template.emoji} {template.title}

            </Button>
        ))}
         
      </div>
      </section>
    </Form>
    
  )
}