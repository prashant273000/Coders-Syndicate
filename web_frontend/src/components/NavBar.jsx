import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; 
import { navLinks } from "../constants";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // =========================================
  // --- XSYNDICATE CHATBOT STATE ---
  // =========================================
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef(null);

  // Initial messages
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Got questions? I'm here to clarify... ask about specific sections or concepts!" },
    { id: 2, sender: "user", text: "Explain the \"Advanced Patterns\" section... it's making me a bit confused!" }
  ]);

  const mockUserData = {
    name: "Hacker", email: "hacker@gmail.com", rank: "Diamond Tier", league: "Champion's League",
    currentRank: "#1,024", xpEarned: "24,500", docsRead: 142, battlesWon: 87, battlesLost: 12, photoURL: null 
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // =========================================
  // --- CHATBOT FUNCTIONS (API DROP ZONES) --
  // =========================================
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newUserMsg = { id: Date.now(), sender: "user", text: chatInput };
    setMessages((prev) => [...prev, newUserMsg]);
    setChatInput("");
    setIsAiTyping(true);

    // 🟢 YOUR LLM API GOES HERE 🟢
    setTimeout(() => {
      const aiResponse = { id: Date.now() + 1, sender: "ai", text: "Advanced Patterns involve higher-level architecture like State Management and Custom Hooks. Let's break it down step-by-step!" };
      setMessages((prev) => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // 🟢 STOP RECORDING & CALL ELEVENLABS API HERE 🟢
      setIsRecording(false);
      setChatInput("Simulated voice input..."); 
    } else {
      // 🟢 START RECORDING AUDIO HERE 🟢
      setIsRecording(true);
    }
  };

  return (
    <>
      <header className={`navbar ${scrolled ? "scrolled" : "not-scrolled"}`}>
        <div className="inner">
          <Link to="/" className="logo flex items-center gap-3 transition-transform hover:scale-105 w-fit">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-white shadow-md">
              <img src="/images/web_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:inline text-black font-extrabold text-xl md:text-2xl [text-shadow:0_2px_8px_#9333ea] tracking-tight">Coder_Syndicate</span>
          </Link>

          <nav className="hidden md:flex items-center">
            <ul className="flex space-x-8">
              {navLinks.map(({ link, name }) => (
                <li key={name} className="group relative">
                  {name === "Home" ? (
                    <Link to="/" className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide">{name}</Link>
                  ) : (
                    <a href={link.startsWith('#') ? `/${link}` : link} className="text-black font-bold hover:text-gray-700 transition-colors pb-1 tracking-wide">{name}</a>
                  )}
                  <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-black transition-all duration-300 ease-out group-hover:w-full"></span>
                </li>
              ))}
            </ul>
          </nav>

          <div className="right-actions">
            <div className="hidden md:flex items-center gap-4">
              
              {/* --- UPDATED NAVBAR BOT ICON --- */}
              <button 
                className={`relative size-10 md:size-11 flex items-center justify-center rounded-full overflow-hidden transition-all shadow-md hover:scale-110 ${isChatOpen ? 'ring-2 ring-purple-500 border-2 border-white' : 'border-2 border-transparent hover:border-gray-200'}`} 
                aria-label="Toggle XSyndicate"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                {/* Ensure you have bot-avatar.png in your images folder! */}
                <img src="/images/bot-avatar.png" alt="XSyndicate" className="w-full h-full object-cover bg-black" />
              </button>
            </div>

            {user ? (
              <button className="profile-avatar-btn cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300 ml-2" onClick={() => setIsProfileModalOpen(true)} title="View Profile">
                {user.photoURL ? <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>}
              </button>
            ) : (
              <button className="login-text group relative ml-2" onClick={() => setUser(mockUserData)}>Login<span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span></button>
            )}
            <button className="md:hidden text-2xl ml-2" onClick={() => setIsOpen(!isOpen)}>{isOpen ? "✕" : "☰"}</button>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* --- XSYNDICATE FLOATING CHAT WINDOW ---   */}
      {/* ========================================= */}
      {isChatOpen && (
        <div 
          dir="rtl" /* TRICK: Flips the resize handle to the bottom-left! */
          className="fixed top-24 right-6 w-[400px] h-[600px] min-w-[320px] max-w-[90vw] min-h-[400px] max-h-[85vh] rounded-[2rem] z-[300] resize overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fade-in border border-white/40"
        >
          {/* Inner container resets direction to normal so text reads left-to-right */}
          <div dir="ltr" className="relative w-full h-full flex flex-col bg-white/40 backdrop-blur-2xl">
            
            {/* BACKGROUND CIRCUIT IMAGE - Less blurry, much more visible! */}
            <div 
              className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: "url('/images/circuit-bg.png')" }} 
            ></div>

            {/* Chat Header */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  
                  {/* UPDATED CHAT HEADER BOT ICON */}
                  <div className="size-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 overflow-hidden bg-black">
                    <img src="/images/bot-avatar.png" alt="XSyndicate" className="w-full h-full object-cover" />
                  </div>

                  <span className="absolute bottom-0 right-0 size-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm"></span>
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight tracking-wide">XSyndicate</h3>
                  <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest opacity-80">Digital Assistant | DP</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="size-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/60 text-gray-700 transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Area */}
            <div ref={chatScrollRef} className="relative z-10 flex-grow overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full animate-slide-up ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 text-sm font-semibold leading-relaxed shadow-md backdrop-blur-md ${
                    msg.sender === "user" 
                      ? "bg-indigo-600/90 text-white rounded-[1.5rem] rounded-br-sm border border-indigo-400/50" 
                      : "bg-white/70 text-gray-900 rounded-[1.5rem] rounded-bl-sm border border-white/60"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {isAiTyping && (
                <div className="flex w-full justify-start animate-slide-up">
                  <div className="px-5 py-4 bg-white/70 backdrop-blur-md border border-white/60 rounded-[1.5rem] rounded-bl-sm shadow-md flex gap-1.5 items-center">
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce"></div>
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="size-2 bg-indigo-600/70 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="relative z-10 p-4 border-t border-white/40 bg-white/30 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <button 
                  type="button"
                  onClick={handleVoiceRecord}
                  className={`absolute left-2 size-10 flex items-center justify-center rounded-full transition-all ${
                    isRecording ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse" : "bg-white/50 hover:bg-white text-gray-700 shadow-sm"
                  }`}
                  title="Voice Input"
                >
                  🎙️
                </button>

                <input 
                  type="text" 
                  placeholder="Ask XSyndicate..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-white/60 border border-white/80 rounded-full py-3.5 pl-14 pr-14 outline-none focus:bg-white/90 focus:ring-2 focus:ring-indigo-400 transition-all text-sm font-bold shadow-inner placeholder-gray-500"
                />

                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className={`absolute right-2 size-10 flex items-center justify-center rounded-full transition-all ${
                    chatInput.trim() ? "bg-indigo-600 text-white shadow-lg hover:scale-105" : "bg-black/10 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  ↑
                </button>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* --- MASSIVE ANIMATED PROFILE DASHBOARD (Unchanged) --- */}
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