import { useState, useEffect } from "react";

const MatchmakingLoader = ({ onCancel, userPhoto, userName }) => {
  const [dots, setDots] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Animate the "..." loading dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time as 0:00
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-fade-in bg-slate-900/40 backdrop-blur-md">
      
      <style>{`
        .radar-container {
          position: relative;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 2px solid rgba(34, 197, 94, 0.3);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.2) inset;
        }
        .radar-sweep {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: conic-gradient(from 0deg, transparent 70%, rgba(34, 197, 94, 0.6) 100%);
          border-radius: 50%;
          animation: radar-spin 2s linear infinite;
          transform-origin: center;
        }
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-grid {
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
        }
      `}</style>

      <div className="bg-white/90 backdrop-blur-2xl border-2 border-white/60 p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col items-center max-w-md w-full mx-4 text-center relative overflow-hidden">
        
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">
          Searching for Opponent
        </h2>
        <p className="text-green-600 font-bold mb-8 h-6 tracking-widest uppercase text-sm">
          Matchmaking in progress{dots}
        </p>

        <div className="relative flex items-center justify-center mb-10">
          
          {/* Outer Pulsing Rings */}
          <div className="absolute size-[300px] border border-green-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
          <div className="absolute size-[200px] border border-green-500/40 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>

          {/* Radar Base */}
          <div className="radar-container radar-grid flex items-center justify-center relative">
            <div className="radar-sweep"></div>
            
            {/* --- UPDATED: Center User Avatar --- */}
            <div className="relative z-10 size-16 bg-black rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
               {userPhoto ? (
                 <img src={userPhoto} alt="You" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-white font-black text-2xl">{userName?.charAt(0).toUpperCase() || "U"}</span>
               )}
            </div>

            <div className="absolute top-10 right-14 size-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <div className="absolute bottom-16 left-10 size-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" style={{ animationDelay: "0.5s"}}></div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full gap-4">
          <div className="bg-gray-100 rounded-xl px-6 py-3 w-full border border-gray-200">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">time passed</span>
            {/* --- UPDATED: Clean Timer --- */}
            <span className="text-xl font-black text-gray-900 font-mono">
              {formatTime(timeElapsed)}
            </span>
          </div>

          {/* --- UPDATED: Smoother Cancel Button --- */}
          <button 
            onClick={onCancel}
            className="mt-2 text-gray-500 hover:text-red-500 font-bold uppercase text-sm tracking-widest transition-all duration-200 py-2 px-6 rounded-full hover:bg-red-50 active:scale-95 cursor-pointer"
          >
            Cancel Search
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchmakingLoader;