"use client"
import Image from "next/image"
import { PricingTable } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useCurrentTheme } from "@/hooks/use-current-theme"

const Page=()=>{
    const currentThemes=useCurrentTheme()
    return(
        <div className="flex flex-col max-w-3xl mx-auto w-full">
            <section className="space-y-6 pt-[16vh] 2xl:pt-48">
                <div className="flex flex-col items-center">
                    <Image
                    src='/logo.svg'
                    alt="Codient"
                    width={50}
                    height={50}
                    className="hidden md:block"

                    
                    />
                </div>
                <h1 className="text-xl md:text-3xl font-bold text-center">Pricing</h1>
                    <p className="text-muted-foreground text-center text-sm md:text-base">
                        Choose the plan that works best for you
                    </p>
                
                <PricingTable appearance={{
                    baseTheme:currentThemes==="dark"?dark:undefined,
                    elements:{
                        pricingTableCard:"border! shadow-none! rounded-lg!"
                    }
                }}/>
            </section>
            
        </div>
    )
}
export default Page