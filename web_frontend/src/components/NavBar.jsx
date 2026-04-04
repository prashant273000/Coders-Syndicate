import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { navLinks } from "../constants";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const mockUserData = {
    name: "Hacker",
    email: "hacker@gmail.com",
    rank: "Diamond Tier",
    league: "Champion's League",
    currentRank: "#1,024",  
    xpEarned: "24,500",     
    docsRead: 142,
    battlesWon: 87,
    battlesLost: 12,
    photoURL: null 
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`navbar ${scrolled ? "scrolled" : "not-scrolled"}`}>
        <div className="inner">
          
          {/* ========================================= */}
          {/* --- YOUR NEW LOGO DESIGN INTEGRATED ---   */}
          {/* ========================================= */}
{/* Added 'w-fit' here so the clickable area doesn't stretch! */}
          <Link to="/" className="logo flex items-center gap-3 transition-transform hover:scale-105 w-fit">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-white shadow-md">
              <img 
                src="/images/web_logo.jpeg" 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            </div>

            <span className="hidden sm:inline text-black font-extrabold text-xl md:text-2xl [text-shadow:0_2px_8px_#9333ea] tracking-tight">
              Coder_Syndicate
            </span>
          </Link>

          {/* MIDDLE: Navigation Links */}
          <nav className="hidden md:flex items-center">
            <ul className="flex space-x-8">
              {navLinks.map(({ link, name }) => (
                <li key={name} className="group relative">
                  
                  {name === "Home" ? (
                    <Link 
                      to="/" 
                      className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide"
                    >
                      {name}
                    </Link>
                  ) : (
                    <a 
                      href={link.startsWith('#') ? `/${link}` : link} 
                      className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide"
                    >
                      {name}
                    </a>
                  )}

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

            {user ? (
              <button 
                className="profile-avatar-btn cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300"
                onClick={() => setIsProfileModalOpen(true)}
                title="View Profile"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <button className="login-text group relative" onClick={() => setUser(mockUserData)}>
                Login
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
              </button>
            )}

            <button className="md:hidden text-2xl ml-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN */}
        {isOpen && (
          <div className="mobile-menu md:hidden z-[100]">
            {navLinks.map(({ link, name }) => (
              name === "Home" ? (
                <Link key={name} to="/" onClick={() => setIsOpen(false)} className="text-lg font-semibold text-black hover:text-black/70">
                  {name}
                </Link>
              ) : (
                <a key={name} href={link.startsWith('#') ? `/${link}` : link} onClick={() => setIsOpen(false)} className="text-lg font-semibold text-black hover:text-black/70">
                  {name}
                </a>
              )
            ))}
          </div>
        )}
      </header>

      {/* --- MASSIVE ANIMATED PROFILE DASHBOARD --- */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in">
          
          <div className="relative w-full md:w-[85vw] max-w-[1400px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/50 flex flex-col animate-modal-pop">
            
            <div className="absolute top-8 right-8 flex items-center gap-6 z-10">
              <button 
                className="text-xs md:text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                onClick={() => { setUser(null); setIsProfileModalOpen(false); }}
              >
                Logout
              </button>
              <button 
                className="size-10 md:size-12 flex items-center justify-center rounded-full bg-black/5 text-gray-500 hover:text-black hover:bg-black/10 hover:rotate-90 transition-all duration-300 text-xl font-bold"
                onClick={() => setIsProfileModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start w-full mt-10 md:mt-0 mb-12 gap-8">
              
              <div className="flex flex-col items-start shrink-0 animate-stagger-1">
                <div className="size-28 md:size-40 rounded-full bg-black shadow-2xl flex justify-center items-center overflow-hidden border-4 border-white mb-6">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-6xl">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">{user.name}</h3>
                <p className="text-lg md:text-xl font-bold text-gray-500 mt-1">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4 lg:pt-16 animate-stagger-2">
                
                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">🏆</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Standing</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{user.rank}</h4>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1.5">{user.league}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">🎯</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Global Rank</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{user.currentRank}</h4>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-1.5">Top 5%</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">⚡</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total XP</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{user.xpEarned}</h4>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1.5">Level 42</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto animate-stagger-3">
              
              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">📚</span>
                <span className="text-6xl md:text-7xl font-black text-white">{user.docsRead}</span>
                <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Documentation Read</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">⚔️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{user.battlesWon}</span>
                <span className="text-xs md:text-sm font-bold text-green-400 uppercase tracking-widest mt-4">Battles Won</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">🛡️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{user.battlesLost}</span>
                <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-widest mt-4">Battles Lost</span>
              </div>

            </div>
            
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;