import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { SqlGeneration } from '../store/useAppStore';

interface TaskOutputScreenProps {
    generation: SqlGeneration;
}

export default function TaskOutputScreen({ generation }: TaskOutputScreenProps) {
    const [activeTab, setActiveTab] = useState<'ClickHouse' | 'Trino' | 'PostgreSQL'>('ClickHouse');
    const [expanded, setExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    const getActiveCode = () => {
        switch (activeTab) {
            case 'ClickHouse': return generation.clickhouse_sql;
            case 'Trino': return generation.trino_sql;
            case 'PostgreSQL': return generation.postgres_sql;
            default: return '';
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(getActiveCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const blob = new Blob([getActiveCode()], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generation.task_name.replace(/\s+/g, '_').toLowerCase()}_${activeTab.toLowerCase()}.sql`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-panel rounded-3xl overflow-hidden mb-8 transition-all duration-300 ${expanded ? 'shadow-[0_0_30px_rgba(56,149,231,0.2)] ring-1 ring-primary-500/30' : 'hover:shadow-2xl hover:ring-1 hover:ring-white/20'}`}
        >
            <div
                className={`px-8 py-6 flex items-start sm:items-center justify-between cursor-pointer transition-colors ${expanded ? 'bg-slate-900/60' : 'hover:bg-slate-800/80 bg-slate-900/40'}`}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-1 pr-4">
                    <h3 className="font-bold text-xl text-white tracking-tight flex items-center gap-3">
                        {generation.task_name}
                        {!expanded && (
                            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
                                Click to expand
                            </span>
                        )}
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed font-light">{generation.description}</p>
                </div>
                <div className="flex shrink-0 space-x-2">
                    {expanded && (
                        <div className="hidden sm:flex border border-white/10 rounded-xl bg-slate-900/80 p-1 mr-4 shadow-sm">
                            <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors flex items-center space-x-1" title="Copy SQL">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={handleDownload} className="p-2 text-slate-400 hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors flex items-center space-x-1" title="Download .sql">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <button className={`p-2 rounded-xl transition-all ${expanded ? 'bg-primary-900/50 text-primary-300 ring-1 ring-primary-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'}`}>
                        {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="border-t border-white/10 bg-slate-900/80"
                    >
                        {/* Tabs */}
                        <div className="flex px-6 pt-3 space-x-2 border-b border-white/5 overflow-x-auto hide-scrollbar">
                            {['ClickHouse', 'Trino', 'PostgreSQL'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#1e1e1e] text-primary-300 border-t border-x border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] translate-y-[1px]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                >
                                    {tab} Engine
                                </button>
                            ))}

                            <div className="flex-1 min-w-[20px]" />

                            <div className="flex sm:hidden space-x-1 pb-2 items-end">
                                <button onClick={handleCopy} className="p-2 bg-slate-800 border border-white/10 text-slate-400 hover:text-primary-400 rounded-lg shadow-sm" title="Copy SQL">
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button onClick={handleDownload} className="p-2 bg-slate-800 border border-white/10 text-slate-400 hover:text-primary-400 rounded-lg shadow-sm" title="Download .sql">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="h-72 sm:h-96 w-full p-2 bg-[#1e1e1e] relative">
                            {/* Inner Premium Glow */}
                            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />
                            <Editor
                                height="100%"
                                defaultLanguage="sql"
                                language="sql"
                                theme="vs-dark"
                                value={getActiveCode()}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 14,
                                    fontFamily: '"JetBrains Mono", "SF Mono", Consolas, Monaco, monospace',
                                    padding: { top: 24, bottom: 24 },
                                    lineHeight: 1.6,
                                    renderLineHighlight: 'none',
                                    scrollbar: {
                                        verticalScrollbarSize: 8,
                                        horizontalScrollbarSize: 8,
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
