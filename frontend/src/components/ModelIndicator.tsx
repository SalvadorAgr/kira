import React, { useState, useEffect } from 'react';
import { Cpu, Cloud } from 'lucide-react';

interface ModelStatus {
    current_model: string;
    local_available: boolean;
    ollama_available: boolean;
}

export const ModelIndicator: React.FC = () => {
    const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

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

    useEffect(() => {
        fetchModelStatus();
        // Refresh status every 10 seconds
        const interval = setInterval(fetchModelStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!modelStatus) return null;

    const isLocal = modelStatus.current_model === 'local';
    const isOllama = modelStatus.current_model === 'ollama';

    return (
        <div className="flex items-center justify-between px-4 py-3 glass-card border-b border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                    isLocal ? 'bg-primary-500/20' : 'bg-accent-500/20'
                }`}>
                    {isLocal && <Cpu size={18} className="text-primary-400" />}
                    {isOllama && <Cloud size={18} className="text-accent-400" />}
                </div>
                <div>
                    <div className="text-sm text-white font-semibold">
                        Modelo {modelStatus.current_model === 'local' ? 'Local' : 'Ollama'}
                    </div>
                    <div className="text-xs text-slate-400">
                        {(isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                            ? 'Conectado y activo'
                            : 'Error de conexión'
                        }
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    (isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                        ? 'bg-success-400 shadow-lg shadow-success-400/50 animate-pulse'
                        : 'bg-red-400 shadow-lg shadow-red-400/50'
                }`} />
                <span className={`text-xs font-medium ${
                    (isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                        ? 'text-success-400'
                        : 'text-red-400'
                }`}>
                    {(isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                        ? 'Activo'
                        : 'Error'
                    }
                </span>
            </div>
        </div>
    );
};