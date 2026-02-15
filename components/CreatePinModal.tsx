import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Loader2, Wand2, ArrowRight, Info, Check, AlertTriangle, Monitor, Smartphone, Globe, FolderPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { savePin } from '../services/database';
import { analyzeImage } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { XP_RATES } from '../services/gamificationConstants';
import { useSound } from '../contexts/SoundContext';

interface CreatePinModalProps {
  onClose: () => void;
}

const SECTOR_SUGGESTIONS = [
  "Typography", "Industrial", "Cyberpunk", "Architecture", 
  "Interior", "Fashion", "Interface", "Photography", "Abstract"
];

const CreatePinModal: React.FC<CreatePinModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { playClick, playSuccess, playType, playError } = useSound();
  
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isValidImage, setIsValidImage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleImageChange = (url: string) => {
    setImageUrl(url);
    const img = new Image();
    img.onload = () => { setIsValidImage(true); playSuccess(); };
    img.onerror = () => { setIsValidImage(false); playError(); };
    img.src = url;
  };

  const handleAiAutofill = async () => {
    if (!isValidImage || !imageUrl) return;
    playClick();
    setAiLoading(true);
    try {
      const result = await analyzeImage(imageUrl);
      setDescription(result.description);
      setTags(result.tags.join(', '));
      showToast("Generated", "success");
      playSuccess();
    } catch (e) {
      showToast("Analysis failed", "error");
      playError();
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageUrl || !description) return;

    playClick();
    setLoading(true);
    try {
      await savePin({
        url: imageUrl,
        description,
        author: user.displayName || 'Anonymous',
        userId: user.uid,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        sector: sector || 'Unclassified'
      });
      showToast(`Entry Published (+${XP_RATES.CREATE_PIN} XP)`, "success");
      playSuccess();
      onClose();
    } catch (error) {
      showToast("Error", "error");
      playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/95 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-charcoal w-full md:max-w-6xl h-full md:h-[85vh] flex flex-col md:flex-row border-0 md:border md:border-khaki shadow-hard-lg relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Help Overlay */}
        <AnimatePresence>
           {showHelp && (
             <motion.div 
               initial={{ opacity: 0, x: "100%" }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="absolute inset-0 z-50 bg-charcoal flex flex-col md:flex-row"
             >
                {/* Left Side: Title */}
                <div className="w-full md:w-1/3 bg-terracotta text-charcoal p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-charcoal">
                   <div>
                      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-4">Source <br/> Protocol</h2>
                      <div className="h-2 w-24 bg-charcoal mb-6"></div>
                      <p className="font-mono text-sm font-bold uppercase tracking-widest opacity-80">
                         Manual for extracting visual signals from the external web.
                      </p>
                   </div>
                   <button 
                     onClick={() => setShowHelp(false)}
                     className="hidden md:flex items-center gap-2 font-black uppercase tracking-widest hover:translate-x-1 transition-transform"
                   >
                      <ArrowRight className="rotate-180 h-5 w-5" /> Return to Form
                   </button>
                   <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 md:hidden p-2 bg-charcoal text-terracotta">
                      <X className="h-6 w-6" />
                   </button>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-2/3 p-6 md:p-12 overflow-y-auto bg-charcoal text-wick">
                   <div className="space-y-8 md:space-y-12 max-w-2xl">
                      {/* Help Content (Same as before) */}
                      <div className="group">
                         <div className="flex items-center gap-3 mb-4 text-khaki">
                            <Monitor className="h-6 w-6" />
                            <h3 className="text-xl font-black uppercase tracking-widest">Desktop Method</h3>
                         </div>
                         <ol className="list-decimal list-inside space-y-3 font-mono text-sm text-bone pl-2 border-l border-khaki ml-3">
                            <li className="pl-2"><span className="text-wick font-bold">Locate the target visual</span> on any website.</li>
                            <li className="pl-2"><span className="text-wick font-bold">Right-Click</span> directly on the image itself.</li>
                            <li className="pl-2">Copy Image Address/Link.</li>
                         </ol>
                      </div>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-khaki bg-charcoal text-wick shrink-0">
             <h2 className="font-black text-sm uppercase tracking-widest">New Entry</h2>
             <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>

        {/* Left: Preview */}
        <div className="w-full md:w-1/2 bg-charcoal flex flex-col justify-center items-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-khaki relative overflow-hidden shrink-0">
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #333330 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
          {isValidImage ? (
             <div className="relative w-full max-w-md bg-charcoal border border-khaki p-2 shadow-lg group">
                <img src={imageUrl} alt="Preview" className="w-full h-auto object-cover block transition-all max-h-[40vh] md:max-h-none opacity-80 group-hover:opacity-100" />
                <div className="absolute -top-3 -right-3 bg-terracotta text-charcoal px-3 py-1 text-xs font-black uppercase tracking-widest border border-khaki">
                  Valid
                </div>
             </div>
          ) : (
             <div className="text-center py-10 md:py-0">
                <div className="border border-dashed border-khaki w-32 h-32 flex items-center justify-center mx-auto mb-6 bg-charcoal">
                  <Upload className="h-10 w-10 text-khaki" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-khaki/50">No Signal</p>
             </div>
          )}
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto bg-charcoal relative">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 border border-khaki text-khaki hover:bg-terracotta hover:text-charcoal transition hidden md:block">
              <X className="h-6 w-6" />
           </button>

           <div className="mb-8 md:mb-12 mt-2">
              <h2 className="text-4xl md:text-7xl font-black text-wick uppercase tracking-tighter mb-2">Create.</h2>
              <div className="h-1 w-24 bg-terracotta"></div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 flex-1">
              <div className="group">
                <div className="flex justify-between items-center mb-2 md:mb-3">
                   <label className="block text-xs font-black text-khaki uppercase tracking-widest">01 // Source Link</label>
                   <button 
                     type="button" 
                     onClick={() => setShowHelp(true)} 
                     className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-terracotta hover:underline"
                   >
                      <Info className="h-3 w-3" /> Help Protocol
                   </button>
                </div>
                
                <div className="relative">
                  <input 
                    type="url" 
                    value={imageUrl}
                    onChange={(e) => handleImageChange(e.target.value)}
                    onKeyDown={playType}
                    placeholder="PASTE URL..."
                    className="w-full bg-charcoal border border-khaki py-3 md:py-4 px-4 text-base md:text-lg font-bold font-mono text-wick outline-none focus:bg-khaki/10 focus:border-terracotta transition-all placeholder:text-khaki/30 appearance-none"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <LinkIcon className="h-5 w-5 text-khaki" />
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="flex justify-between items-end mb-2 md:mb-3">
                   <label className="block text-xs font-black text-khaki uppercase tracking-widest">02 // Details</label>
                   {isValidImage && (
                      <button type="button" onClick={handleAiAutofill} disabled={aiLoading} className="text-[10px] font-bold uppercase tracking-widest bg-khaki/10 text-bone px-3 py-1 hover:bg-terracotta hover:text-charcoal flex items-center border border-khaki transition-colors">
                         {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2"/> : <Wand2 className="h-3 w-3 mr-2"/>}
                         AI Auto-Fill
                      </button>
                   )}
                </div>
                <textarea 
                   rows={3}
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   onKeyDown={playType}
                   placeholder="DESCRIBE THE VISUAL..."
                   className="w-full bg-charcoal border border-khaki py-3 md:py-4 px-4 text-base md:text-lg font-bold font-mono text-wick outline-none focus:bg-khaki/10 focus:border-terracotta transition-all resize-none placeholder:text-khaki/30 appearance-none"
                   required
                />
              </div>

               {/* New Sector Selection */}
               <div className="group">
                <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 md:mb-3">03 // Sector (Collection)</label>
                <div className="relative">
                   <input 
                      type="text"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      onKeyDown={playType}
                      list="sectors"
                      placeholder="SELECT OR TYPE SECTOR..."
                      className="w-full bg-charcoal border border-khaki py-3 md:py-4 px-4 text-sm font-bold font-mono text-wick outline-none focus:bg-khaki/10 focus:border-terracotta transition-all placeholder:text-khaki/30 appearance-none"
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <FolderPlus className="h-5 w-5 text-khaki" />
                   </div>
                   <datalist id="sectors">
                      {SECTOR_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                   </datalist>
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 md:mb-3">04 // Keywords</label>
                <input 
                   type="text"
                   value={tags}
                   onChange={(e) => setTags(e.target.value)}
                   onKeyDown={playType}
                   placeholder="SEPARATE, WITH, COMMAS"
                   className="w-full bg-charcoal border border-khaki py-3 md:py-4 px-4 text-sm font-bold font-mono text-wick outline-none focus:bg-khaki/10 focus:border-terracotta transition-all placeholder:text-khaki/30 appearance-none"
                />
              </div>

              <div className="pt-8 flex justify-between items-center border-t border-khaki mt-auto md:mt-8 pb-8 md:pb-0">
                 <button type="button" onClick={onClose} className="text-xs font-black uppercase tracking-widest hover:underline text-khaki hover:text-terracotta">Cancel</button>
                 <button 
                   type="submit" 
                   disabled={loading || !isValidImage}
                   className="bg-terracotta text-charcoal border border-terracotta px-6 md:px-10 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-widest hover:bg-wick hover:border-wick transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 group"
                 >
                   {loading ? "Processing..." : "Publish Entry"}
                   {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                 </button>
              </div>
           </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePinModal;