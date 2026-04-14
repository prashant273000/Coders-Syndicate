import Navbar from "../components/NavBar";

const About = () => {
  const features = [
    {
      icon: "📚",
      title: "Arena Learning",
      description: "We believe the best way to master computer science is by doing. Dive into our extensive documentation and immediately test your knowledge in the Arena."
    },
    {
      icon: "⚔️",
      title: "Competitive Coding",
      description: "Match up against developers worldwide. From Quick Matches to Learning Duels, push your coding skills to the absolute limit in real-time."
    },
    {
      icon: "🤖",
      title: "XSyndicate AI",
      description: "Never get stuck again. Highlight any text or ask a direct question, and our custom AI assistant will explain complex concepts instantly."
    },
    {
      icon: "🤝",
      title: "Global Syndicate",
      description: "Add friends, track your global ranking on the Leaderboard, and build your own syndicate of top-tier developers."
    }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* Background Orbs to match your theme */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-[15%] right-[-5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] bg-pink-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[5%] left-[25%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-indigo-600/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ========================================= */}
      {/* --- NAVBAR RE-ADDED HERE ---              */}
      {/* ========================================= */}
      <div className="relative z-30 w-full">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-6 pb-10 w-full max-w-6xl mx-auto animate-fade-in">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 uppercase tracking-tight mb-6 drop-shadow-sm">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Us</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
            We are a dedicated team bridging the gap between studying and doing. Coder_Syndicate is built to transform standard computer science documentation into an interactive, competitive learning arena.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-20">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2rem] p-8 shadow-xl shadow-purple-900/5 hover:-translate-y-2 transition-transform duration-300">
              <div className="size-16 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner border border-purple-200/50">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 font-medium leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Copyright */}
      <footer className="relative z-10 w-full bg-white/50 backdrop-blur-md border-t border-purple-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full overflow-hidden border border-gray-200 shadow-sm">
              <img src="/images/web_logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-gray-900 tracking-tight text-lg">Coder_Syndicate</span>
          </div>
          
          <p className="text-sm font-bold text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} Coder_Syndicate. All rights reserved. 
          </p>

          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors font-bold text-sm uppercase tracking-wider">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors font-bold text-sm uppercase tracking-wider">Terms</a>
          </div>
        </div>
      </footer>

    </main>
  );
};

export default About;