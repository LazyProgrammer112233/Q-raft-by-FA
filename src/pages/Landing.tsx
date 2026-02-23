
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { Navigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Database, FileText, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

// Fade-up variants for staggered children
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Landing() {
    const { isSignedIn, isLoaded } = useAuth();
    const [showAuth, setShowAuth] = useState(false);

    // Use motion values for smoother, hardware-accelerated tracking
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 120 };
    const blobX = useSpring(cursorX, springConfig);
    const blobY = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 100); // Offset to center the 200px blob
            cursorY.set(e.clientY - 100);
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [cursorX, cursorY]);

    if (isLoaded && isSignedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-[#030712] flex flex-col items-center justify-center p-4 py-12 md:p-8">
            {/* Interactive Cursor-following Blob - Fixed Visibility */}
            <motion.div
                className="absolute top-0 left-0 w-[200px] h-[200px] bg-primary-400/60 rounded-full blur-[60px] pointer-events-none mix-blend-screen z-0"
                style={{ x: blobX, y: blobY }}
            />
            {/* Static Ambient Blobs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-soft mix-blend-screen" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-[#3895e7]/10 rounded-full blur-[120px] pointer-events-none animate-pulse-soft mix-blend-screen" style={{ animationDelay: '1.5s' }} />

            {/* Grid Pattern Overlay for Depth */}
            <div className="absolute inset-0 bg-[url(https://grainy-gradients.vercel.app/noise.svg)] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none z-0" />

            {/* Main Content container */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="max-w-4xl w-full px-4 md:px-8 relative z-10 flex flex-col items-center text-center space-y-6"
            >
                {/* Branding / Logo Area */}
                <motion.div variants={itemVariants} className="flex items-center space-x-4 mb-2 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg shadow-black/50">
                    <img src={logo} alt="Qraft Logo" className="h-10 md:h-12 w-auto object-contain brightness-0 invert opacity-90" />
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white m-0">
                        Qraft
                    </h1>
                </motion.div>

                {/* Badge */}
                <motion.div variants={itemVariants} className="flex items-center space-x-2 bg-primary-900/40 backdrop-blur-md px-4 py-2 rounded-full ring-1 ring-primary-500/30 shadow-[0_0_15px_rgba(56,149,231,0.2)]">
                    <Zap className="w-4 h-4 text-primary-400" />
                    <span className="text-xs md:text-sm font-semibold text-primary-200 tracking-wide uppercase">AI SQL Auto-Generator</span>
                </motion.div>

                {/* Headline */}
                <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl lg:text-5xl font-bold tracking-tight text-white leading-[1.2] max-w-3xl drop-shadow-xl">
                    Turn Requirements into <span className="text-gradient hover:drop-shadow-[0_0_30px_rgba(56,149,231,0.5)] transition-all duration-300">SQL Instantly</span>
                </motion.h2>

                {/* Subtitle */}
                <motion.p variants={itemVariants} className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed font-light">
                    Automate data requirement extraction from your documents.
                    Upload a PDF or Word file and instantly generate robust, optimized
                    queries for ClickHouse, Trino, and Postgres.
                </motion.p>

                {/* CTA */}
                <motion.div variants={itemVariants} className="pt-4 z-20 w-full flex justify-center">
                    {!showAuth ? (
                        <button onClick={() => setShowAuth(true)} type="button" className="btn-primary text-base md:text-lg px-8 py-3.5 relative overflow-hidden group">
                            <span className="relative z-10">Get Started Securely</span>
                            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        </button>
                    ) : (
                        <div className="bg-slate-900/80 p-6 rounded-2xl w-full max-w-sm backdrop-blur-xl border border-white/10 shadow-2xl relative z-30">
                            <AuthForm />
                        </div>
                    )}
                </motion.div>

                {/* Feature grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 md:pt-6 w-full max-w-4xl lg:px-6">
                    <FeatureCard
                        icon={<FileText className="w-5 h-5 text-primary-400" />}
                        title="Read Any Document"
                        description="Supports seamless parsing for PDF, DOCX, and TXT files natively."
                    />
                    <FeatureCard
                        icon={<Zap className="w-5 h-5 text-primary-400" />}
                        title="AI Extraction"
                        description="Smart schema inference and complex joining logic."
                    />
                    <FeatureCard
                        icon={<Database className="w-5 h-5 text-primary-400" />}
                        title="Multi-Dialect"
                        description="ClickHouse, Trino, and PostgreSQL configured out of the box."
                    />
                </motion.div>
            </motion.div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center sm:items-start text-center sm:text-left space-y-4 hover:-translate-y-2 hover:bg-slate-800/60 group transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="p-3 bg-primary-900/50 rounded-2xl ring-1 ring-primary-500/30 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(56,149,231,0.3)] transition-all duration-300 relative z-10">
                {icon}
            </div>
            <div className="relative z-10">
                <h3 className="font-semibold text-lg text-white group-hover:text-primary-300 transition-colors duration-300">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mt-1">{description}</p>
            </div>
        </div>
    );
}

function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = isSignUp
            ? await supabase.auth.signUp({ email, password })
            : await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    };

    return (
        <form onSubmit={handleAuth} className="flex flex-col gap-4 text-left w-full text-slate-200">
            <h3 className="text-xl font-bold text-white mb-2">{isSignUp ? 'Create an account' : 'Sign In'}</h3>
            {error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600" placeholder="you@example.com" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 rounded-xl text-sm font-medium">
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
            <p className="text-sm text-slate-400 text-center mt-3 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary-400 hover:text-primary-300 hover:underline transition-all">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </form>
    );
}
