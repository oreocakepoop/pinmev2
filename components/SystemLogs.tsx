import React, { useEffect, useState } from 'react';
import { subscribeToLogs } from '../services/database';
import { LogEntry } from '../types';
import { Terminal, Activity, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToLogs((data) => {
      setLogs(data);
    });
    return () => unsub();
  }, []);

  // Format timestamp to HH:MM:SS
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`fixed bottom-0 left-0 z-40 transition-all duration-300 ${isOpen ? 'w-full md:w-96' : 'w-10 md:w-12'} bg-charcoal border-t md:border-t-0 md:border-r border-khaki shadow-hard max-h-[50vh] flex flex-col`}>
       {/* Header Toggle */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="h-10 md:h-12 bg-charcoal border-b border-khaki flex items-center justify-between px-3 hover:bg-khaki hover:text-charcoal transition-colors group w-full"
       >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-terracotta" />
            {isOpen && <span className="text-xs font-black uppercase tracking-widest text-wick">Sys_Logs_v1</span>}
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-terracotta animate-pulse"></div>
             {isOpen && <span className="text-[9px] font-mono text-bone">LIVE</span>}
          </div>
       </button>

       {/* Log Content */}
       {isOpen && (
         <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3 bg-charcoal custom-scrollbar h-64 md:h-80">
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l border-khaki pl-2 py-1"
                >
                   <div className="flex gap-2 text-bone/50 mb-0.5">
                      <span>[{formatTime(log.timestamp)}]</span>
                      <span className="text-terracotta font-bold">{log.action}</span>
                   </div>
                   <div className="text-wick">
                      <span className="font-bold text-khaki">User: {log.user}</span>
                      <span className="mx-1">///</span>
                      <span className="opacity-80">{log.detail}</span>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {logs.length === 0 && (
               <div className="text-center text-bone opacity-50 py-8">
                  NO SIGNAL DETECTED...
               </div>
            )}
         </div>
       )}
    </div>
  );
};

export default SystemLogs;