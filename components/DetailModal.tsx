import React, { useState, useEffect, useRef } from 'react';
import { Pin, Comment } from '../types';
import { X, Share2, Sparkles, Loader2, Send, Trash2, ExternalLink, Download, Heart, Maximize2, Minimize2, Bookmark } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { addComment, deleteComment, deletePin, toggleLike, toggleSave, subscribeToUserProfile } from '../services/database';
import { cn, generateAvatarColor, getInitials, formatTimeAgo } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { XP_RATES } from '../services/gamificationConstants';

interface DetailModalProps {
  pin: Pin;
  onClose: () => void;
  relatedPins: Pin[];
}

interface CommentItemProps {
  comment: Comment;
  user: any;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onClose: () => void;
  navigate: any;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, user, isOwner, onDelete, onClose, navigate }) => {
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserProfile(comment.userId, (data) => {
      setAuthorAvatar(data?.photoURL || null);
    });
    return () => unsub();
  }, [comment.userId]);

  return (
    <div className="flex gap-3 group">
       <div className={cn("h-6 w-6 flex-shrink-0 border border-khaki bg-charcoal overflow-hidden relative", !authorAvatar && generateAvatarColor(comment.userName).replace('bg-', 'bg-opacity-20 '))}>
          {authorAvatar ? (
             <img src={authorAvatar} alt={comment.userName} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center font-bold text-wick text-[10px]">
                {getInitials(comment.userName)}
             </div>
          )}
       </div>
       <div className="flex-1 relative">
          <div className="flex items-baseline justify-between mb-1">
             <span className="text-xs font-black uppercase cursor-pointer hover:underline text-wick" onClick={() => { onClose(); navigate(`/profile/${comment.userId}`)}}>{comment.userName}</span>
             <span className="text-[10px] font-mono text-khaki">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm font-mono leading-tight bg-khaki/5 p-2 border border-khaki text-bone">{comment.text}</p>
          
          {(user?.uid === comment.userId || isOwner) && (
             <button 
               onClick={() => onDelete(comment.id)}
               className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-terracotta text-khaki"
               title="Delete comment"
             >
               <X className="h-3 w-3" />
             </button>
          )}
       </div>
    </div>
  );
};

