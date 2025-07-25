"use client"
import { TabsSwitcher } from "@/components/tab-switcher";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { trpc } from "@/trpc/client"
import { MessagesContainer } from "../components/messages-container";
import { useState, Suspense } from "react";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
//import { CodeView } from "@/components/code-view";
import { FileExplorer } from "@/components/file-explorer";
import path from "path";
import { UserControl } from "@/components/user-control";
import { useAuth } from "@clerk/nextjs";
import { ErrorBoundary } from "react-error-boundary";



interface Props { 
  projectID: string
  //intialProject?:Name
}


export const ProjectView = ({ projectID }: Props) => {
  const [activeFragment,setactiveFragment]=useState<Fragment | null>(null)
  const[tabState,setTabState]=useState<'preview' | 'code'>('preview')
  const{has}=useAuth();
  const hasProAccess=has?.({plan:"pro"});

  



//suspense removed for project header part here adding it can cause problems !!!!
//Suspense fallback={<div>Loading Project...</div>}>
//</Suspense>
//suspense for msgs can also cause errs
  return (
    
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
          
          
          <ErrorBoundary fallback={<p>Project Error</p>}>
          <ProjectHeader projectID={projectID} />
          </ErrorBoundary>
          
          
          
          
          <ErrorBoundary fallback={<p>Messages Error</p>}>
          <Suspense fallback={<div>Loading Messages...</div>}>
          
            <MessagesContainer projectID={projectID} activeFragment={activeFragment} setactiveFragment={setactiveFragment}/>
           </Suspense>
          </ErrorBoundary>
          
        </ResizablePanel>
       <ResizableHandle  className="hover:bg-primary transition-colors"/>
       <ResizablePanel  
       defaultSize={65} minSize={50}

       >
       <TabsSwitcher activeFragment={activeFragment} />

       
       </ResizablePanel>
      
      </ResizablePanelGroup>
      
      
      

      
    </div>
  )
  
}