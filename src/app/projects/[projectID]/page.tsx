import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient,trpc} from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
//gets project id due to dynamic routing:[] and then gets all data abt msgs and projects related to tht id

interface Props{
    params:Promise<{
        projectID: string;
    }>  
};

const Page=async({ params}:Props)=>{

    const {projectID}=await params;
    const QueryClient =getQueryClient();
    void QueryClient.prefetchQuery(trpc.messages.getMany.queryOptions({
          projectID
    }))
    void QueryClient.prefetchQuery(trpc.projects.getOne.queryOptions({
          id:projectID
    }))

    
  return(
    <HydrationBoundary state={dehydrate(QueryClient)}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <Suspense fallback={<div>Loading...</div>}>
        <ProjectView projectID={projectID}/>
        </Suspense>
        </ErrorBoundary>
    </HydrationBoundary>  
  )
}

export default Page