import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const ExploreCards = () => {
  const navigate = useNavigate();
  
  const [typedQuote, setTypedQuote] = useState("");
  // STATE: Tracks if we are currently erasing the text
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const quoteToType = "Turning concepts into code, and code into impact.";

  // 1. Observer: Waits until user scrolls down to start the animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // 2. The Infinite Looping Typewriter Logic
  useEffect(() => {
    if (!isVisible) return;

    const typingSpeed = 60;     // Speed of typing
    const deletingSpeed = 30;   // Speed of erasing (faster looks better)
    const pauseAtEnd = 4000;    // Wait 4 seconds when fully typed
    const pauseAtStart = 1000;  // Wait 1 second before re-typing

    let timer;

    if (!isDeleting && typedQuote === quoteToType) {
      // If fully typed out, pause for 4 seconds then start deleting
      timer = setTimeout(() => setIsDeleting(true), pauseAtEnd);
    } else if (isDeleting && typedQuote === "") {
      // If fully erased, pause for 1 second then start typing again
      timer = setTimeout(() => setIsDeleting(false), pauseAtStart);
    } else {
      // The actual typing/erasing action
      timer = setTimeout(() => {
        setTypedQuote((prev) =>
          isDeleting
            ? quoteToType.substring(0, prev.length - 1)
            : quoteToType.substring(0, prev.length + 1)
        );
      }, isDeleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [typedQuote, isDeleting, isVisible]);

  return (
    <section
      id="explore-cards"
      className="relative w-full z-20 mt-10 md:mt-20 px-5 md:px-12 mb-24"
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-white/20 backdrop-blur-sm border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] p-8 md:p-20">

        <div className="w-full mb-10 md:mb-16">
          {/* min-h ensures the box doesn't collapse when text is fully erased */}
          <div className="typewriter-quote text-left min-h-[100px] md:min-h-[120px]">
            <span className="text-black font-extrabold md:text-5xl text-3xl leading-snug">
              {typedQuote}
              <span className="blinking-cursor text-black font-light ml-1 opacity-60">|</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
          
          {/* --- UPDATED ARENA CARD --- */}
          <div 
            onClick={() => navigate('/arena')} 
            className="relative group flex flex-col justify-center items-center w-full md:w-1/2 h-[140px] md:h-[180px] rounded-[2.5rem] bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.4)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 overflow-hidden border border-purple-400/50 cursor-pointer"
          >
            {/* Glassy reflection overlay */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Icon */}
            <div className="absolute top-5 right-6 md:top-6 md:right-8 text-2xl md:text-3xl opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12">
              ⚔️
            </div>
            
            {/* Text */}
            <h4 className="text-white font-black text-3xl md:text-4xl tracking-widest uppercase relative z-10 drop-shadow-md">
              Arena
            </h4>
          </div>

          {/* --- UPDATED DOCUMENTATION CARD --- */}
          <div
            onClick={() => navigate('/documentation')}
            className="relative group flex flex-col justify-center items-center w-full md:w-1/2 h-[140px] md:h-[180px] rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-cyan-500 text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95 overflow-hidden border border-indigo-400/50 cursor-pointer"
          >
            {/* Glassy reflection overlay */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Floating Icon */}
            <div className="absolute top-5 right-6 md:top-6 md:right-8 text-2xl md:text-3xl opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
              📚
            </div>
            
            {/* Text */}
            <h4 className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase relative z-10 drop-shadow-md">
              Documentation
            </h4>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ExploreCards;