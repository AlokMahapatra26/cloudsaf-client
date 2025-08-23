import Link from "next/link"
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function Landing() {

return (

 
    <main className="relative flex min-h-screen flex-col items-center justify-center   overflow-hidden">
      
      <section className="relative z-10 w-full max-w-3xl text-center px-6 py-20">
        <h1 className="text-5xl font-extrabold tracking-tight">
          CloudSAF
        </h1>
        <p className="mt-4 text-xl text-zinc-400">
          Cloud storage that’s <span className="font-semibold ">simple AF</span>.
          No clutter. No noise. Just your files, safe and accessible.
        </p>
        <div className="mt-8 flex justify-center gap-4">

          
            
            <Link href="/signup" >
            <ShimmerButton>
              <span className="text-white">Lets Begin</span>
            </ShimmerButton>
            </Link>

            <AnimatedGridPattern width={40} height={40}  numSquares={30}
        maxOpacity={0.2}
        duration={5}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}/>
          
        </div>


         
      </section>
</main>
     
    

   
   
  )
}
