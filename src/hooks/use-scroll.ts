import { se, tr } from "date-fns/locale"
import {useState,useEffect} from "react"
export const useScroll = (treshold=10) => {
    const[isScrolled,setIsScrolled]=useState(false)
    useEffect(()=>{
        const handleScroll = () => {
            setIsScrolled(window.scrollY > treshold)
        }
        window.addEventListener("scroll", handleScroll)
        handleScroll()
        return () => window.removeEventListener("scroll", handleScroll)
    },[treshold])
    return isScrolled
}