import { useState, useContext, useEffect } from "react"; // Add useEffect
import { useNavigate } from "react-router-dom"; // Add useNavigate
import Navbar from "../components/NavBar";
import MatchmakingLoader from "../components/MatchmakingLoader"; 
import { AuthContext } from "../context/AuthContext";

const Arena = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize navigate

  // Simulate finding a match after 3.5 seconds
  useEffect(() => {
    let timeout;
    if (isSearching) {
      timeout = setTimeout(() => {
        setIsSearching(false); // Close loader
        navigate("/battle"); // GO TO BATTLE!
      }, 3500); 
    }
    return () => clearTimeout(timeout);
  }, [isSearching, navigate]);

  const handleModeClick = (modeId) => {
    if (modeId === "quick") {
      setIsSearching(true);
    }
    if (modeId === "clans") {
      navigate("/chat");
    }
  };

  const gameModes = [
    {
      id: "quick",
      title: "⚔️ QUICK MATCH",
      description: "Find a 1vs1 opportunity. Matchmaking currently active.",
      btnText: "FIND MATCH",
      borderColor: "border-green-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(34,197,94,0.25)]",
      btnClass: "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/30",
    },
    {
      id: "friendly",
      title: "🤝 FRIENDLY MATCH",
      description: "Invite your friends to a private coding battle.",
      btnText: "INVITE FRIEND",
      borderColor: "border-cyan-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(34,211,238,0.25)]",
      btnClass: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md shadow-cyan-500/30",
    },
    {
      id: "learning-duels",
      title: "📚 LEARNING DUELS",
      description: "Pair up to master new concepts and solve challenges together.",
      btnText: "START DUEL",
      borderColor: "border-purple-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(168,85,247,0.25)]",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30",
    },
    {
      id: "clans",
      title: "💬 SQUAD CHAT",
      description: "Drop into live world and private chat with your syndicate.",
      btnText: "OPEN CHAT",
      borderColor: "border-pink-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(236,72,153,0.25)]",
      btnClass: "bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/30",
    }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* (Your existing Background CSS & Orbs remain exactly the same) */}
      <style>{`
        header.navbar {
          background-color: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
        }
        .light-grid {
          background-size: 60px 60px;
          background-image:
            linear-gradient(to right, rgba(168, 85, 247, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.15) 1px, transparent 1px);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
        }
        .purple-text-shadow {
          text-shadow: 0px 10px 30px rgba(168, 85, 247, 0.5);
        }
        @keyframes floatTitle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-title {
          animation: floatTitle 4s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute inset-0 light-grid z-10"></div>
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-6 pb-20">
        <div className="flex flex-col items-center animate-fade-in mb-16 mt-4">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 uppercase tracking-tight animate-float-title purple-text-shadow">
            Enter The Arena
          </h1>
        </div>

        <div className="w-full max-w-6xl relative flex items-center justify-center mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full z-10">
            {gameModes.map((mode, index) => (
              <div 
                key={mode.id}
                className={`group bg-white/70 backdrop-blur-xl border-2 ${mode.borderColor} rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[280px] transition-all duration-300 hover:-translate-y-2 ${mode.glowClass} shadow-sm`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center gap-3">
                    {mode.title}
                  </h3>
                  <p className="text-gray-600 font-semibold text-base leading-relaxed pr-4">
                    {mode.description}
                  </p>
                </div>
                
                {/* --- ADDED onClick HANDLER HERE --- */}
                <button 
                  onClick={() => handleModeClick(mode.id)}
                  className={`mt-8 w-full py-4 text-lg rounded-xl font-black tracking-widest uppercase transition-transform active:scale-95 ${mode.btnClass}`}
                >
                  {mode.btnText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

{/* --- RENDER THE LOADER WITH USER PROPS --- */}
      {isSearching && (
        <MatchmakingLoader 
          onCancel={() => setIsSearching(false)} 
          userPhoto={user?.photoURL}
          userName={user?.displayName || user?.email || "Player"}
        />
      )}

    </main>
  );
};


export default Arena;