import { Link } from "react-router-dom";
import Navbar from "../components/NavBar";
import { useAuth } from "../hooks/useAuth";

const topPlayers = [
  { rank: 1, name: "AlexChen_99", league: "Grandmaster", tier: "Apex Tier", xp: "142,000" },
  { rank: 2, name: "SarahDev", league: "Grandmaster", tier: "Apex Tier", xp: "138,500" },
  { rank: 3, name: "CodeNinja", league: "Grandmaster", tier: "Apex Tier", xp: "135,200" },
  { rank: 4, name: "ByteKing", league: "Champion's League", tier: "Diamond Tier", xp: "98,400" },
  { rank: 5, name: "LogicPro", league: "Champion's League", tier: "Diamond Tier", xp: "96,100" },
];

const Leaderboard = () => {
  const { currentUser } = useAuth();

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      <style>{`
        header.navbar {
          background-color: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>

      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-4 md:px-6 pb-20 w-full max-w-4xl mx-auto">
        <div className="w-full text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Global Rankings
          </h1>
          <p className="text-gray-500 font-semibold mt-2">Demo leaderboard — climb the ranks in the arena.</p>
          {currentUser && (
            <Link to="/chat" className="inline-block mt-4 text-sm font-black uppercase text-purple-600 hover:underline">
              Squad chat
            </Link>
          )}
        </div>

        <div className="w-full bg-white/60 backdrop-blur-lg border border-white/80 rounded-3xl p-4 md:p-8 shadow-lg">
          <div className="hidden md:grid grid-cols-[80px_1fr_1.5fr_120px] gap-4 px-6 py-4 border-b border-gray-200 mb-4">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Rank</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Player</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">League & Tier</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest text-right">XP</div>
          </div>

          <div className="flex flex-col gap-3">
            {Array.isArray(topPlayers) &&
              topPlayers.map((player) => (
                <div
                  key={player.rank}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_1.5fr_120px] gap-2 md:gap-4 items-center px-6 py-4 bg-white/80 rounded-2xl shadow-sm border border-transparent hover:border-purple-100 transition-all"
                >
                  <div className="font-black text-gray-600">#{player.rank}</div>
                  <div className="font-black text-gray-900">{player.name}</div>
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{player.league}</span>
                    <span className="text-xs font-bold text-gray-500 block">{player.tier}</span>
                  </div>
                  <div className="font-black text-purple-600 text-right">{player.xp}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Leaderboard;
