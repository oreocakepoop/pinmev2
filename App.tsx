import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MasonryGrid from './components/MasonryGrid';
import DetailModal from './components/DetailModal';
import CreatePinModal from './components/CreatePinModal';
import LandingPage from './components/LandingPage';
import UserProfile from './components/UserProfile';
import SystemLogs from './components/SystemLogs';
import { Login, Register } from './components/AuthForms';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SoundProvider } from './contexts/SoundContext';
import { subscribeToPins } from './services/database';
import { Pin } from './types';
import { Loader2, ArrowUp, Frown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

// Global Types for App State
export type ViewMode = 'masonry' | 'list' | 'compact';
export type SortOption = 'newest' | 'oldest' | 'liked';

const Dashboard: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // New Neural Query Filters
  const [activeSector, setActiveSector] = useState("All");
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');

  useEffect(() => {
    const unsubscribe = subscribeToPins((data) => {
      setPins(data);
      setLoading(false);
    });

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Dynamic Categories: Extract top 15 most used tags from current pins
  const dynamicCategories = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    pins.forEach(pin => {
      pin.tags?.forEach(tag => {
        const normalized = tag.toLowerCase().trim();
        if (normalized) tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
      });
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([tag]) => tag.charAt(0).toUpperCase() + tag.slice(1)); // Capitalize
      
    return ["All", ...sortedTags];
  }, [pins]);

  // Dynamic Sectors: Extract all unique sectors from pins
  const dynamicSectors = useMemo(() => {
    const sectors = new Set<string>();
    pins.forEach(pin => {
      if (pin.sector) {
        sectors.add(pin.sector);
      }
    });
    return ["All", ...Array.from(sectors).sort()];
  }, [pins]);

  const selectedPin = useMemo(() => {
    return pins.find(p => p.id === selectedPinId) || null;
  }, [pins, selectedPinId]);

  const filteredPins = useMemo(() => {
    let result = [...pins];

    // 1. Search Filter (Updated to include sector)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(pin => 
        pin.description.toLowerCase().includes(lowerQuery) || 
        pin.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        pin.author.toLowerCase().includes(lowerQuery) ||
        pin.sector?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Category/Tag Filter
    if (activeCategory !== "All") {
      const lowerCat = activeCategory.toLowerCase();
      result = result.filter(pin => 
         pin.description.toLowerCase().includes(lowerCat) || 
         pin.tags?.some(t => t.toLowerCase().includes(lowerCat))
      );
    }

    // 3. Sector Filter (New)
    if (activeSector !== "All") {
      result = result.filter(pin => pin.sector === activeSector);
    }

    // 4. Orientation Filter (New)
    if (orientationFilter !== 'all') {
       result = result.filter(pin => {
         // Fallback if width/height missing
         if (!pin.width || !pin.height) return true; 
         const ratio = pin.width / pin.height;
         
         if (orientationFilter === 'landscape') return ratio > 1.2;
         if (orientationFilter === 'portrait') return ratio < 0.8;
         if (orientationFilter === 'square') return ratio >= 0.8 && ratio <= 1.2;
         return true;
       });
    }

    // 5. Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'liked':
        result.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
    }

    return result;
  }, [pins, searchQuery, activeCategory, sortBy, activeSector, orientationFilter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    const capTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
    if (dynamicCategories.includes(capTag)) {
      setActiveCategory(capTag);
    } else {
      setSearchQuery(tag);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-charcoal"><Loader2 className="animate-spin h-8 w-8 text-terracotta"/></div>;

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-charcoal text-wick font-sans selection:bg-terracotta selection:text-charcoal">
      <Navbar 
        onSearch={setSearchQuery} 
        onCreateClick={() => setIsCreateModalOpen(true)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={dynamicCategories}
        viewMode={viewMode}
        onViewChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeSector={activeSector}
        onSectorChange={setActiveSector}
        orientationFilter={orientationFilter}
        onOrientationChange={setOrientationFilter}
        sectors={dynamicSectors}
      />
      
      {/* Adjusted Top Padding for new shorter header (16 + 12 = 28 * 4 = 112px, so pt-32 is safe) */}
      <main className="pt-36 pb-12 transition-all duration-300">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <Loader2 className="h-8 w-8 text-khaki animate-spin" />
            <p className="text-xs font-mono text-bone uppercase tracking-widest">Loading Database...</p>
          </div>
        ) : (
          <>
            {filteredPins.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 text-center px-4 animate-in fade-in duration-500">
                <div className="bg-charcoal p-8 mb-6 border border-khaki rounded-none">
                   <Frown className="h-12 w-12 text-bone" />
                </div>
                <p className="text-xl font-black text-wick uppercase tracking-tighter mb-2">No Entries Found</p>
                <p className="text-bone mb-8 font-mono text-xs max-w-xs">The current filter parameters returned zero results.</p>
                <button 
                  onClick={() => { setActiveCategory("All"); setSearchQuery(""); setActiveSector("All"); setOrientationFilter("all"); }}
                  className="px-6 py-3 bg-khaki text-charcoal font-black uppercase tracking-widest hover:bg-terracotta transition text-xs border border-khaki"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <MasonryGrid 
                pins={filteredPins} 
                onPinClick={(pin) => setSelectedPinId(pin.id)} 
                viewMode={viewMode}
                onTagClick={handleTagClick}
              />
            )}
          </>
        )}
      </main>

      {/* Back to Top */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 bg-charcoal text-terracotta p-4 border border-terracotta hover:bg-terracotta hover:text-charcoal transition-all z-40 shadow-[4px_4px_0px_#6B6951] ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <SystemLogs />

      <AnimatePresence>
        {selectedPin && (
          <DetailModal 
            pin={selectedPin} 
            onClose={() => setSelectedPinId(null)} 
            relatedPins={pins.filter(p => p.id !== selectedPin.id).slice(0, 5)}
          />
        )}

        {isCreateModalOpen && (
          <CreatePinModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <SoundProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </SoundProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;