import React, { useState, useEffect } from 'react';
import { Cpu, Cloud, Check, Loader2 } from 'lucide-react';

interface ModelStatus {
    current_model: string;
    local_available: boolean;
    ollama_available: boolean;
}

interface ModelSwitcherProps {
    isCollapsed: boolean;
}

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ isCollapsed }) => {
    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchModelStatus = async () => {
        try {
            const res = await fetch('http://localhost:8000/model/status');
            if (res.ok) {
                const status = await res.json();
                setModelStatus(status);
            }
        } catch (e) {
            console.error('Error fetching model status:', e);
        }
    };

    const switchModel = async (modelType: 'local' | 'ollama') => {
        setIsLoading(true);
        try {
            const endpoint = modelType === 'local' 
                ? 'http://localhost:8000/model/switch/local'
                : 'http://localhost:8000/model/switch/ollama?model_name=ministral-3:3b';
            
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                await fetchModelStatus();
            }
        } catch (e) {
            console.error('Error switching model:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModelStatus();
        // Refresh status every 30 seconds
        const interval = setInterval(fetchModelStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!modelStatus) return null;

    return (
        <div className={`p-4 border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
            {!isCollapsed && (
                <div className="mb-3">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Modelo IA</span>
                </div>
            )}
            
            <div className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
                {/* Local Model Button */}
                <button
                    onClick={() => switchModel('local')}
                    disabled={!modelStatus.local_available || isLoading}
                    className={`group w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                        modelStatus.current_model === 'local'
                            ? 'bg-gradient-to-r from-primary-500/20 to-primary-600/20 text-primary-300 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                            : modelStatus.local_available
                            ? 'glass-card text-slate-300 hover:text-white hover:shadow-lg hover:shadow-white/5 hover:border-white/20'
                            : 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
                    }`}
                    title={isCollapsed ? 'Modelo Local' : undefined}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                            modelStatus.current_model === 'local' 
                                ? 'bg-primary-500/20' 
                                : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                            <Cpu size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Local</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            {isLoading && modelStatus.current_model === 'local' && (
                                <Loader2 size={16} className="animate-spin text-primary-400" />
                            )}
                            {modelStatus.current_model === 'local' && !isLoading && (
                                <div className="p-1 bg-success-500/20 rounded-full">
                                    <Check size={12} className="text-success-400" />
                                </div>
                            )}
                            {!modelStatus.local_available && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </div>
                    )}
                </button>

                {/* Ollama Model Button */}
                <button
                    onClick={() => switchModel('ollama')}
                    disabled={!modelStatus.ollama_available || isLoading}
                    className={`group w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                        modelStatus.current_model === 'ollama'
                            ? 'bg-gradient-to-r from-accent-500/20 to-accent-600/20 text-accent-300 border border-accent-500/30 shadow-lg shadow-accent-500/10'
                            : modelStatus.ollama_available
                            ? 'glass-card text-slate-300 hover:text-white hover:shadow-lg hover:shadow-white/5 hover:border-white/20'
                            : 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
                    }`}
                    title={isCollapsed ? 'Modelo Ollama' : undefined}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                            modelStatus.current_model === 'ollama' 
                                ? 'bg-accent-500/20' 
                                : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                            <Cloud size={16} />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Ollama</span>}
                    </div>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            {isLoading && modelStatus.current_model === 'ollama' && (
                                <Loader2 size={16} className="animate-spin text-accent-400" />
                            )}
                            {modelStatus.current_model === 'ollama' && !isLoading && (
                                <div className="p-1 bg-success-500/20 rounded-full">
                                    <Check size={12} className="text-success-400" />
                                </div>
                            )}
                            {!modelStatus.ollama_available && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </div>
                    )}
                </button>
            </div>

            {!isCollapsed && (
                <div className="mt-3 p-2 glass-card rounded-lg">
                    <div className="text-xs text-slate-400 text-center">
                        Activo: <span className="text-white font-semibold capitalize ml-1">{modelStatus.current_model}</span>
                    </div>
                </div>
            )}
        </div>
    );
};