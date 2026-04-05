import { useState } from "react";
import Navbar from "../components/NavBar"; // <-- Imported here

const Help = () => {
  const [openFaq, setOpenFaq] = useState(0); 

  const faqs = [
    {
      question: "How does the Arena Matchmaking work?",
      answer: "When you click 'Find Match' in the Arena lobby, our system searches for an opponent with a similar Global Rank and XP level. Once matched, you will both be thrown into a secure 1v1 coding environment to solve the same problem against a 15-minute timer."
    },
    {
      question: "How do I earn XP and rank up?",
      answer: "You earn XP by winning Arena battles, completing Learning Duels, and successfully executing code in the documentation sections. Accumulating XP will automatically promote you through our tiers (e.g., from Platinum to Diamond)."
    },
    {
      question: "How do I use the XSyndicate AI?",
      answer: "You can click the robot icon in the top right to open the chat window anytime. Alternatively, if you highlight any text on the website, a magical 'Ask XSyndicate' button will appear, allowing you to ask questions about that specific text directly!"
    },
    {
      question: "Can I battle my friends?",
      answer: "Yes! First, add them to 'Your Syndicate' by clicking the Add Friend (+) icon in the navbar and searching their Username. Once they accept, you can use the 'Friendly Match' or 'Learning Duels' options in the Arena to code together."
    }
  ];

  return (
    <main className="min-h-screen w-full flex flex-col font-['Mona_Sans',sans-serif] bg-slate-50 overflow-hidden relative">
      
      {/* Background Orbs */}
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

      <div className="relative z-10 flex-grow flex flex-col items-center pt-24 md:pt-32 px-6 pb-20 w-full max-w-4xl mx-auto animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-purple-600 font-black tracking-widest uppercase text-sm mb-3 block">Support Center</span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            How can we help?
          </h1>
        </div>

        {/* Contact Banner */}
        <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] p-8 md:p-10 mb-12 shadow-2xl shadow-purple-600/20 flex flex-col md:flex-row items-center justify-between gap-6 text-white transform hover:scale-[1.02] transition-transform duration-300">
          <div>
            <h3 className="text-2xl font-black mb-2">Still stuck?</h3>
            <p className="text-purple-100 font-medium">Our team is ready to help you with any technical issues.</p>
          </div>
          <button className="bg-white text-purple-600 font-black px-8 py-3.5 rounded-xl uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all shadow-lg whitespace-nowrap cursor-pointer">
            Contact Support
          </button>
        </div>

        {/* FAQ Section */}
        <div className="w-full">
          <h3 className="text-2xl font-black text-gray-900 mb-6">Frequently Asked Questions</h3>
          
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-black text-gray-800 text-lg pr-4">{faq.question}</span>
                  <span className={`text-xl font-bold text-purple-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-4">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
};

export default Help;