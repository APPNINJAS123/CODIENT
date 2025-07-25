
import { trpc } from "@/trpc/client";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef } from "react";
import { Fragment } from "@/generated/prisma";
import { se } from "date-fns/locale";
import {MessageLoading } from "./message-loading";


interface Props {
  projectID: string;
  activeFragment: Fragment | null;
  setactiveFragment:(fragment:Fragment | null) => void
}

export const MessagesContainer = ({ projectID,activeFragment,setactiveFragment }: Props) => {
  const bottomRef=useRef<HTMLDivElement>(null)
  const lastAssistantMessageIDRef=useRef<string | null>(null)
  const { data: messages,isLoading } = trpc.messages.getMany.useQuery(
    { projectID },  
    { 
      //:Temporary Live Message Update
      refetchInterval: 2000,
      suspense: true
    },
    
    
  ); 
  //if (isLoading) return <div>Loading messages...</div>;  
    //THis might give an err:messages?,it should be arrMessages if im not wrong
    useEffect(()=>{
      const lastAssistantMessage=arrMessages?.findLast((message)=>message.role==="ASSISTANT")
          if(lastAssistantMessage?.fragment && lastAssistantMessageIDRef.current!==lastAssistantMessage.id){
            setactiveFragment(lastAssistantMessage.fragment)
            lastAssistantMessageIDRef.current=lastAssistantMessage.id
          }
       },[messages,setactiveFragment]) 
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"})
    
  },[messages?.length])

  

  

  // Safely extract an array for mapping
  let arrMessages: any[] = [];
  if (Array.isArray(messages)) {
    arrMessages = messages;
  } else if (
    messages &&
    typeof messages === "object" &&
    "json" in messages &&
    Array.isArray((messages as any).json)
  ) {
    arrMessages = (messages as any).json;
  }
  //console.log("arrMessages:", arrMessages.map(m => m.role));
  const lastMessage=arrMessages[arrMessages.length-1];
  const isLastMessageUser=lastMessage?.role==="USER";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {arrMessages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={() => setactiveFragment(message.fragment)}
              type={message.type}
            />
          ))}
          {isLastMessageUser&& <MessageLoading/>}
          <div ref={bottomRef} ></div>
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none"/>

        
        <MessageForm projectID={projectID} /> 

      </div>
    </div>
  );
}