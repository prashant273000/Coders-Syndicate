import { useState, useContext, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Navbar from "../components/NavBar";
import MatchmakingLoader from "../components/MatchmakingLoader"; 
import { AuthContext } from "../context/AuthContext";

const Arena = () => {
  const [isSearching, setIsSearching] = useState(false);
  
  // --- NEW: FRIEND INVITE STATES ---
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null); // Tracks who we are waiting for

  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); 

  // --- NEW: MOCK FRIENDS LIST ---
  const mockFriends = [
    { id: "1", name: "AlexChen_99", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", status: "Online" },
    { id: "2", name: "SarahDev", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", status: "In a Battle" },
    { id: "3", name: "CodeNinja", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ninja", status: "Online" },
    { id: "4", name: "ByteKing", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Byte", status: "Offline" },
  ];

  // Simulate finding a match after 3.5 seconds (Quick Match)
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

  // --- NEW: SIMULATE FRIEND ACCEPTING INVITE ---
  useEffect(() => {
    let timeout;
    if (pendingInvite) {
      // Simulate the friend accepting the invite after 3 seconds
      timeout = setTimeout(() => {
        setPendingInvite(null);
        setIsInviteModalOpen(false);
        navigate("/battle"); // Jump to battle!
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [pendingInvite, navigate]);

  // --- UPDATED: HANDLE CLICK FOR DIFFERENT MODES ---
  const handleModeClick = (modeId) => {
    if (modeId === "quick") {
      setIsSearching(true);
    } else if (modeId === "friendly") {
      setIsInviteModalOpen(true); // Open the Friends List Modal
    }
  };

  const handleSendInvite = (friend) => {
    if (friend.status === "Offline" || friend.status === "In a Battle") {
      alert(`${friend.name} is currently unavailable.`);
      return;
    }
    setPendingInvite(friend); // Triggers the waiting screen
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setPendingInvite(null); // Cancel the pending invite if closed early
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
      title: "🐺 CLANS",
      description: "Form a squad of 4 members to fight rival clans.",
      btnText: "CREATE CLAN",
      borderColor: "border-pink-400",
      glowClass: "group-hover:shadow-[0_15px_40px_rgba(236,72,153,0.25)]",
      btnClass: "bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/30",
    }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* Background CSS & Orbs */}
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
                
                <button 
                  onClick={() => handleModeClick(mode.id)}
                  className={`mt-8 w-full py-4 text-lg rounded-xl font-black tracking-widest uppercase transition-transform active:scale-95 ${mode.btnClass} cursor-pointer`}
                >
                  {mode.btnText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- RENDER THE LOADER WITH USER PROPS (Quick Match) --- */}
      {isSearching && (
        <MatchmakingLoader 
          onCancel={() => setIsSearching(false)} 
          userPhoto={user?.photoURL}
          userName={user?.displayName || user?.email || "Player"}
        />
      )}

      {/* ========================================= */}
      {/* --- NEW: INVITE FRIEND MODAL ---          */}
      {/* ========================================= */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md relative overflow-hidden animate-slide-up">
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {pendingInvite ? "Waiting for Response" : "Invite to Battle"}
              </h2>
              <button 
                onClick={handleCloseInviteModal}
                className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STATE 1: SHOW FRIENDS LIST */}
            {!pendingInvite ? (
              <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                {mockFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="size-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Status Dot */}
                        <span className={`absolute bottom-0 right-0 size-3.5 border-2 border-white rounded-full ${
                          friend.status === "Online" ? "bg-green-400" : friend.status === "In a Battle" ? "bg-yellow-400" : "bg-gray-400"
                        }`}></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-tight">{friend.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{friend.status}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleSendInvite(friend)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        friend.status === "Online" 
                          ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/30 active:scale-95 cursor-pointer" 
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              
              /* STATE 2: WAITING FOR FRIEND TO ACCEPT */
              <div className="flex flex-col items-center justify-center py-8 relative z-10">
                <div className="relative flex items-center justify-center mb-6">
                  {/* Pulsing rings */}
                  <div className="absolute size-32 border-2 border-cyan-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute size-24 border-2 border-cyan-400/60 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                  
                  {/* Friend Avatar in center */}
                  <div className="relative z-10 size-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                    <img src={pendingInvite.photoURL} alt={pendingInvite.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-1 text-center">Invited {pendingInvite.name}</h3>
                <p className="text-sm font-bold text-cyan-600 uppercase tracking-widest animate-pulse">
                  Awaiting Acceptance...
                </p>
                
                <button 
                  onClick={handleCloseInviteModal}
                  className="mt-8 text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors border border-gray-200 px-6 py-2 rounded-full hover:bg-red-50 cursor-pointer"
                >
                  Cancel Invite
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </main>
  );
};

export default Arena;