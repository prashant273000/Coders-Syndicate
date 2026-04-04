import { words } from "../constants";
import Button from "../components/Button";

const Hero = () => {
  return (
    <section id="hero" className="relative w-full overflow-hidden">
      {/* Added 'pt-24 md:pt-32' to push content below the fixed navbar 
      */}
      <div className="hero-layout pt-24 md:pt-32">
        {/* CHANGED: max-w-7xl is now max-w-5xl to push content more towards the center */}
<header className="flex flex-col justify-center w-full px-6 md:px-12">
  <div className="flex flex-col gap-5 md:gap-7">
    
    <div className="hero-text">
      <h1 className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 leading-tight">
        <span>Featuring</span>
        
        <span className="slide relative inline-block h-[50px] md:h-[80px] w-[360px] sm:w-[400px] md:w-[550px] lg:w-[700px]">
          <span className="wrapper absolute top-0 left-0 w-full whitespace-nowrap">
            {words.map((word, index) => (
              <span key={index} className="flex items-center gap-2 md:gap-4 h-[50px] md:h-[80px]">
                <img 
                  src={word.imgPath} 
                  alt="icon" 
                  className="size-8 md:size-12 p-1.5 md:p-2 rounded-full bg-black/10 shrink-0" 
                />
                <span className="text-black">{word.text}</span>
              </span>
            ))}
          </span>
        </span>
      </h1>
      
      <h6 className="mt-2 md:mt-4 text-black">Documentation for</h6>
      <h6 className="text-black">Doers</h6>
    </div>

    {/* CHANGED: text-black/70 is now text-black font-medium for darker visibility */}
    <p className="text-black font-medium md:text-xl max-w-2xl mt-4 relative z-10">
      Turning concepts into code, and code into impact.
    </p>

<Button
  text="Explore"
  className="w-[200px] md:w-60 h-12 md:h-14 mt-6"
  id="explore-cards" // <-- Update this to match the new section!
/>
  </div>
</header>
      </div>
    </section>
  );
};

export default Hero;