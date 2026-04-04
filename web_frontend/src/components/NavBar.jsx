import { useState, useEffect, useContext, useRef } from "react"; // <-- Added useRef here!
import { Link } from "react-router-dom"; 
import { navLinks } from "../constants";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/auth";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null); 

  // =========================================
  // --- MISSING CHATBOT STATE ADDED BACK ---
  // =========================================
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Got questions? I'm here to clarify... ask about specific sections or concepts!" }
  ]);

  // Get the Firebase user from context
  const { user } = useContext(AuthContext);

  // When Firebase user logs in, call your backend to get/create MongoDB user
  useEffect(() => {
    const fetchUserFromBackend = async () => {
      if (!user) {
        setDbUser(null);
        return;
      }
      if (dbUser && dbUser.uid === user.uid) return;

      try {
        const token = await user.getIdToken();

        const res = await fetch("http://localhost:5000/api/auth", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setDbUser(data.user); 
      } catch (err) {
        console.error("Failed to fetch user from backend:", err);
      }
    };

    fetchUserFromBackend();
  }, [user]); 

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Chatbot auto-scroll effect
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  const sendAudioToBackend = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const res = await fetch("http://localhost:5000/api/voice/ask", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Voice request failed");
  }

  return data;
};

  const handleLogout = async () => {
    await logout();
    setDbUser(null);
    setIsProfileModalOpen(false);
  };

  // =========================================
  // --- MISSING CHATBOT FUNCTIONS ADDED BACK ---
  // =========================================
  const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!chatInput.trim()) return;

  const userMessage = chatInput.trim();

  const newUserMsg = {
    id: Date.now(),
    sender: "user",
    text: userMessage,
  };

  setMessages((prev) => [...prev, newUserMsg]);
  setChatInput("");
  setIsAiTyping(true);

  try {
    const res = await fetch("http://localhost:5000/api/voice/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Text chat failed");
    }

    const aiResponse = {
      id: Date.now() + 1,
      sender: "ai",
      text: data.reply,
    };

    setMessages((prev) => [...prev, aiResponse]);
  } catch (err) {
    console.error("Text chat error:", err);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "ai",
        text: "Sorry, something went wrong while getting the response.",
      },
    ]);
  } finally {
    setIsAiTyping(false);
  }
};

 const handleVoiceRecord = async () => {
  try {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    audioChunksRef.current = [];
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      try {
        setIsRecording(false);
        setIsAiTyping(true);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const data = await sendAudioToBackend(audioBlob);

        const userMsg = {
          id: Date.now(),
          sender: "user",
          text: data.transcript,
        };

        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: data.reply,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
      } catch (err) {
        console.error("Voice chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: "ai",
            text: "Sorry, I could not process your voice message.",
          },
        ]);
      } finally {
        setIsAiTyping(false);
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  } catch (err) {
    console.error("Microphone error:", err);
    alert("Microphone access failed.");
    setIsRecording(false);
  }
};

  // Use real data from MongoDB, fall back to Firebase data if DB hasn't responded yet
  const displayUser = dbUser
    ? {
        name: dbUser.name,
        email: dbUser.email,
        photoURL: dbUser.picture,
        rank: "Diamond Tier",       // swap with real DB fields later
        league: "Champion's League",
        currentRank: "#1,024",
        xpEarned: "24,500",
        docsRead: 142,
        battlesWon: 87,
        battlesLost: 12,
      }
    : user
    ? {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        rank: "—",
        league: "—",
        currentRank: "—",
        xpEarned: "—",
        docsRead: 0,
        battlesWon: 0,
        battlesLost: 0,
      }
    : null;

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
              
              <button 
                className={`relative size-10 md:size-11 flex items-center justify-center rounded-full overflow-hidden transition-all shadow-md hover:scale-110 ${isChatOpen ? 'ring-2 ring-purple-500 border-2 border-white' : 'border-2 border-transparent hover:border-gray-200'}`} 
                aria-label="Toggle XSyndicate"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <img src="/images/bot-avatar.png" alt="XSyndicate" className="w-full h-full object-cover bg-black" />
              </button>
            </div>

            {displayUser ? (
              <button
                className="profile-avatar-btn cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300"
                onClick={() => setIsProfileModalOpen(true)}
                title="View Profile"
              >
                {displayUser.photoURL ? (
                  <img src={displayUser.photoURL} alt={displayUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {displayUser.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            ) : (
              <a href="/login" className="login-text group relative">
                Login
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"></span>
              </a>
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
          dir="rtl"
          className="fixed top-24 right-6 w-[400px] h-[600px] min-w-[320px] max-w-[90vw] min-h-[400px] max-h-[85vh] rounded-[2rem] z-[300] resize overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-fade-in border border-white/40"
        >
          <div dir="ltr" className="relative w-full h-full flex flex-col bg-white/40 backdrop-blur-2xl">
            
            <div 
              className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: "url('/images/circuit-bg.png')" }} 
            ></div>

            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="relative">
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


      {/* --- MASSIVE ANIMATED PROFILE DASHBOARD --- */}
      {isProfileModalOpen && displayUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in">
          
          <div className="relative w-full md:w-[85vw] max-w-[1400px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/50 flex flex-col animate-modal-pop">

            <div className="absolute top-8 right-8 flex items-center gap-6 z-10">
              <button
                className="text-xs md:text-sm font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                onClick={handleLogout}
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
                  {displayUser.photoURL ? (
                    <img src={displayUser.photoURL} alt={displayUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-6xl">{displayUser.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">{displayUser.name}</h3>
                <p className="text-lg md:text-xl font-bold text-gray-500 mt-1">{displayUser.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4 lg:pt-16 animate-stagger-2">
                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">🏆</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Standing</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{displayUser.rank}</h4>
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-1.5">{displayUser.league}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">🎯</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Global Rank</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{displayUser.currentRank}</h4>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mt-1.5">Top 5%</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/80 px-5 py-5 rounded-[1.5rem] border border-gray-200 shadow-sm h-full hover:-translate-y-1 transition-transform">
                  <div className="size-12 md:size-14 flex items-center justify-center bg-[#1a1a1a] rounded-full text-xl shadow-inner shrink-0">⚡</div>
                  <div className="text-left">
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total XP</p>
                    <h4 className="text-lg md:text-xl font-black text-black leading-none">{displayUser.xpEarned}</h4>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1.5">Level 42</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-auto animate-stagger-3">
              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">📚</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.docsRead}</span>
                <span className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Documentation Read</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">⚔️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.battlesWon}</span>
                <span className="text-xs md:text-sm font-bold text-green-400 uppercase tracking-widest mt-4">Battles Won</span>
              </div>

              <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 flex flex-col justify-center items-center text-center shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 border border-neutral-800">
                <span className="text-4xl md:text-5xl mb-4 opacity-90">🛡️</span>
                <span className="text-6xl md:text-7xl font-black text-white">{displayUser.battlesLost}</span>
                <span className="text-xs md:text-sm font-bold text-red-400 uppercase tracking-widest mt-4">Battles Lost</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;