const DetailModal: React.FC<DetailModalProps> = ({ pin, onClose, relatedPins }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{ description: string; tags: string[] } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const comments: Comment[] = pin.comments 
    ? Object.entries(pin.comments).map(([key, val]) => ({
        ...(val as any),
        id: key
      })).sort((a, b) => a.createdAt - b.createdAt)
    : [];

  const isOwner = user?.uid === pin.userId;
  const isLiked = user && pin.likes && pin.likes[user.uid];
  const isSaved = user && pin.saves && pin.saves[user.uid];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    if (pin.userId) {
       const unsub = subscribeToUserProfile(pin.userId, (data) => {
          setAuthorAvatar(data?.photoURL || null);
       });
       return () => unsub();
    }
  }, [pin.userId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeImage(pin.url);
    setAnalysis(result);
    setAnalyzing(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addComment(pin.id, { uid: user.uid, displayName: user.displayName || 'User' }, commentText);
      setCommentText('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      showToast(`Comment added (+${XP_RATES.COMMENT} XP)`, "success");
    } catch (error) {
      showToast("Failed to post comment", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (window.confirm("Delete this comment?")) {
      try {
        await deleteComment(pin.id, commentId);
        showToast("Comment deleted", "success");
      } catch (e) {
        showToast("Failed to delete", "error");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this pin?")) {
      await deletePin(pin.id);
      showToast("Pin deleted", "success");
      onClose();
    }
  };

  const handleLike = async () => {
    if (!user) return showToast("Log in to like pins", "info");
    await toggleLike(pin.id, user.uid);
  };

  const handleSave = async () => {
    if (!user) return showToast("Log in to save pins", "info");
    await toggleSave(pin.id, user.uid);
    if (!isSaved) showToast("Saved to collection", "success");
  }

  const goToProfile = () => {
    onClose();
    navigate(`/profile/${pin.userId}`);
  };

  const handleDownload = async () => {
      try {
        const response = await fetch(pin.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pinme-${pin.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Saved to device", "success");
      } catch (err) {
        showToast("Download failed", "error");
      }
  };

  const toggleImageFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFit(prev => prev === 'cover' ? 'contain' : 'cover');
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/95 backdrop-blur-sm p-0 md:p-4" 
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          className="bg-charcoal w-full md:max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row relative md:border md:border-khaki shadow-hard-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 p-2 bg-charcoal text-wick border border-khaki z-50 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop Close Button */}
          <button 
            onClick={onClose}
            className="hidden md:flex absolute right-4 top-4 p-2 bg-charcoal text-khaki border border-khaki hover:bg-terracotta hover:text-charcoal hover:border-terracotta transition z-50"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Left: Image Canvas */}
          <div className="w-full md:w-[55%] h-[40vh] md:h-full bg-charcoal flex items-center justify-center relative shrink-0 border-b md:border-b-0 md:border-r border-khaki group">
             <div className="w-full h-full flex items-center justify-center bg-charcoal relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #333330 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <img 
                  src={pin.url} 
                  alt={pin.description} 
                  className={cn(
                    "w-full h-full relative z-10 cursor-zoom-in transition-all duration-300",
                    imageFit === 'cover' ? "object-cover" : "object-contain"
                  )}
                  onClick={() => setIsFullScreen(true)}
                />
             </div>
             
             {/* Controls Overlay */}
             <div className="absolute top-4 right-4 md:right-auto md:left-4 z-20 flex flex-col gap-2">
                <button 
                   onClick={() => setIsFullScreen(true)}
                   className="p-2 bg-charcoal text-wick border border-khaki hover:bg-khaki hover:text-charcoal transition-all group-hover:opacity-100 opacity-100 md:opacity-0"
                   title="Full Screen"
                >
                   <Maximize2 className="h-4 w-4" />
                </button>
                <button 
                   onClick={toggleImageFit}
                   className="p-2 bg-charcoal text-wick border border-khaki hover:bg-khaki hover:text-charcoal transition-all group-hover:opacity-100 opacity-100 md:opacity-0"
                   title={imageFit === 'cover' ? "Fit Image" : "Fill Container"}
                >
                   {imageFit === 'cover' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4 rotate-45" />}
                </button>
             </div>
             
             {/* Image Actions Overlay */}
             <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                <a href={pin.url} target="_blank" className="text-[10px] font-black uppercase tracking-widest bg-charcoal text-bone border border-khaki px-3 py-1 hover:bg-terracotta hover:text-charcoal hover:border-terracotta transition flex items-center gap-2">
                   <ExternalLink className="h-3 w-3" /> Source
                </a>
             </div>
          </div>

          {/* Right: Info & Comments */}
          <div className="w-full md:w-[45%] flex flex-col flex-1 min-h-0 bg-charcoal text-wick relative">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              
              {/* Header / Meta */}
              <div className="flex justify-between items-center mb-6 pl-12 md:pl-0">
                 <div className="flex gap-2">
                    <button className="p-2 border border-khaki hover:bg-khaki hover:text-charcoal transition text-bone" title="Share">
                      <Share2 className="h-4 w-4"/>
                    </button>
                    <button onClick={handleDownload} className="p-2 border border-khaki hover:bg-khaki hover:text-charcoal transition text-bone" title="Download">
                      <Download className="h-4 w-4"/>
                    </button>
                    {isOwner && (
                      <button onClick={handleDelete} className="p-2 border border-khaki hover:bg-terracotta hover:text-charcoal hover:border-terracotta transition text-bone" title="Delete">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    )}
                 </div>
                 
                 <div className="flex gap-2">
                   <button 
                     onClick={handleLike}
                     className={cn(
                       "px-4 py-2 border transition flex items-center gap-2 hover:border-terracotta hover:text-terracotta",
                       isLiked ? "border-terracotta text-terracotta" : "border-khaki text-bone"
                     )}
                     title="Like"
                   >
                     <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                     <span className="text-xs font-black uppercase tracking-widest">{pin.likeCount || 0}</span>
                   </button>

                   <button 
                     onClick={handleSave}
                     className={cn(
                       "px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition flex items-center gap-2",
                       isSaved
                        ? "bg-terracotta text-charcoal border-terracotta" 
                        : "bg-charcoal text-bone border-khaki hover:bg-khaki hover:text-charcoal"
                     )}
                   >
                     <Bookmark className={cn("h-3 w-3", isSaved && "fill-current")} /> {isSaved ? 'Saved' : 'Save'}
                   </button>
                 </div>
              </div>

              {/* Content */}
              <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl font-black leading-tight mb-4 text-wick uppercase tracking-tight">{pin.description}</h1>
                  
                  <div className="flex items-center gap-3 cursor-pointer p-3 border border-khaki hover:bg-khaki/20 transition group" onClick={goToProfile}>
                      <div className={cn("h-8 w-8 shrink-0 border border-khaki bg-charcoal overflow-hidden relative", !authorAvatar && generateAvatarColor(pin.author).replace('bg-', 'bg-opacity-20 '))}>
                          {authorAvatar ? (
                             <img src={authorAvatar} alt={pin.author} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center font-bold text-wick text-xs">{getInitials(pin.author)}</div>
                          )}
                      </div>
                      <div>
                          <p className="text-xs font-black uppercase tracking-widest text-wick">{pin.author}</p>
                          <p className="text-[10px] font-mono text-khaki">View Profile</p>
                      </div>
                  </div>
              </div>

              {/* AI Analysis Section */}
              <div className="mb-8 bg-charcoal border border-khaki p-5 relative">
                    <div className="absolute top-0 right-0 bg-terracotta border-l border-b border-khaki px-2 py-1 text-[10px] font-black uppercase text-charcoal">AI BETA</div>
                    <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center text-xs font-black uppercase tracking-widest text-khaki">
                          <Sparkles className="h-3 w-3 mr-2" /> Analysis
                       </div>
                       {!analysis && !analyzing && (
                          <button onClick={handleAnalyze} className="text-[10px] font-bold border border-khaki px-2 py-1 text-bone hover:bg-khaki hover:text-charcoal transition uppercase">Run Scan</button>
                       )}
                    </div>

                    {analyzing && <div className="text-xs font-mono flex items-center gap-2 text-khaki"><Loader2 className="animate-spin h-3 w-3"/> PROCESSING_IMAGE...</div>}
                    
                    {analysis && (
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <p className="text-sm font-mono leading-relaxed mb-4 border-l border-khaki pl-3 text-bone">{analysis.description}</p>
                          <div className="flex flex-wrap gap-2">
                             {Array.isArray(analysis.tags) && analysis.tags.map(t => (
                                <span key={t} className="px-2 py-1 bg-charcoal border border-khaki text-[10px] uppercase font-bold tracking-wide text-khaki hover:text-terracotta hover:border-terracotta transition-colors">#{t}</span>
                             ))}
                          </div>
                       </motion.div>
                    )}
              </div>

              {/* Comments */}
              <div>
                 <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-khaki pb-2 flex justify-between text-bone">
                    <span>Comments {comments.length > 0 && `// ${comments.length}`}</span>
                 </h3>
                 
                 <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-6 text-khaki/50 font-mono text-xs uppercase">No signal detected.</div>
                    ) : comments.map((comment) => (
                       <CommentItem 
                          key={comment.id} 
                          comment={comment} 
                          user={user} 
                          isOwner={isOwner} 
                          onDelete={handleCommentDelete}
                          onClose={onClose}
                          navigate={navigate}
                       />
                    ))}
                 </div>
              </div>
              
              <div ref={commentsEndRef}></div>
            </div>

            {/* Sticky Comment Input */}
            <div className="p-4 border-t border-khaki bg-charcoal shrink-0">
               <form onSubmit={handleCommentSubmit} className="flex gap-0 relative">
                  <input
                     type="text"
                     value={commentText}
                     onChange={(e) => setCommentText(e.target.value)}
                     placeholder="INPUT_COMMENT..."
                     className="flex-1 bg-charcoal border border-khaki py-3 px-4 text-xs font-mono font-bold outline-none placeholder:text-khaki focus:border-terracotta text-wick transition-colors"
                  />
                  <button 
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="bg-khaki text-charcoal px-4 border-y border-r border-khaki hover:bg-terracotta disabled:opacity-50 transition flex items-center justify-center font-bold"
                  >
                    {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                  </button>
               </form>
            </div>

          </div>
        </motion.div>
      </motion.div>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-charcoal flex items-center justify-center"
            onClick={() => setIsFullScreen(false)}
          >
             {/* Controls */}
             <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                <span className="text-khaki font-mono text-xs uppercase tracking-widest">{pin.description}</span>
                <button 
                   onClick={() => setIsFullScreen(false)}
                   className="p-3 bg-charcoal text-wick border border-khaki hover:bg-khaki hover:text-charcoal transition pointer-events-auto"
                >
                   <Minimize2 className="h-6 w-6" />
                </button>
             </div>

             <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={pin.url} 
                alt={pin.description} 
                className="max-h-screen max-w-full object-contain pointer-events-none select-none"
             />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DetailModal;