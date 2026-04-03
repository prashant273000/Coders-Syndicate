import { useEffect, useState, useRef } from "react";

const ExploreCards = () => {
  const [typedQuote, setTypedQuote] = useState("");
  // NEW: State to track if we are typing forward or deleting backward
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  
  const quoteToType = "Turning concepts into code, and code into impact.";

  // 1. Observer Effect: Checks when the user scrolls down to this section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 } 
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // 2. Infinite Loop Typewriter Effect
  useEffect(() => {
    if (!isVisible) return;

    // Timing Settings (in milliseconds)
    const typingSpeed = 60;     // Speed of typing each letter
    const deletingSpeed = 30;   // Speed of erasing each letter (usually faster)
    const pauseAtEnd = 4000;    // Wait 4 seconds when the sentence is complete
    const pauseAtStart = 1000;  // Wait 1 second before starting to type again

    let timer;

    if (!isDeleting && typedQuote === quoteToType) {
      // If fully typed, wait 4 seconds, then start deleting
      timer = setTimeout(() => setIsDeleting(true), pauseAtEnd);
    } else if (isDeleting && typedQuote === "") {
      // If fully deleted, wait 1 second, then start typing again
      timer = setTimeout(() => setIsDeleting(false), pauseAtStart);
    } else {
      // The actual typing/deleting action
      timer = setTimeout(() => {
        setTypedQuote((prev) => 
          isDeleting 
            ? quoteToType.substring(0, prev.length - 1) // Remove last letter
            : quoteToType.substring(0, prev.length + 1) // Add next letter
        );
      }, isDeleting ? deletingSpeed : typingSpeed);
    }

    // Cleanup the timer to prevent glitches
    return () => clearTimeout(timer);
  }, [typedQuote, isDeleting, isVisible]);

  return (
    <section 
      id="explore-cards" 
      className="relative w-full z-20 mt-10 md:mt-20 px-5 md:px-12 mb-24"
      ref={sectionRef} 
    >
      
      <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-white/20 backdrop-blur-sm border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] p-8 md:p-20">
        
        {/* Top Section: Typewriter Quote */}
        <div className="w-full mb-10 md:mb-16">
          <div className="typewriter-quote text-left min-h-[100px] md:min-h-[120px]">
            <span className="text-black font-extrabold md:text-5xl text-3xl leading-snug">
              {typedQuote}
              <span className="blinking-cursor text-black font-light ml-1 opacity-60">|</span>
            </span>
          </div>
        </div>

        {/* Bottom Section: Horizontal Action Cards */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
          
          {/* Arena Card */}
          <a href="#arena" className="action-explore-card group w-full md:w-1/2">
            <span className="absolute top-6 right-6 text-white text-2xl opacity-80">⚔️</span>
            <h4 className="text-white font-black text-3xl md:text-4xl tracking-widest uppercase transition-transform duration-300 group-hover:scale-105">
              Arena
            </h4>
          </a>

          {/* Documentation Card */}
          <a href="#documentation" className="action-explore-card group w-full md:w-1/2">
            <span className="absolute top-6 right-6 text-white text-2xl opacity-80">📚</span>
            <h4 className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase transition-transform duration-300 group-hover:scale-105">
              Documentation
            </h4>
          </a>

        </div>
      </div>
    </section>
  );
};

export default ExploreCards;