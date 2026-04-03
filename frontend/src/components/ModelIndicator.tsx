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
        <div className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    isLocal ? 'bg-white/10 text-white/85' : 'bg-white/10 text-white/85'
                }`}>
                    {isLocal && <Cpu size={13} />}
                    {isOllama && <Cloud size={13} />}
                </div>
                <div className="leading-tight">
                    <div className="text-[11px] font-medium text-white">
                        {modelStatus.current_model === 'local' ? 'Modelo local' : 'Modelo Ollama'}
                    </div>
                    <div className="text-[10px] text-white/55">
                        {(isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                            ? 'Activo'
                            : 'Sin conexión'
                        }
                    </div>
                </div>
                <div className={`ml-1 h-2 w-2 rounded-full ${
                    (isLocal && modelStatus.local_available) || (isOllama && modelStatus.ollama_available)
                        ? 'bg-[#29ff4f] shadow-[0_0_10px_rgba(41,255,79,0.65)]'
                        : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.55)]'
                }`} />
            </div>
        </div>
    );
};
