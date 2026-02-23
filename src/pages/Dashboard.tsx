import { useState } from 'react';
import { useUser, useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Upload, Settings, FilePlus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import UploadDropzone from '../components/UploadDropzone';
import TaskOutputScreen from '../components/TaskOutputScreen';
import logo from '../assets/logo.png';

export default function Dashboard() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { currentGenerations, fileName, reset, settings, updateSettings } = useAppStore();
    const [activeTab, setActiveTab] = useState<'upload' | 'settings'>('upload');

    return (
        <div className="min-h-screen bg-[#030712] flex p-4 space-x-6 overflow-hidden">
            {/* Ambient Dark Mode Background Glow conditional to settings */}
            {!settings.reducedMotion && (
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary-900/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/30 rounded-full blur-[140px]" />
                </div>
            )}

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-72 glass-panel rounded-[2rem] flex flex-col p-6 h-[calc(100vh-2rem)] z-10 relative shadow-2xl"
            >
                <div className="flex items-center space-x-3 mb-10 mt-2 px-2 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg shadow-black/50">
                    <img src={logo} alt="FieldAssist Logo" className="h-9 object-contain brightness-0 invert opacity-90 mx-auto" />
                </div>

                <nav className="flex-1 space-y-2.5">
                    <NavItem
                        icon={<Upload className="w-5 h-5" />}
                        label="Upload Document"
                        active={activeTab === 'upload'}
                        onClick={() => setActiveTab('upload')}
                    />
                    <NavItem
                        icon={<Settings className="w-5 h-5" />}
                        label="Settings"
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/10">
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-900/60 hover:bg-slate-800 transition-colors rounded-2xl ring-1 ring-white/10 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-primary-400/50 shrink-0">
                            {user?.profile?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                            <div className="flex items-center text-sm font-semibold text-slate-200">
                                <span className="truncate">{user?.profile?.name || 'Analyst'}</span>
                                {settings.designation && <span className="shrink-0 text-[10px] ml-2 text-primary-400 font-bold bg-primary-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">{settings.designation}</span>}
                            </div>
                            <span className="text-xs text-slate-400 truncate">{user?.email}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => signOut().then(() => navigate('/'))}
                        className="flex items-center space-x-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl w-full px-4 py-3"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Log out</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 rounded-[2rem] bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-primary-900/20 border border-white/10 p-10 h-[calc(100vh-2rem)] overflow-y-auto relative z-10">

                <AnimatePresence mode="wait">
                    {activeTab === 'settings' ? (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.4 }}
                            className="max-w-4xl mx-auto space-y-8 h-full"
                        >
                            <header className="mb-10 pb-6 border-b border-white/10">
                                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                                    Preferences
                                </h1>
                                <p className="text-lg text-slate-400 mt-2 font-medium">Manage your workspace settings and generation functionality.</p>
                            </header>

                            <div className="space-y-6">
                                <div className="glass-panel p-6 rounded-2xl space-y-6 ring-1 ring-white/10 border-none bg-slate-900/60">

                                    {/* Setting 1: Designation */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Designation Role</h3>
                                            <p className="text-sm text-slate-400 mt-1">Customize dashboard context based on your team.</p>
                                        </div>
                                        <div className="relative w-full md:w-48">
                                            <select
                                                value={settings.designation}
                                                onChange={(e) => updateSettings({ designation: e.target.value as any })}
                                                className="bg-slate-800 appearance-none border-none text-white font-medium rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none block w-full py-3 pl-4 pr-10 shadow-inner ring-1 ring-white/10 cursor-pointer"
                                            >
                                                <option value="Tech">Tech</option>
                                                <option value="Product">Product</option>
                                                <option value="CST">CST</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Setting 2: Auto-copy */}
                                    <div className="flex items-center justify-between">
                                        <div className="pr-4">
                                            <h3 className="text-lg font-semibold text-white">Auto-copy Generated SQL</h3>
                                            <p className="text-sm text-slate-400 mt-1">Automatically copy the first ClickHouse query to clipboard after generating.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.autoCopySql}
                                                onChange={(e) => updateSettings({ autoCopySql: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 shadow-inner"></div>
                                        </label>
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Setting 3: Reduced Motion */}
                                    <div className="flex items-center justify-between">
                                        <div className="pr-4">
                                            <h3 className="text-lg font-semibold text-white">Reduced Background Animation</h3>
                                            <p className="text-sm text-slate-400 mt-1">Disable ambient glows and large background effects for better performance.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.reducedMotion}
                                                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 shadow-inner"></div>
                                        </label>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    ) : currentGenerations.length === 0 ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.5 }}
                            className="h-full flex flex-col"
                        >
                            <header className="mb-10">
                                <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                                    Welcome back, <span className="text-gradient drop-shadow-sm">{user?.profile?.name?.split(' ')[0] || 'there'}</span>! 👋
                                </h1>
                                <p className="text-lg text-slate-400 mt-2 font-medium">Upload a requirement document to instantly generate optimized SQL queries.</p>
                            </header>

                            <UploadDropzone />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, staggerChildren: 0.1 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-white/10 gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold flex flex-wrap items-center gap-3 text-white tracking-tight">
                                        <span>Results for</span>
                                        <span className="text-primary-300 bg-primary-900/50 px-4 py-1.5 rounded-xl border border-primary-500/30 shadow-sm">{fileName}</span>
                                    </h1>
                                    <p className="text-slate-400 mt-3 font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                        Found {currentGenerations.length} exact tasks mapped across 3 dialects.
                                    </p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="flex items-center space-x-2 bg-slate-800/80 text-slate-300 hover:text-primary-300 hover:border-primary-500/50 px-5 py-3 rounded-xl transition-all font-semibold shadow-sm border border-white/10 group hover:shadow-[0_0_15px_rgba(56,149,231,0.2)] hover:bg-slate-800"
                                >
                                    <FilePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span>Upload New</span>
                                </button>
                            </header>

                            <div className="space-y-8">
                                {currentGenerations.map((gen, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <TaskOutputScreen generation={gen} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${active ? 'bg-gradient-to-r from-primary-900/60 to-primary-800/40 text-primary-200 font-semibold shadow-sm ring-1 ring-primary-500/50' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium'}`}>
            <div className={`${active ? 'scale-110 text-primary-400' : 'text-slate-500 group-hover:text-primary-400'} transition-colors duration-300`}>
                {icon}
            </div>
            <span>{label}</span>
        </button>
    );
}
