import React, { useState, useEffect } from 'react';
import { Search, Plus, Square, Grid, List as ListIcon, ChevronDown, Check, Zap, Sliders, Smartphone, Monitor, RotateCcw, Hash, LayoutTemplate, X, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getInitials, cn } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, SortOption } from '../App';
import { subscribeToUserStats, subscribeToUserProfile } from '../services/database';
import { UserStats } from '../types';
import { LEVEL_TITLES } from '../services/gamificationConstants';
import { useSound } from '../contexts/SoundContext';

interface NavbarProps {
  onSearch: (query: string) => void;
  onCreateClick: () => void;
  activeCategory: string; // Used for Tags
  onCategoryChange: (category: string) => void;
  categories: string[]; // These are Tags
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  activeSector: string;
  onSectorChange: (sector: string) => void;
  orientationFilter: 'all' | 'landscape' | 'portrait' | 'square';
  onOrientationChange: (o: 'all' | 'landscape' | 'portrait' | 'square') => void;
  sectors: string[]; 
}

const Navbar: React.FC<NavbarProps> = ({ 
  onSearch, 
  onCreateClick, 
  activeCategory, 
  onCategoryChange,
  categories,
  viewMode,
  onViewChange,
  sortBy,
  onSortChange,
  activeSector,
  onSectorChange,
  orientationFilter,
  onOrientationChange,
  sectors
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProfile, setUserProfile] = useState<{ photoURL?: string } | null>(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { playClick, playHover, playType } = useSound();

  useEffect(() => {
    if (user) {
      const unsubStats = subscribeToUserStats(user.uid, (data) => setUserStats(data));
      const unsubProfile = subscribeToUserProfile(user.uid, (data) => setUserProfile(data));
      return () => { unsubStats(); unsubProfile(); };
    }
  }, [user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
      playClick();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResetFilters = () => {
    onCategoryChange("All");
    onSectorChange("All");
    onOrientationChange("all");
    onSortChange("newest");
    setSearchTerm("");
    onSearch("");
    playClick();
  };

  const hasActiveFilters = activeCategory !== "All" || activeSector !== "All" || orientationFilter !== "all" || sortBy !== "newest" || searchTerm !== "";

  if (!user) return null; 

  const displayName = user.displayName || 'User';
  const levelTitle = userStats ? LEVEL_TITLES[userStats.level] : "Init";
  const displayAvatar = userProfile?.photoURL || user.photoURL;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-xl">
        
        {/* 1. PRIMARY HEADER (Brand, Search, User) */}
        <div className="bg-charcoal border-b border-khaki h-16 flex justify-center px-4 sm:px-6 relative z-50">
          <div className="max-w-7xl w-full flex items-center justify-between gap-4">
            
            {/* Left: Brand */}
            <Link to="/" onClick={playClick} className="flex items-center gap-3 group shrink-0">
              <div className="relative border border-terracotta p-1 bg-terracotta/10 group-hover:bg-terracotta group-hover:text-charcoal transition-colors">
                  <Square className="h-5 w-5 fill-current text-terracotta group-hover:text-charcoal transition-colors" />
              </div>
              <span className="font-display font-bold text-2xl tracking-wide text-wick uppercase hidden md:block">
                PinMe<span className="text-terracotta">.</span>
              </span>
            </Link>

            {/* Center: Omni-Search */}
            <div className="flex-1 max-w-xl h-10 relative group mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-khaki group-focus-within:text-terracotta transition-colors" />
              <input
                type="text"
                className="w-full h-full bg-charcoal text-wick pl-10 pr-10 outline-none border border-khaki focus:border-terracotta placeholder:text-khaki/50 text-sm font-mono transition-colors"
                placeholder="SEARCH_DATABASE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={playHover}
              />
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); onSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-khaki hover:text-terracotta"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Right: User & Create */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Gamification Badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-charcoal border border-khaki/30">
                  <Zap className="h-3 w-3 text-terracotta" />
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[10px] font-black uppercase text-terracotta tracking-widest">LVL {userStats?.level || 1}</span>
                  </div>
              </div>

              <button 
                onClick={() => { onCreateClick(); playClick(); }}
                className="h-9 px-3 bg-terracotta text-charcoal border border-terracotta hover:bg-wick hover:text-charcoal hover:border-wick text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
              </button>
              
              <div className="relative group h-full flex items-center">
                  <button className="h-9 w-9 bg-khaki text-charcoal border border-khaki flex items-center justify-center text-xs font-bold overflow-hidden hover:bg-terracotta hover:border-terracotta transition-colors">
                    {displayAvatar ? <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover"/> : getInitials(displayName)}
                  </button>
                  <div className="absolute top-full right-0 pt-2 w-56 hidden group-hover:block hover:block animate-in slide-in-from-top-1 duration-200">
                    <div className="bg-charcoal border border-khaki shadow-hard-lg py-0">
                      <div className="px-4 py-3 border-b border-khaki bg-khaki/10">
                        <p className="text-sm font-black truncate text-wick uppercase">{displayName}</p>
                        <p className="text-[10px] text-terracotta font-mono uppercase tracking-widest mt-1">Class: {levelTitle}</p>
                      </div>
                      <Link to={`/profile/${user.uid}`} onClick={playClick} className="block px-4 py-3 text-xs font-bold uppercase tracking-widest text-bone hover:bg-khaki hover:text-charcoal transition border-b border-khaki/20">
                        System Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-terracotta hover:bg-terracotta hover:text-charcoal transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. COMMAND STRIP (Sectors & Filter Toggle) */}
        <div className="bg-charcoal/95 backdrop-blur-md border-b border-khaki h-12 flex justify-center px-4 sm:px-6 relative z-40">
           <div className="max-w-7xl w-full flex items-center gap-4">
              
              {/* Left: Sector Navigation (Tabs) */}
              <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2 h-full mask-linear-fade">
                  <span className="text-[10px] font-mono text-khaki uppercase mr-2 shrink-0">Sector //</span>
                  {sectors.map(sec => (
                      <button
                          key={sec}
                          onClick={() => { onSectorChange(sec); playClick(); }}
                          className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap hover:border-terracotta",
                            activeSector === sec 
                              ? "bg-terracotta text-charcoal border-terracotta shadow-[2px_2px_0px_#191918]" 
                              : "bg-transparent text-bone border-khaki/30 hover:text-wick"
                          )}
                      >
                          {sec}
                      </button>
                  ))}
              </div>

              {/* Right: Parameters Toggle */}
              <div className="flex items-center gap-2 pl-4 border-l border-khaki/20 shrink-0 h-full py-2">
                 {hasActiveFilters && (
                    <button 
                       onClick={handleResetFilters}
                       className="p-1.5 text-bone hover:text-terracotta transition-colors"
                       title="Reset All"
                    >
                       <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                 )}
                 <button 
                    onClick={() => { setIsParamsOpen(!isParamsOpen); playClick(); }}
                    className={cn(
                       "h-full px-4 border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all",
                       isParamsOpen 
                         ? "bg-wick text-charcoal border-wick" 
                         : "bg-charcoal text-wick border-khaki hover:border-terracotta hover:text-terracotta"
                    )}
                 >
                    <Sliders className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Parameters</span>
                    {hasActiveFilters && <div className="h-1.5 w-1.5 bg-terracotta rounded-full animate-pulse ml-1"></div>}
                 </button>
              </div>
           </div>
        </div>

        {/* 3. PARAMETERS DRAWER (Slide Down) */}
        <AnimatePresence>
          {isParamsOpen && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="bg-charcoal border-b border-khaki shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-30"
             >
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:divide-x md:divide-khaki/20">
                      
                      {/* Column 1: View Configuration */}
                      <div className="space-y-4">
                         <h4 className="text-xs font-black text-terracotta uppercase tracking-widest flex items-center gap-2">
                            <LayoutTemplate className="h-3 w-3" /> View Config
                         </h4>
                         <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'masonry', icon: Grid, label: 'Grid' },
                              { id: 'list', icon: ListIcon, label: 'Feed' },
                              { id: 'compact', icon: LayoutTemplate, label: 'Mini' }
                            ].map((mode) => (
                               <button
                                  key={mode.id}
                                  onClick={() => { onViewChange(mode.id as ViewMode); playClick(); }}
                                  className={cn(
                                     "flex flex-col items-center justify-center gap-2 p-3 border transition-all group",
                                     viewMode === mode.id 
                                       ? "bg-khaki text-charcoal border-khaki shadow-sm" 
                                       : "bg-charcoal text-bone border-khaki/30 hover:border-terracotta hover:text-wick"
                                  )}
                               >
                                  <mode.icon className="h-5 w-5" />
                                  <span className="text-[10px] font-bold uppercase">{mode.label}</span>
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* Column 2: Sorting Protocol */}
                      <div className="space-y-4 md:pl-6">
                         <h4 className="text-xs font-black text-terracotta uppercase tracking-widest flex items-center gap-2">
                            <Filter className="h-3 w-3" /> Sort Protocol
                         </h4>
                         <div className="flex flex-col gap-2">
                            {[
                               { id: 'newest', label: 'Chronological (New)' },
                               { id: 'oldest', label: 'Chronological (Old)' },
                               { id: 'liked', label: 'Trending (Likes)' }
                            ].map((opt) => (
                               <button
                                  key={opt.id}
                                  onClick={() => { onSortChange(opt.id as SortOption); playClick(); }}
                                  className={cn(
                                     "flex items-center justify-between px-3 py-2 border text-xs font-bold uppercase transition-all",
                                     sortBy === opt.id
                                       ? "bg-charcoal text-terracotta border-terracotta"
                                       : "bg-charcoal text-bone border-khaki/20 hover:border-khaki hover:text-wick"
                                  )}
                               >
                                  {opt.label}
                                  {sortBy === opt.id && <Check className="h-3 w-3" />}
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* Column 3: Orientation Filter */}
                      <div className="space-y-4 md:pl-6">
                         <h4 className="text-xs font-black text-terracotta uppercase tracking-widest flex items-center gap-2">
                            <Monitor className="h-3 w-3" /> Aspect Ratio
                         </h4>
                         <div className="grid grid-cols-2 gap-2">
                            {[
                               { id: 'all', icon: Grid, label: 'All' },
                               { id: 'landscape', icon: Monitor, label: 'Wide' },
                               { id: 'portrait', icon: Smartphone, label: 'Tall' },
                               { id: 'square', icon: Square, label: '1:1' }
                            ].map((opt) => (
                               <button
                                  key={opt.id}
                                  onClick={() => { onOrientationChange(opt.id as any); playClick(); }}
                                  className={cn(
                                     "flex items-center gap-2 px-3 py-2 border text-[10px] font-bold uppercase transition-all",
                                     orientationFilter === opt.id
                                        ? "bg-khaki/20 text-wick border-khaki"
                                        : "bg-charcoal text-bone border-khaki/20 hover:border-terracotta hover:text-terracotta"
                                  )}
                               >
                                  <opt.icon className="h-3 w-3" /> {opt.label}
                               </button>
                            ))}
                         </div>
                      </div>

                      {/* Column 4: Trending Tags */}
                      <div className="space-y-4 md:pl-6">
                         <h4 className="text-xs font-black text-terracotta uppercase tracking-widest flex items-center gap-2">
                            <Hash className="h-3 w-3" /> Trending Tags
                         </h4>
                         <div className="flex flex-wrap gap-2 content-start">
                            {categories.filter(c => c !== "All").slice(0, 10).map(tag => (
                               <button
                                  key={tag}
                                  onClick={() => { onCategoryChange(tag); playClick(); }}
                                  className={cn(
                                     "px-2 py-1 border text-[10px] font-bold uppercase transition-all",
                                     activeCategory === tag
                                        ? "bg-wick text-charcoal border-wick"
                                        : "bg-charcoal text-bone border-khaki/20 hover:border-khaki hover:text-wick"
                                  )}
                               >
                                  #{tag}
                               </button>
                            ))}
                         </div>
                      </div>

                   </div>
                </div>
                
                {/* Drawer Footer Decoration */}
                <div className="h-1 w-full bg-gradient-to-r from-charcoal via-terracotta to-charcoal opacity-50"></div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Navbar;