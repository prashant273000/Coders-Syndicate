import { useState, useEffect } from "react";
import { navLinks } from "../constants";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // STATE: To hold user data. If null, the user is logged out.
  const [user, setUser] = useState(null);

  // MOCK USER DATA:
  const mockUserData = {
    name: "Hacker",
    photoURL: null // e.g., "https://i.pravatar.cc/150?img=11"
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : "not-scrolled"}`}>
      <div className="inner">
        
        {/* LEFT: Logo */}
        <a href="#hero" className="logo">
          <img src="/images/logo1.png" alt="Logo" className="w-8 h-8" />
          <span className="hidden sm:inline">website name</span>
        </a>

        {/* MIDDLE: Navigation Links */}
        <nav className="hidden md:flex items-center">
          <ul className="flex space-x-8">
            {navLinks.map(({ link, name }) => (
              <li key={name} className="group relative">
                <a 
                  href={link} 
                  className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide"
                >
                  {name}
                </a>
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-black transition-all duration-300 ease-out group-hover:w-full"></span>
              </li>
            ))}
          </ul>
        </nav>

        {/* RIGHT: Actions */}
        <div className="right-actions">
          <div className="hidden md:flex items-center gap-3">
            <button className="action-icon-btn animate-pop chat-btn" aria-label="Chat">💬</button>
            <button className="action-icon-btn animate-pop theme-btn" aria-label="Theme">🌓</button>
          </div>

          {/* CONDITIONAL RENDERING: Avatar vs Login */}
          {user ? (
            /* IF LOGGED IN: Show Circular Avatar (Logout removed!) */
            <div 
              className="profile-avatar-btn cursor-default" // Added cursor-default so it doesn't look clickable yet
              title="My Profile"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ) : (
            /* IF LOGGED OUT: Show Login button */
            <button 
              className="login-text group relative"
              onClick={() => setUser(mockUserData)} // Clicking simulates logging in
            >
              Login
              <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl ml-2" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
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