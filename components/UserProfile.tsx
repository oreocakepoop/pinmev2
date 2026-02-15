import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pin, UserStats } from '../types';
import { subscribeToPins, subscribeToUserStats, subscribeToUserProfile, updateUserAvatar } from '../services/database';
import MasonryGrid from './MasonryGrid';
import Navbar from './Navbar';
import DetailModal from './DetailModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { generateAvatarColor, getInitials, cn } from '../utils/helpers';
import { 
  Loader2, Share2, Grid, List as ListIcon, 
  Search, Heart, QrCode, Award, Zap, Terminal, Shield, Camera, X, Check, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGES, LEVEL_TITLES, getNextLevelThreshold, LEVEL_THRESHOLDS } from '../services/gamificationConstants';

// --- Types & Constants ---

type TabType = 'created' | 'saved' | 'system';
type ViewType = 'grid' | 'list';

const SkeletonLoader = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse px-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-charcoal border border-khaki h-48 md:h-80 w-full" style={{ animationDelay: `${i * 100}ms` }}></div>
    ))}
  </div>
);

const EmptyState = ({ message, icon }: { message: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-wick border border-khaki bg-charcoal m-4">
     <div className="mb-4 opacity-50 text-khaki select-none animate-bounce-slow">{icon}</div>
     <h3 className="text-2xl font-display font-bold uppercase tracking-wide mb-2 text-wick">Null Pointer</h3>
     <p className="font-mono text-xs text-bone max-w-xs">{message}</p>
  </div>
);

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  // --- State ---
  const [createdPins, setCreatedPins] = useState<Pin[]>([]);
  const [savedPins, setSavedPins] = useState<Pin[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProfileData, setUserProfileData] = useState<{ photoURL?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [viewMode, setViewMode] = useState<ViewType>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
  // Avatar Edit State
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // --- Effects ---

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    // 1. Fetch Created Pins (Filtered by userId in DB query)
    const unsubscribeCreated = subscribeToPins((data) => {
      setCreatedPins(data);
      setLoading(false);
    }, userId);

    // 2. Fetch All Pins to filter for Saved ones (Client-side filtering)
    // We subscribe to the global feed to find pins this user has SAVED.
    const unsubscribeSaved = subscribeToPins((allData) => {
      const saved = allData.filter(pin => pin.saves && pin.saves[userId]);
      setSavedPins(saved);
    });

    const unsubscribeStats = subscribeToUserStats(userId, (stats) => {
      setUserStats(stats);
    });

    const unsubscribeProfile = subscribeToUserProfile(userId, (data) => {
      setUserProfileData(data);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeSaved();
      unsubscribeStats();
      unsubscribeProfile();
    };
  }, [userId]);

  // --- Derived Gamification Stats ---

  const authorName = createdPins.length > 0 ? createdPins[0].author : "Unknown Entity";
  const displayPhotoURL = userProfileData?.photoURL;
  
  const currentLevel = userStats?.level || 1;
  const currentEntropy = userStats?.entropy || 0;
  const nextLevelThreshold = getNextLevelThreshold(currentLevel);
  const prevLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  
  // Calculate progress within current level
  const levelProgress = Math.min(100, Math.max(0, 
    ((currentEntropy - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100
  ));

  const levelTitle = LEVEL_TITLES[currentLevel] || "Unknown";

  const displayedPins = useMemo(() => {
    let target = activeTab === 'saved' ? savedPins : createdPins;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      target = target.filter(p => 
        p.description.toLowerCase().includes(q) || 
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return target;
  }, [activeTab, savedPins, createdPins, searchQuery]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Identity Link Copied", "success");
  }, [showToast]);

  const toggleFollow = () => {
    setIsFollowing(prev => !prev);
    showToast(isFollowing ? "Disengaged" : "Link Established", "success");
  };

  const isOwnProfile = currentUser?.uid === userId;

  const handleAvatarSave = async () => {
    if (!userId || !avatarUrlInput.trim()) return;
    try {
      await updateUserAvatar(userId, avatarUrlInput);
      setIsEditingAvatar(false);
      setAvatarUrlInput('');
      showToast("Visual Signature Updated", "success");
    } catch (e) {
      showToast("Update Failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-wick font-sans selection:bg-terracotta selection:text-charcoal overflow-x-hidden">
      <Navbar 
        onSearch={() => {}} 
        onCreateClick={() => navigate('/')} 
        activeCategory="All"
        onCategoryChange={() => {}}
        categories={[]}
        viewMode="masonry"
        onViewChange={() => {}}
        sortBy="newest"
        onSortChange={() => {}}
        activeSector="All"
        onSectorChange={() => {}}
        orientationFilter="all"
        onOrientationChange={() => {}}
        sectors={[]}
      />
      
      <main className="pt-16 md:pt-20 pb-20">
        
        {/* Cinematic Cover */}
        <div className="h-56 md:h-80 w-full relative border-b border-khaki overflow-hidden bg-charcoal group">
           <div className="absolute inset-0 bg-charcoal"></div>
           {/* Grid Scan */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(107,105,81,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(107,105,81,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
           
           <div className="absolute top-4 left-4 font-mono text-[9px] text-khaki tracking-widest uppercase border border-khaki px-2 py-1 z-10">
              Subject ID: {userId?.substring(0, 12)}
           </div>
           
           {/* Progress Line - moved to bottom of cover explicitly */}
           <div className="absolute bottom-0 left-0 w-full h-2 bg-charcoal border-t border-khaki z-10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-terracotta relative"
              >
              </motion.div>
           </div>
        </div>

        {/* Profile Identity Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 md:-mt-24 relative mb-16 z-10">
           <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-10">
              
              {/* Avatar Module */}
              <div className="relative group shrink-0">
                 <div 
                   className="h-32 w-32 md:h-52 md:w-52 relative z-10 bg-charcoal border border-khaki shadow-hard-lg overflow-hidden"
                 >
                   {displayPhotoURL ? (
                     <img src={displayPhotoURL} alt="Avatar" className="w-full h-full object-cover transition-all duration-500" />
                   ) : (
                     <div className={cn(
                       "w-full h-full flex items-center justify-center text-5xl md:text-7xl font-display font-bold text-wick bg-charcoal", 
                       generateAvatarColor(authorName).replace('bg-', 'text-')
                     )}>
                       {getInitials(authorName)}
                     </div>
                   )}
                   
                   {/* Overlay */}
                   <div className="absolute inset-0 border-2 border-charcoal/0 group-hover:border-terracotta/50 transition-colors pointer-events-none"></div>
                 </div>

                 {/* Edit Avatar Button */}
                 {isOwnProfile && (
                    <button 
                      onClick={() => setIsEditingAvatar(true)}
                      className="absolute bottom-2 right-2 z-20 p-2 bg-terracotta text-charcoal shadow-lg hover:bg-wick hover:text-charcoal transition-all border border-charcoal"
                      title="Edit Visual ID"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                 )}

                 {/* Level Badge */}
                 <div className="absolute -top-3 -right-3 z-30 bg-khaki border border-charcoal text-charcoal h-10 w-10 flex items-center justify-center font-black font-display text-xl">
                    {currentLevel}
                 </div>
              </div>

              {/* Info Block */}
              <div className="flex-1 w-full relative pb-2">
                 <div className="mb-2">
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-5xl md:text-8xl font-display font-black uppercase tracking-tight leading-[0.85] text-wick mb-3"
                    >
                      {authorName}
                    </motion.h1>
                    {currentLevel >= 5 && (
                      <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-terracotta text-charcoal text-[10px] uppercase font-black tracking-widest mb-4">
                        <Shield className="h-3 w-3 fill-current" /> High Clearance
                      </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-xs font-bold uppercase tracking-widest mb-8 font-mono">
                    <span className="flex items-center gap-2 text-terracotta bg-terracotta/5 px-2 py-1 border border-terracotta/20">
                      <Terminal className="h-4 w-4 text-terracotta"/> 
                      <span className="text-wick">Class: {levelTitle}</span>
                    </span>
                    
                    <span className="hidden md:inline text-khaki">///</span>
                    
                    <span className="flex items-center gap-2 text-terracotta bg-terracotta/5 px-2 py-1 border border-terracotta/20">
                      <Zap className="h-4 w-4 text-terracotta"/> 
                      <span className="text-wick">Entropy: {currentEntropy}</span>
                    </span>
                 </div>

                 {/* HUD Stats */}
                 <div className="flex gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2">
                    {[
                      { label: "Nodes", value: userStats?.pinsCreated || 0, icon: "⬡" },
                      { label: "Protocols", value: userStats?.badges?.length || 0, icon: "◈" },
                      { label: "Signals", value: userStats?.likesGiven || 0, icon: "⚡" },
                      { label: "Saved", value: userStats?.pinsSaved || 0, icon: "▣" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-charcoal border border-khaki p-3 min-w-[100px] hover:bg-khaki hover:text-charcoal transition group cursor-default shadow-sm">
                         <div className="text-[10px] uppercase tracking-widest text-bone mb-1 flex justify-between group-hover:text-charcoal/70">
                            {stat.label} <span className="text-terracotta group-hover:text-charcoal">{stat.icon}</span>
                         </div>
                         <div className="text-2xl font-display font-bold text-wick group-hover:text-charcoal">{stat.value}</div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 items-end pb-2">
                 {!isOwnProfile && (
                   <button 
                     onClick={toggleFollow}
                     className={cn(
                       "h-12 px-6 text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 flex-1 md:flex-none border",
                       isFollowing 
                         ? "bg-charcoal text-bone border-khaki hover:bg-khaki hover:text-charcoal" 
                         : "bg-terracotta text-charcoal border-terracotta hover:bg-wick"
                     )}
                   >
                     {isFollowing ? "Linked" : "Connect"}
                   </button>
                 )}
                 
                 <button onClick={handleCopyLink} className="h-12 w-12 flex items-center justify-center bg-charcoal border border-khaki hover:bg-khaki hover:text-charcoal text-wick transition" title="Share ID">
                    <Share2 className="h-5 w-5" />
                 </button>
                 <button onClick={() => setShowQr(true)} className="h-12 w-12 flex items-center justify-center bg-charcoal border border-khaki hover:bg-khaki hover:text-charcoal text-wick transition" title="Show QR">
                    <QrCode className="h-5 w-5" />
                 </button>
              </div>
           </div>
        </div>

        {/* Avatar Edit Modal (Inline Overlay) */}
        <AnimatePresence>
          {isEditingAvatar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 backdrop-blur-sm p-4"
            >
              <div className="bg-charcoal border border-khaki p-6 max-w-md w-full shadow-hard-lg relative">
                 <button onClick={() => setIsEditingAvatar(false)} className="absolute top-4 right-4 text-khaki hover:text-terracotta"><X className="h-5 w-5"/></button>
                 
                 <h3 className="text-2xl font-display font-bold uppercase text-wick mb-6 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-terracotta"/> Update Visual ID
                 </h3>
                 
                 <div className="space-y-4">
                    <div className="group">
                       <label className="block text-[10px] font-black uppercase tracking-widest text-bone mb-2">Image URL</label>
                       <input 
                         type="text" 
                         value={avatarUrlInput}
                         onChange={(e) => setAvatarUrlInput(e.target.value)}
                         placeholder="HTTPS://..." 
                         className="w-full bg-charcoal border border-khaki p-3 text-sm font-mono text-wick focus:border-terracotta outline-none placeholder:text-khaki/30"
                         autoFocus
                       />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                       <button onClick={() => setIsEditingAvatar(false)} className="px-4 py-2 text-xs font-bold uppercase text-bone hover:text-wick">Cancel</button>
                       <button 
                         onClick={handleAvatarSave}
                         className="px-6 py-2 bg-terracotta text-charcoal font-bold uppercase text-xs tracking-widest hover:bg-wick"
                       >
                          Upload
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs Navigation */}
        <div className="sticky top-16 md:top-20 z-40 bg-charcoal border-y border-khaki mb-8 shadow-2xl">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 h-auto md:h-14">
              
              <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar gap-8">
                 {(['created', 'saved', 'system'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "h-14 px-2 text-xs font-black uppercase tracking-widest transition relative whitespace-nowrap flex items-center gap-2",
                        activeTab === tab ? "text-terracotta" : "text-bone hover:text-wick"
                      )}
                    >
                      {tab === 'system' ? 'System Stats' : tab}
                      {activeTab === tab && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
                      )}
                    </button>
                 ))}
              </div>

              {activeTab !== 'system' && (
                <div className="flex items-center gap-4 w-full md:w-auto p-2 md:p-0">
                   <div className="relative flex-1 md:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-khaki group-focus-within:text-terracotta transition-colors" />
                      <input 
                        type="text" 
                        placeholder="FILTER_DATA..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-charcoal border border-khaki focus:border-terracotta py-1.5 pl-9 pr-4 text-xs font-bold font-mono outline-none transition-all text-wick placeholder:text-khaki/50"
                      />
                   </div>
                   <div className="flex border border-khaki bg-charcoal p-1 gap-1 shrink-0">
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={cn("p-1.5 transition-colors", viewMode === 'grid' ? "bg-khaki text-charcoal" : "text-bone hover:text-wick")}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button 
                         onClick={() => setViewMode('list')}
                         className={cn("p-1.5 transition-colors", viewMode === 'list' ? "bg-khaki text-charcoal" : "text-bone hover:text-wick")}
                      >
                        <ListIcon className="h-4 w-4" />
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto min-h-[400px]">
           <AnimatePresence mode="wait">
             
             {/* Tab: System (Gamification) */}
             {activeTab === 'system' && (
               <motion.div 
                 key="system"
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 className="px-4"
               >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: XP Card */}
                      <div className="bg-charcoal border border-khaki p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                             <Zap className="h-32 w-32 text-khaki stroke-1" />
                          </div>
                          <h3 className="text-3xl font-display font-bold uppercase mb-8 flex items-center gap-3 text-wick relative z-10">
                             Clearance Level
                          </h3>
                          
                          <div className="text-center py-8 relative z-10">
                             <div className="text-9xl font-display font-black text-wick tracking-tighter leading-none mb-2">{currentLevel}</div>
                             <div className="text-terracotta font-bold uppercase tracking-[0.2em] text-sm mb-12 border-y border-khaki py-2 inline-block px-8">{levelTitle}</div>
                             
                             <div className="w-full bg-khaki/20 h-4 mb-2 overflow-hidden border border-khaki">
                                <div className="h-full bg-terracotta" style={{ width: `${levelProgress}%` }}></div>
                             </div>
                             <div className="flex justify-between text-[10px] font-mono text-bone uppercase">
                                <span>{currentEntropy} XP</span>
                                <span>Target: {nextLevelThreshold}</span>
                             </div>
                          </div>
                      </div>

                      {/* Right: Badges */}
                      <div className="lg:col-span-2 bg-charcoal border border-khaki p-8">
                         <h3 className="text-3xl font-display font-bold uppercase mb-8 flex items-center gap-3 text-wick">
                            Protocol Achievements
                         </h3>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {BADGES.map(badge => {
                               const isUnlocked = userStats?.badges?.includes(badge.id);
                               return (
                                  <div key={badge.id} className={cn(
                                     "border p-6 flex flex-col items-center text-center transition-all relative overflow-hidden group",
                                     isUnlocked ? "border-terracotta bg-terracotta/5" : "border-khaki bg-charcoal opacity-50 grayscale"
                                  )}>
                                     {isUnlocked && <div className="absolute top-2 right-2 text-terracotta"><Check className="h-3 w-3"/></div>}
                                     <div className={cn("p-4 mb-4 transition-transform group-hover:scale-110 duration-300", isUnlocked ? "text-terracotta" : "text-bone")}>
                                        <Award className="h-8 w-8" />
                                     </div>
                                     <div className="text-sm font-black uppercase tracking-wider text-wick mb-2 font-display">{badge.name}</div>
                                     <div className="text-[10px] font-mono text-bone leading-tight">{badge.description}</div>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                  </div>
               </motion.div>
             )}

             {/* Tab: Created / Saved */}
             {activeTab !== 'system' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                   {loading ? (
                     <SkeletonLoader />
                   ) : displayedPins.length === 0 ? (
                     <EmptyState 
                       icon={activeTab === 'saved' ? <Bookmark className="h-12 w-12"/> : <X className="h-12 w-12"/>} 
                       message={activeTab === 'saved' ? "No data found in local storage." : "This node has not published any content."} 
                     />
                   ) : viewMode === 'list' ? (
                     <div className="px-4 max-w-5xl mx-auto space-y-4">
                        {displayedPins.map(pin => (
                           <div key={pin.id} onClick={() => setSelectedPin(pin)} className="flex gap-6 p-6 border border-khaki hover:border-terracotta transition cursor-pointer group bg-charcoal text-wick items-center">
                              <img src={pin.url} alt="" className="w-32 h-24 object-cover bg-charcoal border border-khaki transition-all" />
                              <div className="flex-1">
                                 <h4 className="font-display font-bold text-2xl mb-1 group-hover:text-terracotta transition-colors uppercase tracking-tight">{pin.description}</h4>
                                 <p className="text-xs text-bone font-mono mb-3">{pin.tags?.join(' // ')}</p>
                                 <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-khaki">
                                    <span className="flex items-center gap-1.5"><Heart className="h-3 w-3"/> {pin.likeCount || 0} Likes</span>
                                    <span>{new Date(pin.createdAt).toLocaleDateString()}</span>
                                 </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ArrowRightIcon />
                              </div>
                           </div>
                        ))}
                     </div>
                   ) : (
                     <MasonryGrid pins={displayedPins} onPinClick={setSelectedPin} />
                   )}
                </motion.div>
             )}

           </AnimatePresence>
        </div>
      </main>

      {/* QR Modal */}
      <AnimatePresence>
         {showQr && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 backdrop-blur-md p-4" onClick={() => setShowQr(false)}>
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, rotateX: 20 }} 
                 animate={{ scale: 1, opacity: 1, rotateX: 0 }} 
                 exit={{ scale: 0.9, opacity: 0, rotateX: -20 }}
                 className="bg-charcoal p-10 max-w-sm w-full border border-khaki shadow-hard-lg text-center text-wick relative"
                 onClick={e => e.stopPropagation()}
               >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-terracotta to-transparent"></div>
                  <h3 className="text-3xl font-display font-black uppercase mb-8 tracking-wide">Node Access</h3>
                  <div className="aspect-square bg-white p-4 mb-8">
                     <QrCode className="h-full w-full text-black" />
                  </div>
                  <p className="font-mono text-[10px] text-bone mb-8 break-all border border-khaki p-2 bg-charcoal">{window.location.href}</p>
                  <button onClick={() => setShowQr(false)} className="w-full py-4 bg-khaki/20 hover:bg-terracotta text-wick hover:text-charcoal font-black uppercase tracking-widest transition border border-khaki">Close Connection</button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {selectedPin && (
        <DetailModal 
          pin={selectedPin} 
          onClose={() => setSelectedPin(null)} 
          relatedPins={createdPins.filter(p => p.id !== selectedPin.id).slice(0, 5)}
        />
      )}
    </div>
  );
};

// Helper for the list view arrow
const ArrowRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="text-terracotta">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default UserProfile;