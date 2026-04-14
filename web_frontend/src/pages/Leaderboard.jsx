import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/NavBar";

const Leaderboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchLeaderboardData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.log("User not logged in");
        return;
      }

      const loggedInUid = user.uid;

      const [leaderboardRes, currentUserRes] = await Promise.all([
        axios.get("http://localhost:5000/api/leaderboard"),
        axios.get(`http://localhost:5000/api/leaderboard/user/${loggedInUid}`)
      ]);

      setTopPlayers(leaderboardRes.data);
      setCurrentUser(currentUserRes.data);

    } catch (error) {
      console.error("LEADERBOARD FETCH ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchLeaderboardData();
}, []);

    if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-gray-600">Loading leaderboard...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-red-500">Failed to load leaderboard.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* ========================================= */}
      {/* --- PAGE SPECIFIC CSS & BACKGROUND ---    */}
      {/* ========================================= */}
      <style>{`
        header.navbar {
          background-color: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(16px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>

      {/* The Blurred Orbs Background */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      {/* ========================================= */}
      {/* --- LEADERBOARD CONTENT ---               */}
      {/* ========================================= */}
      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-4 md:px-6 pb-20 w-full max-w-6xl mx-auto">
        
        {/* Page Title */}
        <div className="w-full text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight drop-shadow-sm">
            Global Rankings
          </h1>
          <p className="text-gray-500 font-semibold mt-2">See where you stand among the best.</p>
        </div>

        {/* ========================================= */}
        {/* 1. TOP SECTION: CURRENT USER DASHBOARD    */}
        {/* ========================================= */}
        <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-900/5 mb-10 animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          
          {/* Left: Profile Pic & Name */}
          <div className="flex items-center gap-5 w-full md:w-auto justify-center md:justify-start">
            <div className="size-16 md:size-20 rounded-full bg-black flex items-center justify-center text-3xl font-black text-white shadow-lg border-4 border-white shrink-0">
              {currentUser.picture ? (
                <img src={currentUser.picture} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                currentUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Standing</p>
              <h2 className="text-2xl font-black text-gray-900 leading-none">{currentUser.name}</h2>
              <p className="text-sm font-bold text-purple-600 mt-1">Rank #{currentUser.rank}</p>
            </div>
          </div>

          {/* Desktop Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200"></div>

          {/* Middle 1: Rank/Tier */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <div className="size-12 rounded-full bg-indigo-50 flex items-center justify-center text-2xl shadow-inner border border-indigo-100">🏆</div>
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Tier</p>
              <h3 className="text-lg font-black text-gray-900 leading-none">{currentUser.tier}</h3>
            </div>
          </div>

          {/* Desktop Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200"></div>

          {/* Middle 2: League */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <div className="size-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl shadow-inner border border-purple-100">⚔️</div>
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active League</p>
              <h3 className="text-lg font-black text-gray-900 leading-none">{currentUser.league}</h3>
            </div>
          </div>

          {/* Desktop Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200"></div>

          {/* Right: XP */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <div className="size-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl shadow-inner border border-orange-100">⚡</div>
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total XP</p>
              <h3 className="text-lg font-black text-orange-600 leading-none">{currentUser.xp.toLocaleString()}</h3>
            </div>
          </div>

        </div>

        {/* ========================================= */}
        {/* 2. BOTTOM SECTION: LEADERBOARD TABLE      */}
        {/* ========================================= */}
        <div className="w-full bg-white/60 backdrop-blur-lg border border-white/80 rounded-3xl p-4 md:p-8 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[80px_1fr_1.5fr_120px] gap-4 px-6 py-4 border-b border-gray-200 mb-4">
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Rank</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Player</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">League & Tier</div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest text-right">XP</div>
          </div>

          {/* Table Rows (Top Players) */}
          <div className="flex flex-col gap-3">
            {topPlayers.map((player) => (
              <div 
                key={player.rank} 
                className="grid grid-cols-1 md:grid-cols-[80px_1fr_1.5fr_120px] gap-2 md:gap-4 items-center px-6 py-4 bg-white/80 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-purple-100 transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Rank */}
                <div className="flex items-center gap-2">
                  <span className="md:hidden text-xs font-bold text-gray-400 uppercase">Rank: </span>
                  <div className={`size-8 rounded-full flex items-center justify-center font-black text-sm ${
                    player.rank === 1 ? "bg-yellow-100 text-yellow-600" :
                    player.rank === 2 ? "bg-gray-200 text-gray-600" :
                    player.rank === 3 ? "bg-orange-100 text-orange-700" :
                    "text-gray-500"
                  }`}>
                    #{player.rank}
                  </div>
                </div>

                {/* Player Name */}
                <div className="font-black text-gray-900 truncate text-lg">
                  {player.name}
                </div>

                {/* League & Tier */}
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">{player.league}</span>
                  <span className="text-xs font-bold text-gray-500">{player.tier}</span>
                </div>

                {/* XP */}
                <div className="font-black text-purple-600 text-right text-lg">
                  {player.xp.toLocaleString}
                </div>
              </div>
            ))}

            {/* Visual separator indicating a jump in ranks */}
            <div className="w-full flex justify-center py-2">
              <div className="flex gap-1.5 opacity-30">
                <div className="size-2 rounded-full bg-black"></div>
                <div className="size-2 rounded-full bg-black"></div>
                <div className="size-2 rounded-full bg-black"></div>
              </div>
            </div>

            {/* Current User Row (Glued to bottom of list) */}
            <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_1.5fr_120px] gap-2 md:gap-4 items-center px-6 py-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20 border border-indigo-400 transform scale-[1.02]">
              <div className="flex items-center gap-2">
                <span className="md:hidden text-xs font-bold text-indigo-300 uppercase">Rank: </span>
                <div className="size-8 rounded-full flex items-center justify-center font-black text-sm bg-indigo-500 text-white border border-indigo-400">
                  #{currentUser.rank}
                </div>
              </div>
              <div className="font-black text-white truncate text-lg flex items-center gap-2">
                {currentUser.name} <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">{currentUser.league}</span>
                <span className="text-xs font-bold text-indigo-200">{currentUser.tier}</span>
              </div>
              <div className="font-black text-yellow-300 text-right text-lg">
                {currentUser.xp.toLocaleString()}
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
};

export default Leaderboard;