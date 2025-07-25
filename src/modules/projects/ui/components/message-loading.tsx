import { de } from "date-fns/locale";
import Image from "next/image";
import { useState, useEffect } from "react";

const ShimerMessages = () => {
  const messages = [
    "Thinking...",
    "Loading...",
    "Generating...",
    "Analysing your requests...",
    "Planning your layout...",
    "Creating components...",
    "Fetching data...",
    "Designing your UI...",
    "Building your website...",
    "Crafting components...",
    "Optimizing layout...",
    "Adding final touches...",
    "Checlking for errors...",
    "Finalizing your project...",
    "Preparing your code...",
    "Compiling your project...",
    "Almost done...",
    "Almost ready..."
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval); // Cleanup
  }, [messages.length]);

  return (
    <div  className="flex items-center gap-2">
        <span className="text-base text-muted-foreground animate-pulse">{messages[currentMessageIndex]}</span>
      
    </div>
  );
};

 export const MessageLoading=()=>{
    return(
    <div className="flex flex-col group px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-2">
            <Image src='/logo.svg'
            alt="Codient"
            width={18}
            height={18}
            className="shrink-0"/>
            <span className="text-sm font-medium">
                Codient
            </span>
        </div>
        <div className="pl-8 flex flex-col gap-y-4">
            <ShimerMessages/>
        </div>

    </div>
    )
}

