import { CopyCheck,CopyCheckIcon, CopyIcon } from "lucide-react";
import {useState,useMemo,Fragment,useCallback} from "react"
import { Hint } from "./hints";
import { Button } from "./ui/button";
import { CodeView } from "./code-view";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { convertFilesToTreeItems } from "@/lib/utils";
import { set } from "date-fns";
import { TreeView } from "./tree-view";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { se } from "date-fns/locale";


type FileCollection={[path:string]:string}
function getLanguageFromExtension(filename:string): string{
    const extension=filename.split(".").pop()?.toLowerCase()
    return extension || "text";
    
};
interface FileBreadCrumbProps{
    filePath:string
}
const FileBreadCrumb=({filePath}:FileBreadCrumbProps)=> {
    const pathSegments=filePath.split("/");
    const maxSegments=3;
    const renderBreadCrumbItems=()=>{
        if(pathSegments.length<=maxSegments){
            //show all segments if 3 or less
            return pathSegments.map((segment,index)=>{
                const isLast=index===pathSegments.length-1;
                return(
                    <Fragment key={index}>
                        <BreadcrumbItem>
                          {isLast?(
                            <BreadcrumbPage className="font-medium">
                            {segment}
                            </BreadcrumbPage>
                          ):(
                              <span className="text-muted-foreground">{segment}</span>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator/>}

                    </Fragment>
                )
            })

        }else{
            const firstSegment=pathSegments[0];
            const lastSegment=pathSegments[pathSegments.length-1];

            return(
                <>
                <BreadcrumbItem>
                <span className="text-muted-foreground ">
                    {firstSegment}
                </span>
                <BreadcrumbSeparator/>
                <BreadcrumbItem>
                  <BreadcrumbEllipsis/>
                </BreadcrumbItem>
                <BreadcrumbSeparator/>
                <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                {lastSegment}
                </BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbItem>
                </>
            )
        }
    }
    return(
        <Breadcrumb>
        <BreadcrumbList>
        {renderBreadCrumbItems()}
        </BreadcrumbList>
        </Breadcrumb>
    )
}
interface FileExplorerProps{
    files:FileCollection
}

export const FileExplorer=({
    files
}:FileExplorerProps)=>{
    const[copied,setCopied]=useState(false);
    const [selectedFile,setSelectedFile]=useState<string | null>(()=>{
        const filekeys=Object.keys(files);
        return filekeys.length > 0 ? filekeys[0] : null; 
    });

const treedata=useMemo(() => {
    return convertFilesToTreeItems(files);
},[files])

const HandleFileSelect=useCallback((filePath:string)=>{
    if (files[filePath]) {
        setSelectedFile(filePath);
    }
},[files])


const HandleCopy=useCallback(()=>{
    if(selectedFile){
        navigator.clipboard.writeText(files[selectedFile]);
        setCopied(true);
        setTimeout(()=>{
            setCopied(false);
        },2000);
    }
},[selectedFile,files])
    return(
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
                <TreeView data={treedata} value={selectedFile} onSelect={HandleFileSelect}/>

            </ResizablePanel>
            <ResizableHandle className="hover:bg-primary transition-colors "/>
            <ResizablePanel defaultSize={70} minSize={50}>
                {selectedFile && files[selectedFile]?(
                    <div className="h-full w-full flex flex-col">
                        <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
                            <FileBreadCrumb filePath={selectedFile}/>
                            <Hint text="copy to clipboard" side="bottom">
                                <Button variant="outline" size="icon" className="ml-auto" onClick={HandleCopy} disabled={copied}>
                                    {copied ? <CopyCheckIcon/>:<CopyIcon/>}
                                    

                                </Button>

                            </Hint>

                        </div>
                        <div className="flex-1 overflow-auto">
                            <CodeView code={files[selectedFile]} language={getLanguageFromExtension(selectedFile)}/>

                        </div>
                    </div>
                ):(
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a file to view its content
                    </div>
                )}
                
            </ResizablePanel>

        </ResizablePanelGroup>
    )

}