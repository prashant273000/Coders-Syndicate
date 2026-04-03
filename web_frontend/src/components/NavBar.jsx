import { useState, useEffect } from "react";
import { navLinks } from "../constants";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="inner">
        
        {/* LEFT: Logo */}
        <a href="#hero" className="logo">
          <img src="/images/logo1.png" alt="Logo" className="w-8 h-8" />
          <span className="hidden sm:inline">website name</span>
        </a>

{/* 2. MIDDLE: Navigation Links (Bulletproof Tailwind version) */}
        <nav className="hidden md:flex items-center">
          <ul className="flex space-x-8">
            {navLinks.map(({ link, name }) => (
              <li key={name} className="group relative">
                
                {/* The Link Text */}
                {/* The Link Text - Darkened text-black/80 to text-black font-bold */}
<a 
  href={link} 
  className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide"
>
  {name}
</a>

                {/* The Animated Underline */}
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-black transition-all duration-300 ease-out group-hover:w-full"></span>
                
              </li>
            ))}
          </ul>
        </nav>

{/* RIGHT: Actions (Optimized for space) */}
<div className="right-actions">
  <div className="hidden md:flex items-center gap-3">
    {/* ADDED 'chat-btn' */}
    <button className="action-icon-btn animate-pop chat-btn" aria-label="Chat">💬</button>
    {/* ADDED 'theme-btn' */}
    <button className="action-icon-btn animate-pop theme-btn" aria-label="Theme">🌓</button>
  </div>

  {/* ADDED 'group relative' for the underline animation */}
  <button className="login-text group relative">
    Login
    {/* ADDED the underline span */}
    <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
  </button>

  <a href="#profile" className="profile-pill">
    MyProfile
  </a>

  <button 
    className="md:hidden text-2xl ml-2" 
    onClick={() => setIsOpen(!isOpen)}
  >
    {isOpen ? "✕" : "☰"}
  </button>
</div>
      </div>

      {/* MOBILE DROPDOWN: Shows when isOpen is true */}
      {isOpen && (
        <div className="mobile-menu md:hidden">
          {navLinks.map(({ link, name }) => (
            <a key={name} href={link} onClick={() => setIsOpen(false)}>{name}</a>
          ))}
        </div>
      )}
    </header>
  );
}

export default NavBar;