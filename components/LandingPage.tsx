import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Square, Star, Globe, Zap, Layers, Box } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-charcoal text-wick font-sans flex flex-col overflow-x-hidden selection:bg-terracotta selection:text-charcoal">
      {/* Responsive Navbar */}
      <header className="h-16 md:h-20 border-b border-khaki flex items-center justify-between px-0 fixed w-full bg-charcoal z-50">
        <div className="h-full px-4 md:px-8 flex items-center border-r border-khaki bg-terracotta text-charcoal">
            <Square className="h-6 w-6 md:h-8 md:w-8 fill-charcoal" />
        </div>
        <div className="text-xl md:text-4xl font-display font-bold uppercase tracking-wide flex-1 pl-4 md:pl-6 truncate text-wick mt-1">
          PinMe<span className="text-terracotta">.</span>
        </div>
        <div className="flex h-full">
          <button onClick={() => navigate('/login')} className="h-full px-4 md:px-8 text-xs md:text-sm font-black uppercase tracking-widest hover:bg-khaki hover:text-charcoal transition border-l border-khaki text-bone hover:text-wick">
            Log in
          </button>
          <button onClick={() => navigate('/register')} className="hidden md:block h-full px-8 text-sm font-black uppercase tracking-widest bg-wick text-charcoal hover:bg-terracotta hover:text-charcoal hover:border-l border-khaki transition">
            Sign up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-16 md:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[auto] md:min-h-[85vh] border-b border-khaki">
          
          {/* Left Content */}
          <div className="lg:col-span-8 flex flex-col justify-center px-6 md:px-20 py-16 md:py-24 border-b lg:border-b-0 lg:border-r border-khaki relative bg-charcoal overflow-hidden">
             
             {/* Decorative Background Elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-khaki/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, ease: "circOut" }}
               className="relative z-10"
             >
               <div className="flex items-center gap-3 mb-8">
                 <div className="h-px w-12 bg-terracotta"></div>
                 <span className="text-terracotta font-mono text-xs font-bold uppercase tracking-widest">System v2.0 // Ready</span>
               </div>

               <h1 className="font-display font-black leading-[0.8] tracking-tighter mb-8 uppercase text-wick">
                 <span className="text-8xl sm:text-9xl lg:text-[11rem] block">Visual</span>
                 <span className="text-8xl sm:text-9xl lg:text-[11rem] block text-transparent bg-clip-text bg-gradient-to-br from-terracotta to-wick stroke-text">Database</span>
               </h1>
               
               <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-12">
                  <p className="text-2xl md:text-4xl font-black uppercase tracking-tight text-terracotta">
                    Organize Chaos<span className="text-wick">.</span>
                  </p>
                  <div className="hidden md:block h-8 w-px bg-khaki"></div>
                  <p className="max-w-md text-sm md:text-base text-bone font-mono font-medium leading-relaxed">
                    A strict visual system for the creative mind. Curate culture with architectural precision.
                  </p>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 <button 
                   onClick={() => navigate('/register')}
                   className="group relative px-8 py-4 bg-terracotta text-charcoal border border-terracotta hover:bg-wick hover:text-charcoal hover:border-wick transition-all shadow-hard hover:shadow-hard-hover hover:-translate-y-1"
                 >
                   <span className="text-sm font-black uppercase tracking-widest mr-2 relative z-10">Initialize System</span>
                   <ArrowRight className="inline-block h-4 w-4 transform group-hover:translate-x-1 transition-transform relative z-10" />
                 </button>
                 <button 
                   className="px-8 py-4 bg-transparent text-wick border border-khaki hover:bg-khaki hover:text-charcoal transition font-black uppercase tracking-widest text-sm"
                 >
                   Explore Protocol
                 </button>
               </div>
             </motion.div>
          </div>

          {/* Right Visual - Interactive Grid */}
          <div className="lg:col-span-4 bg-panel flex flex-col relative overflow-hidden min-h-[400px] lg:min-h-auto border-t lg:border-t-0 border-khaki">
             {/* Grid Lines Overlay */}
             <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#9DBDB8 1px, transparent 1px), linear-gradient(90deg, #9DBDB8 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             
             <div className="flex-1 flex flex-col justify-center items-center p-12 relative z-10">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="mb-12 text-terracotta opacity-80"
                >
                   <Globe className="h-48 w-48 stroke-1" />
                </motion.div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                   <div className="bg-charcoal border border-khaki p-4 text-center shadow-hard">
                      <div className="text-3xl font-display font-bold text-wick">24k</div>
                      <div className="text-[10px] uppercase font-mono text-bone">Nodes Active</div>
                   </div>
                   <div className="bg-charcoal border border-khaki p-4 text-center shadow-hard">
                      <div className="text-3xl font-display font-bold text-wick">0.01s</div>
                      <div className="text-[10px] uppercase font-mono text-bone">Latency</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Marquee Strip */}
        <div className="overflow-hidden border-b border-khaki bg-wick py-3 md:py-4">
           <div className="whitespace-nowrap animate-marquee flex gap-12 text-2xl md:text-4xl font-display font-bold uppercase tracking-wide text-charcoal">
              <span className="text-charcoal">/// Design Perfect Hex</span>
              <span className="text-terracotta">/// #EA2E00</span>
              <span className="text-charcoal">/// Organize Chaos</span>
              <span className="text-terracotta">/// #9DBDB8</span>
              <span className="text-charcoal">/// Visual Database</span>
              <span className="text-terracotta">/// #F0E7D6</span>
              <span className="text-charcoal">/// Design Perfect Hex</span>
              <span className="text-terracotta">/// #EA2E00</span>
           </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-khaki bg-charcoal">
           <div className="p-10 md:p-16 group hover:bg-khaki/10 transition duration-300">
              <Zap className="h-10 w-10 mb-6 text-terracotta group-hover:scale-110 transition-transform" />
              <h3 className="text-4xl font-display font-bold uppercase tracking-tight mb-4 text-wick">Instant<br/>Access</h3>
              <p className="font-mono text-sm leading-relaxed text-bone">Zero latency. Your visual assets available globally via our decentralized content delivery network.</p>
           </div>
           <div className="p-10 md:p-16 group hover:bg-khaki/10 transition duration-300">
              <Layers className="h-10 w-10 mb-6 text-terracotta group-hover:scale-110 transition-transform" />
              <h3 className="text-4xl font-display font-bold uppercase tracking-tight mb-4 text-wick">Strict<br/>Structure</h3>
              <p className="font-mono text-sm leading-relaxed text-bone">Rigid grid systems ensuring your content is always perfectly aligned. Total control over chaos.</p>
           </div>
           <div className="p-10 md:p-16 group hover:bg-khaki/10 transition duration-300">
              <Box className="h-10 w-10 mb-6 text-terracotta group-hover:scale-110 transition-transform" />
              <h3 className="text-4xl font-display font-bold uppercase tracking-tight mb-4 text-wick">Raw<br/>Storage</h3>
              <p className="font-mono text-sm leading-relaxed text-bone">Uncompressed fidelity. Store your inspiration in its purest form without degradation.</p>
           </div>
        </div>
      </main>

      <footer className="border-t border-khaki py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center bg-charcoal text-bone gap-8">
         <div>
            <div className="flex items-center gap-2 mb-2">
               <Square className="h-5 w-5 text-terracotta fill-current" />
               <span className="text-3xl font-display font-bold uppercase tracking-wide text-wick">PinMe Inc.</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">System Version 2.4.0</div>
         </div>
         <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-bone">
            <a href="#" className="hover:text-terracotta transition border-b border-transparent hover:border-terracotta">Privacy</a>
            <a href="#" className="hover:text-terracotta transition border-b border-transparent hover:border-terracotta">Terms</a>
            <a href="#" className="hover:text-terracotta transition border-b border-transparent hover:border-terracotta">Contact</a>
         </div>
      </footer>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .stroke-text {
            -webkit-text-stroke: 1px #191918;
            color: transparent; 
        }
        /* Override stroke for gradient text on large screens if supported, else fallback */
        @media (min-width: 1024px) {
           .stroke-text {
              -webkit-text-stroke: 0px;
              color: transparent;
           }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;