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
//import { Usage } from "@/modules/home/ui/components/usage"
import { QueryOptions } from "@tanstack/react-query"
import { Usage } from "@/modules/home/ui/components/usage"
import { useRouter } from "next/navigation"


interface Props{
  projectID: string
}

const formSchema = z.object({
  value: z.string().min(1,"Value is required").max(10000,"Value is too long"),
})

export const MessageForm = ({projectID}: Props) => {
  const [isFocused, setIsFocused] = useState(false)
  const router=useRouter()
  
  
  const utils = trpc.useUtils()
  const{data:usage}=trpc.usage.status.useQuery()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: ""
    }
  })

  const createMessage = trpc.messages.create.useMutation({
    onSuccess: () => {
      form.reset()
      utils.messages.getMany.invalidate({ projectID })
      utils.usage.status.invalidate()
    },
     
    onError: (error) => {
      toast.error(error.message)
      if(error.data?.code==="TOO_MANY_REQUESTS"){
        router.push("/pricing")
          
      }
    }
  })

  const isPending = createMessage.isPending
  const isButtonDisabled = isPending || !form.formState.isValid
  const showUsage = !!usage

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMessage.mutateAsync({
      value: values.value,
      projectID
    })
  }
  

  return (

    <Form {...form}>
        {showUsage && (
            <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext}/>
        )}
        
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
    </Form>
  )
}