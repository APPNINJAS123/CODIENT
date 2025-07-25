"use client";
//adding use client can cause problems
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
//import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown,ChevronLeft,ChevronLeftIcon,EditIcon,Sun,SunMoonIcon } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,DropdownMenuItem, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
//import {  } from "@radix-ui/react-dropdown-menu";
interface Props {
    projectID: string;
    
}
//added new isloading instead of suspense:true here can cause issues
 export const ProjectHeader = ({ projectID }: Props) => {
    
    const { data: project } = trpc.projects.getOne.useQuery(
    { id:projectID }, 
    
    
    
  );
  //if (isLoading) return <div>Loading...</div>;
  const{theme,setTheme}=useTheme()
  //new changes
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return(
    <header className="p-2 flex justify-between items-center border-b">
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!">
                <Image src='/logo.svg' alt="Codient" width={18} height={18} />
                <span className="text-sm font-medium">{project?.name}</span>
                <ChevronDown/>
            </Button>

        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem asChild>
                <Link href='/'>
                <ChevronLeftIcon/>
                <span>Go To Dashboard</span>

                
                </Link>
                
                 </DropdownMenuItem>
                 <DropdownMenuSeparator/>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                        <SunMoonIcon className="size-4 text-muted-foreground"/>
                        <span>Change Theme</span>
                        
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                <DropdownMenuRadioItem value='light'>
                                    <span>Light</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value='dark'>
                                    <span>Dark</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value='system'>
                                    <span>System</span>
                                    </DropdownMenuRadioItem>

                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                 </DropdownMenuSub>

                 
            </DropdownMenuContent>
     </DropdownMenu>
  </header>
  )
  
    
    }