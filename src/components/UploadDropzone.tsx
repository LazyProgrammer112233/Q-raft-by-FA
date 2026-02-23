import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateSqlGenerations } from '../lib/ai-sql';
import { supabase } from '../lib/supabase';
import { useUser } from '../components/AuthProvider';
import { motion } from 'framer-motion';

export default function UploadDropzone() {
    const { user } = useUser();
    const { isAnalyzing, setAnalyzing, setGenerations, settings } = useAppStore();
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAnalyzing) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (100 - prev) * 0.05;
                    return next > 95 ? 95 : next;
                });
            }, 300);
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert("File size exceeds 10MB limit.");
            return;
        }

        setAnalyzing(true);

        try {
            // Read file as Base64 safely for large files
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1] || '');
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            // Generate SQL using AI
            const generations = await generateSqlGenerations(base64String, file.name);

            // Save to Database
            if (user) {
                // Upload Original Document to Supabase Storage
                const { data: storageData, error: storageError } = await supabase.storage
                    .from('documents')
                    .upload(`${user.id}/${file.name}-${Date.now()}`, file);

                if (storageError) console.error("Storage upload error:", storageError);

                // Create Document Record in Database
                const { data: docData, error: docError } = await supabase
                    .from('documents')
                    .insert({ name: file.name, url: storageData?.path || '' })
                    .select()
                    .single();

                if (docError) console.error("DB Insert doc error:", docError);

                if (docData && generations.length > 0) {
                    const dbGenerations = generations.map(g => ({
                        document_id: docData.id,
                        task_name: g.task_name,
                        description: g.description,
                        clickhouse_sql: g.clickhouse_sql,
                        trino_sql: g.trino_sql,
                        postgres_sql: g.postgres_sql
                    }));

                    const { error: genError } = await supabase.from('sql_generations').insert(dbGenerations);
                    if (genError) console.error("DB Insert gens error:", genError);
                }
            }

            // Update UI state
            setGenerations(generations, file.name);

            // Auto-copy settings feature
            if (settings.autoCopySql && generations.length > 0) {
                try {
                    await navigator.clipboard.writeText(generations[0].clickhouse_sql);
                } catch (e) {
                    console.error("Clipboard write failed", e);
                }
            }

        } catch (error: any) {
            alert(error.message || "An error occurred during parsing.");
            setAnalyzing(false);
        }
    }, [user, setAnalyzing, setGenerations, settings.autoCopySql]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxFiles: 1,
        disabled: isAnalyzing
    });

    if (isAnalyzing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center h-[400px] relative overflow-hidden ring-1 ring-white/10"
            >
                {/* Ambient pulse effect behind loader */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary-500/20 rounded-full blur-[80px] animate-pulse" />

                <div className="relative z-10 flex flex-col items-center pt-8">
                    {/* Increased mb to a large value (mb-32) to ensure the gap is very visible */}
                    <div className="relative mb-32 mt-4">
                        <div className="w-20 h-20 bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl flex items-center justify-center relative z-10 ring-1 ring-white/20 text-white">
                            <Sparkles className="w-8 h-8 text-primary-400 animate-pulse" />
                        </div>
                        {/* Orbiting loading ring */}
                        <div className="absolute -inset-6 border-2 border-primary-500/30 border-t-primary-400 rounded-[2.5rem] animate-spin" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-10 border-2 border-blue-400/20 border-b-blue-300 rounded-[3rem] animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
                    </div>

                    <h3 className="text-2xl font-bold tracking-tight text-white mb-3 relative z-10 drop-shadow-md mt-4">Analyzing Document...</h3>
                    <p className="text-slate-400 font-medium max-w-sm relative z-10 mb-8 w-full px-4">
                        Extracting requirements, inferring schemas, and generating optimized SQL queries for all dialects.
                    </p>

                    {/* More visible Progress Bar */}
                    <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden relative z-10 shadow-inner mt-2">
                        <motion.div
                            className="h-full bg-gradient-to-r from-primary-400 to-blue-400 rounded-full shadow-[0_0_15px_rgba(56,149,231,0.8)]"
                            initial={{ width: "5%" }}
                            animate={{ width: `${Math.max(5, progress)}%` }}
                            transition={{ ease: "easeOut", duration: 0.3 }}
                        />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={`glass-panel border-2 border-dashed rounded-[2rem] p-16 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer h-[400px] group relative overflow-hidden
        ${isDragActive ? 'border-primary-400 bg-primary-900/30 shadow-[0_0_40px_rgba(56,149,231,0.3)]' : 'border-white/20 hover:border-primary-500/80 hover:bg-slate-800/60 hover:shadow-premium'}`}
        >
            <input {...getInputProps()} />

            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-center">
                <div className={`w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mb-6 transition-all duration-300 ring-1 ${isDragActive ? 'bg-primary-600 text-white scale-110 ring-primary-400/50' : 'bg-slate-900/80 ring-white/10 text-primary-400 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-slate-800'}`}>
                    {isDragActive ? <File className="w-10 h-10 animate-pulse" /> : <Upload className="w-10 h-10" />}
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-white mb-3 drop-shadow-sm">
                    {isDragActive ? 'Release to upload document' : 'Select or drag a file to analyze'}
                </h3>

                <p className="text-slate-400 font-medium max-w-md">
                    Accepted formats: <span className="text-slate-200 font-semibold px-1">.pdf</span>, <span className="text-slate-200 font-semibold px-1">.docx</span>, <span className="text-slate-200 font-semibold px-1">.txt</span> (Max 10MB). <br className="hidden sm:block" />
                    We'll instantly parse the tasks and build the queries.
                </p>

                <div className="mt-8 relative z-20">
                    <span className="px-6 py-3 bg-slate-900/60 backdrop-blur rounded-xl text-sm font-semibold text-slate-300 shadow-sm border border-white/10 group-hover:bg-primary-900/50 group-hover:text-primary-200 group-hover:border-primary-500/50 transition-colors pointer-events-none">
                        Browse Files
                    </span>
                </div>
            </div>
        </div>
    );
}
