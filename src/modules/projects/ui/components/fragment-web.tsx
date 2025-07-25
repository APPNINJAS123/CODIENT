import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, RefreshCcw, RefreshCcwIcon } from "lucide-react";
import { Hint } from "@/components/hints";

interface Props{
    data:Fragment
}
export function FragmentWeb({data}:Props){
    const[FragmentKey,setFragmentKey]=useState(0);
    const[copied,setCopied]=useState(false);
    const onRefresh=()=>{
        setFragmentKey((prev)=>prev+1);

    }
    const handleCopy = () => {
        navigator.clipboard.writeText(data.SandboxURL)
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        
    }
    return(
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                <Hint text="Refresh" side="bottom">
                <Button size='sm' variant='outline' onClick={onRefresh}>
                    <RefreshCcwIcon/>
                </Button>
                </Hint>
                <Hint text="Copy URL" side="bottom" >
                <Button size='sm' variant='outline' disabled={!data.SandboxURL|| copied} onClick={handleCopy}
                    className="flex-1 justify-start text-start font-normal">
                    <span className="truncate">{data.SandboxURL}</span>
                </Button>
                </Hint>
                <Hint text="Open in new tab" side="bottom" align="start">
                <Button size='sm' disabled={!data.SandboxURL} variant='outline' onClick={()=>{
                    if(!data.SandboxURL) return
                    window.open(data.SandboxURL,'_blank')
                }} >
                    <ExternalLinkIcon/>
                </Button>
                </Hint>
            </div>
            <iframe  key={FragmentKey} className="w-full h-full" sandbox="allow-forms allow-scripts allow-same-origin" loading="lazy" src={data.SandboxURL} />

        </div>
    )



}

