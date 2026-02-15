import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Square, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-charcoal text-wick font-sans selection:bg-terracotta selection:text-charcoal">
      {/* Left: Form Section */}
      <div className="w-full md:w-1/2 p-8 md:p-24 flex flex-col justify-center border-r border-khaki relative bg-charcoal">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-8 left-8 flex items-center text-xs font-black uppercase tracking-widest hover:text-terracotta transition group text-bone"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Return
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <div className="inline-block px-3 py-1 border border-terracotta text-terracotta text-[10px] font-black uppercase tracking-widest mb-4 bg-terracotta/5">
               Secure Login
            </div>
            <h2 className="text-7xl font-black mb-6 leading-[0.85] tracking-tighter uppercase text-wick">
              Access <br/> Control.
            </h2>
            <div className="h-2 w-24 bg-terracotta"></div>
          </div>

          {error && (
            <div className="mb-8 text-charcoal text-xs font-bold uppercase tracking-widest border border-terracotta p-4 bg-terracotta flex items-center gap-2">
              <AlertCircle className="h-4 w-4"/> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="group relative">
              <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 group-focus-within:text-terracotta transition-colors">
                01 // Email Address
              </label>
              <input
                type="email"
                required
                className="w-full border-2 border-khaki py-4 px-4 text-lg font-bold font-mono text-wick outline-none focus:border-terracotta focus:bg-white transition-all placeholder:text-khaki/30 appearance-none bg-charcoal"
                placeholder="USER@DOMAIN.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="group relative">
              <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 group-focus-within:text-terracotta transition-colors">
                02 // Password
              </label>
              <input
                type="password"
                required
                className="w-full border-2 border-khaki py-4 px-4 text-lg font-bold font-mono text-wick outline-none focus:border-terracotta focus:bg-white transition-all placeholder:text-khaki/30 appearance-none bg-charcoal"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wick text-charcoal border border-wick py-5 text-sm font-black uppercase tracking-widest hover:bg-terracotta hover:border-terracotta hover:text-charcoal transition disabled:opacity-50 flex justify-center items-center mt-8 shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transform duration-200"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Authenticate'}
            </button>
          </form>

          <div className="mt-16 flex justify-between items-center text-xs border-t border-khaki pt-8">
            <span className="text-bone font-bold uppercase tracking-widest">New User?</span>
            <Link to="/register" className="font-black uppercase tracking-widest border-b-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-charcoal transition px-1 py-0.5">
              Initialize Account
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Brutalist Pattern */}
      <div className="hidden md:flex w-1/2 bg-panel relative overflow-hidden items-center justify-center">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #9DBDB8 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
         
         <div className="border-2 border-wick p-12 bg-charcoal transform rotate-3 shadow-hard-xl max-w-sm w-full relative z-10">
             <div className="absolute -top-3 -left-3 bg-terracotta text-charcoal px-3 py-1 font-mono text-xs font-bold uppercase border border-wick">Restricted</div>
             <Square className="h-24 w-24 mb-6 text-terracotta fill-terracotta/20" />
             <h3 className="text-5xl font-black uppercase tracking-tighter text-wick leading-none mb-4">PinMe<br/>System</h3>
             <p className="font-mono text-xs text-bone leading-relaxed">
                Authorized personnel only. All access is logged and monitored. Proceed with valid credentials.
             </p>
         </div>
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use.');
      } else {
        setError('Could not create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-charcoal text-wick font-sans selection:bg-terracotta selection:text-charcoal">
      {/* Left: Graphic */}
      <div className="hidden md:flex w-1/2 bg-panel relative overflow-hidden items-center justify-center border-r border-khaki">
         <div className="text-khaki/20 text-center select-none">
             <div className="text-[200px] font-black leading-none tracking-tighter">JOIN</div>
             <div className="text-2xl font-bold font-mono uppercase tracking-widest border-2 border-khaki inline-block px-4 py-2 mt-4 text-bone opacity-50 bg-charcoal">
                Public Access Protocol
             </div>
         </div>
      </div>

      {/* Right: Form Section */}
      <div className="w-full md:w-1/2 p-8 md:p-24 flex flex-col justify-center relative bg-charcoal">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-8 right-8 flex items-center text-xs font-black uppercase tracking-widest hover:text-terracotta transition group text-bone"
        >
           Home <ArrowLeft className="h-4 w-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <div className="inline-block px-3 py-1 border border-khaki text-khaki text-[10px] font-black uppercase tracking-widest mb-4 bg-khaki/10">
               New Entry
            </div>
            <h2 className="text-7xl font-black mb-6 leading-[0.85] tracking-tighter uppercase text-wick">
              Register <br/> Node.
            </h2>
            <div className="h-2 w-24 bg-terracotta"></div>
          </div>

          {error && (
            <div className="mb-8 text-charcoal text-xs font-bold uppercase tracking-widest border border-terracotta p-4 bg-terracotta flex items-center gap-2">
              <AlertCircle className="h-4 w-4"/> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="group relative">
              <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 group-focus-within:text-terracotta transition-colors">
                01 // Callsign (Name)
              </label>
              <input
                type="text"
                required
                className="w-full border-2 border-khaki py-4 px-4 text-lg font-bold font-mono text-wick outline-none focus:border-terracotta focus:bg-white transition-all placeholder:text-khaki/30 appearance-none bg-charcoal"
                placeholder="JOHN DOE"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="group relative">
              <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 group-focus-within:text-terracotta transition-colors">
                02 // Email
              </label>
              <input
                type="email"
                required
                className="w-full border-2 border-khaki py-4 px-4 text-lg font-bold font-mono text-wick outline-none focus:border-terracotta focus:bg-white transition-all placeholder:text-khaki/30 appearance-none bg-charcoal"
                placeholder="NAME@EXAMPLE.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="group relative">
              <label className="block text-xs font-black text-khaki uppercase tracking-widest mb-2 group-focus-within:text-terracotta transition-colors">
                03 // Password
              </label>
              <input
                type="password"
                required
                className="w-full border-2 border-khaki py-4 px-4 text-lg font-bold font-mono text-wick outline-none focus:border-terracotta focus:bg-white transition-all placeholder:text-khaki/30 appearance-none bg-charcoal"
                placeholder="CREATE PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wick text-charcoal border border-wick py-5 text-sm font-black uppercase tracking-widest hover:bg-terracotta hover:border-terracotta hover:text-charcoal transition disabled:opacity-50 flex justify-center items-center mt-8 shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transform duration-200"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-16 flex justify-between items-center text-xs border-t border-khaki pt-8">
            <span className="text-bone font-bold uppercase tracking-widest">Already Registered?</span>
            <Link to="/login" className="font-black uppercase tracking-widest border-b-2 border-terracotta text-terracotta hover:bg-terracotta hover:text-charcoal transition px-1 py-0.5">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};