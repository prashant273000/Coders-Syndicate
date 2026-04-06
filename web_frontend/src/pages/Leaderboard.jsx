import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/NavBar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/leaderboard`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch leaderboard: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Leaderboard data:", data);
        setPlayers(data);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Format XP with commas
  const formatXP = (xp) => {
    return xp.toLocaleString();
  };

  // Get rank badge color
  const getRankBadge = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

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
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[500px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
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
          <p className="text-gray-500 font-semibold mt-2">
            {loading ? "Loading rankings..." : `Top ${players.length} players worldwide`}
          </p>
        </div>

        <div className="w-full bg-white/60 backdrop-blur-lg border border-white/80 rounded-3xl p-4 md:p-8 shadow-lg">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-[80px_1fr_1.5fr_120px] gap-4 px-6 py-4 border-b border-gray-200 mb-4">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Rank</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Player</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">League & Tier</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest text-right">XP</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="size-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-bold">Loading rankings...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-4">⚠️</span>
              <p className="text-red-500 font-bold mb-2">Failed to load leaderboard</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && players.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-4">🏆</span>
              <p className="text-gray-500 font-bold mb-2">No players yet</p>
              <p className="text-gray-400 text-sm">Be the first to climb the rankings!</p>
            </div>
          )}

          {/* Players List */}
          {!loading && !error && players.length > 0 && (
            <div className="flex flex-col gap-3">
              {players.map((player) => (
                <div
                  key={player.rank}
                  className="grid grid-cols-1 md:grid-cols-[80px_1fr_1.5fr_120px] gap-2 md:gap-4 items-center px-6 py-4 bg-white/80 rounded-2xl shadow-sm border border-transparent hover:border-purple-100 transition-all hover:shadow-md"
                >
                  {/* Rank */}
                  <div className={`font-black text-lg ${
                    player.rank === 1 ? 'text-yellow-500' :
                    player.rank === 2 ? 'text-gray-400' :
                    player.rank === 3 ? 'text-amber-600' :
                    'text-gray-600'
                  }`}>
                    {getRankBadge(player.rank)}
                  </div>

                  {/* Player Name */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                      {player.photoURL ? (
                        <img src={player.photoURL} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-sm">
                            {player.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="font-black text-gray-900 truncate">
                      {player.name || `Player_${player.uid?.slice(0, 6)}`}
                    </span>
                  </div>

                  {/* League & Tier */}
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{player.league}</span>
                    <span className="text-xs font-bold text-gray-500 block">{player.tier}</span>
                  </div>

                  {/* XP */}
                  <div className="font-black text-purple-600 text-right text-lg">
                    {formatXP(player.xpEarned)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Leaderboard;