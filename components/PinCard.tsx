import React, { useState, useEffect } from 'react';
import { Pin } from '../types';
import { Share2, Heart, Download, MessageCircle, Hash, Bookmark } from 'lucide-react';
import { cn, generateAvatarColor, getInitials, formatTimeAgo } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { toggleLike, toggleSave, subscribeToUserProfile } from '../services/database';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';

interface PinCardProps {
  pin: Pin;
  onClick: (pin: Pin) => void;
  index?: number;
  viewMode?: 'masonry' | 'list' | 'compact';
  onTagClick?: (tag: string) => void;
}

const PinCard: React.FC<PinCardProps> = ({ pin, onClick, viewMode = 'masonry', onTagClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const isLiked = user && pin.likes && pin.likes[user.uid];
  const isSaved = user && pin.saves && pin.saves[user.uid];
  const commentCount = pin.comments ? Object.keys(pin.comments).length : 0;

  useEffect(() => {
    if (pin.userId) {
       const unsub = subscribeToUserProfile(pin.userId, (data) => {
          setAuthorAvatar(data?.photoURL || null);
       });
       return () => unsub();
    }
  }, [pin.userId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast("Log in to like", "info");
      return;
    }
    await toggleLike(pin.id, user.uid);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast("Log in to save", "info");
      return;
    }
    await toggleSave(pin.id, user.uid);
    if (!isSaved) showToast("Saved to collection", "success");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showToast("Downloading...", "info");
      const response = await fetch(pin.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pinme-${pin.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      showToast("Download failed", "error");
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/#/?pin=${pin.id}`);
    showToast("Link copied", "success");
  };

  const handleTagClickInternal = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    if (onTagClick) onTagClick(tag);
  };

  // --- VIEW: COMPACT (Contact Sheet Style) ---
  if (viewMode === 'compact') {
    return (
      <motion.div 
        whileHover={{ zIndex: 10 }}
        className="relative group cursor-pointer aspect-square bg-charcoal overflow-hidden"
        onClick={() => onClick(pin)}
      >
        <div className="absolute inset-0 bg-charcoal animate-pulse z-0" />
        <img
          src={pin.url}
          alt={pin.description}
          className={cn(
             "w-full h-full object-cover transition-opacity duration-300 z-10 relative",
             imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-2">
           <Heart className={cn("h-4 w-4 text-white", isLiked && "fill-current text-terracotta")} />
           <span className="text-white text-xs font-bold">{pin.likeCount || 0}</span>
        </div>
      </motion.div>
    );
  }

  // --- VIEW: LIST (Detailed Feed) ---
  if (viewMode === 'list') {
    return (
      <div 
        className="group relative flex flex-col md:flex-row bg-charcoal border border-khaki hover:border-terracotta transition-colors cursor-pointer mb-6"
        onClick={() => onClick(pin)}
      >
         {/* Image Section */}
         <div className="w-full md:w-1/3 aspect-video md:aspect-[4/3] bg-charcoal overflow-hidden relative border-r border-khaki">
            <div className="absolute inset-0 bg-charcoal animate-pulse z-0" />
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              src={pin.url}
              alt={pin.description}
              className={cn(
                "w-full h-full object-cover z-10 relative transition-all",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
         </div>

         {/* Content Section */}
         <div className="flex-1 p-8 flex flex-col justify-between bg-charcoal">
            <div>
               <div className="flex items-center gap-4 mb-5">
                  <div className={cn("w-10 h-10 shrink-0 border border-khaki overflow-hidden relative bg-charcoal", !authorAvatar && generateAvatarColor(pin.author))}>
                      {authorAvatar ? (
                        <img src={authorAvatar} alt={pin.author} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-wick">{getInitials(pin.author)}</div>
                      )}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-sm font-black text-wick uppercase tracking-widest leading-none">{pin.author}</span>
                      <span className="text-xs text-bone font-mono mt-1">{formatTimeAgo(pin.createdAt)}</span>
                  </div>
               </div>
               
               <h3 className="text-2xl font-black text-wick mb-4 line-clamp-2 uppercase tracking-tight group-hover:text-terracotta transition-colors font-display">{pin.description}</h3>
               
               {/* Tags */}
               <div className="flex flex-wrap gap-2 mb-6">
                  {pin.tags?.map(tag => (
                     <span 
                       key={tag} 
                       onClick={(e) => handleTagClickInternal(e, tag)}
                       className="text-xs font-bold uppercase tracking-widest text-bone border border-khaki px-3 py-1.5 hover:bg-khaki hover:text-charcoal transition cursor-pointer"
                     >
                        #{tag}
                     </span>
                  ))}
               </div>
            </div>

            <div className="flex items-center justify-between border-t border-khaki pt-6 mt-2">
               <div className="flex gap-6 text-sm font-mono text-bone">
                  <span className={cn("flex items-center gap-2", isLiked && "text-terracotta")}><Heart className={cn("h-5 w-5", isLiked && "fill-current")}/> {pin.likeCount || 0}</span>
                  <span className="flex items-center gap-2"><MessageCircle className="h-5 w-5"/> {commentCount}</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={handleShare} className="p-2 border border-khaki hover:bg-khaki hover:text-charcoal text-wick transition"><Share2 className="h-4 w-4"/></button>
                  <button onClick={handleDownload} className="p-2 border border-khaki hover:bg-khaki hover:text-charcoal text-wick transition"><Download className="h-4 w-4"/></button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLike} 
                    className={cn("p-2 border border-khaki transition flex items-center gap-2 uppercase text-xs font-bold", isLiked ? "text-terracotta border-terracotta" : "hover:text-terracotta hover:border-terracotta")}
                  >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSave} 
                    className={cn("p-2 border border-khaki transition flex items-center gap-2 uppercase text-xs font-bold", isSaved ? "bg-terracotta text-charcoal border-terracotta" : "hover:bg-terracotta hover:text-charcoal hover:border-terracotta")}
                  >
                    <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} /> {isSaved ? "SAVED" : "SAVE"}
                  </motion.button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- VIEW: MASONRY (Default) ---
  return (
    <motion.div 
      className="masonry-item relative group cursor-pointer break-inside-avoid pb-6"
      onClick={() => onClick(pin)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden w-full bg-charcoal">
          <div className={cn("absolute inset-0 bg-charcoal z-0", !imageLoaded && "animate-pulse")} />
          
          <img
            src={pin.url}
            alt={pin.description}
            className={cn(
              "w-full h-auto block relative z-10 transition-all duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />

          {/* Overlay Actions (Save Only on Hover to keep clean) */}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className={cn(
                   "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-colors shadow-sm",
                   isSaved 
                     ? "bg-terracotta text-charcoal" 
                     : "bg-charcoal text-bone hover:bg-white hover:text-charcoal"
                )}
             >
                {isSaved ? "Saved" : "Save"}
             </motion.button>
          </div>
      </div>

      {/* Bottom Metadata & Actions */}
      <div className="pt-2 px-1 flex flex-col gap-1.5">
         <p className="text-[11px] font-bold text-wick truncate leading-tight group-hover:text-terracotta transition-colors">{pin.description}</p>
         
         <div className="flex justify-between items-center">
            {/* Author */}
            <div className="flex items-center gap-1.5 min-w-0 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className={cn("w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black overflow-hidden bg-khaki/20", !authorAvatar && generateAvatarColor(pin.author))}>
                   {authorAvatar ? <img src={authorAvatar} alt="" className="w-full h-full object-cover"/> : getInitials(pin.author)}
                </div>
                <span className="text-[10px] text-bone font-medium truncate uppercase tracking-wide">{pin.author}</span>
            </div>

            {/* Interactive Like Button */}
            <button 
              onClick={handleLike}
              className="flex items-center gap-1 group/like z-10 p-1 -mr-1 rounded hover:bg-khaki/10 transition-colors"
              title="Like"
            >
               <Heart className={cn("h-3.5 w-3.5 transition-all", isLiked ? "fill-terracotta text-terracotta" : "text-bone group-hover/like:text-terracotta group-hover/like:scale-110")} />
               <span className={cn("text-[10px] font-mono", isLiked ? "text-terracotta font-bold" : "text-bone group-hover/like:text-wick")}>
                  {pin.likeCount || 0}
               </span>
            </button>
         </div>
      </div>
    </motion.div>
  );
};

export default React.memo(PinCard);