import React, { useState, useEffect, useMemo } from 'react';
import { Pin } from '../types';
import PinCard from './PinCard';
import { ViewMode } from '../App';
import { motion, AnimatePresence } from 'framer-motion';

interface MasonryGridProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  viewMode: ViewMode;
  onTagClick?: (tag: string) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ pins, onPinClick, viewMode, onTagClick }) => {
  const [columns, setColumns] = useState(2);

  // Responsive Column Calculation
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);      // Mobile
      else if (width < 768) setColumns(3); // Tablet
      else if (width < 1024) setColumns(4); // Laptop
      else if (width < 1280) setColumns(5); // Desktop
      else setColumns(6);                  // Ultra-wide
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute pins into columns for layout
  const distributedPins = useMemo(() => {
    const cols: Pin[][] = Array.from({ length: columns }, () => []);
    pins.forEach((pin, i) => {
      cols[i % columns].push(pin);
    });
    return cols;
  }, [pins, columns]);

  // --- LIST VIEW ---
  if (viewMode === 'list') {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 flex flex-col gap-6">
        <AnimatePresence mode='popLayout'>
          {pins.map((pin, i) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              key={pin.id}
            >
              <PinCard pin={pin} onClick={onPinClick} viewMode="list" onTagClick={onTagClick} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // --- COMPACT VIEW ---
  if (viewMode === 'compact') {
     return (
        <motion.div layout className="w-full px-0.5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-[1px]">
           <AnimatePresence mode='popLayout'>
             {pins.map((pin) => (
               <motion.div
                 layout
                 key={pin.id}
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0 }}
                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
               >
                 <PinCard pin={pin} onClick={onPinClick} viewMode="compact" />
               </motion.div>
             ))}
           </AnimatePresence>
        </motion.div>
     );
  }

  // --- MASONRY VIEW (STUNNING ANIMATION) ---
  return (
    <div className="w-full px-[1px]">
      <div className="flex gap-[1px] items-start justify-center">
        {distributedPins.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-[1px] flex-1 min-w-0">
            <AnimatePresence mode='popLayout'>
              {col.map((pin, pinIndex) => (
                <motion.div
                  layout="position"
                  key={pin.id}
                  initial={{ opacity: 0, y: 50, filter: "blur(5px)" }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    filter: "blur(0px)",
                    transition: { 
                      delay: (pinIndex * 0.05) + (colIndex * 0.02),
                      type: "spring",
                      stiffness: 350,
                      damping: 35,
                      mass: 1
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.9, 
                    transition: { duration: 0.2 } 
                  }}
                  whileHover={{ 
                    zIndex: 10,
                    transition: { duration: 0.2 } 
                  }}
                  className="w-full"
                >
                  <PinCard pin={pin} onClick={onPinClick} index={pinIndex} viewMode="masonry" onTagClick={onTagClick} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryGrid;