import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';

interface AudioRecorderProps {
    onAudioRecorded: (blob: Blob) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onAudioRecorded(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("No se pudo acceder al micrófono.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`group relative p-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                isRecording 
                ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20 animate-pulse' 
                : 'glass-card text-slate-400 hover:text-white hover:shadow-lg hover:shadow-white/5 hover:border-white/20'
            }`}
            title={isRecording ? "Detener grabación" : "Grabar audio"}
        >
            <div className={`transition-transform duration-300 ${isRecording ? 'scale-110' : 'group-hover:scale-105'}`}>
                {isRecording ? (
                    <Square size={20} fill="currentColor" className="drop-shadow-lg" />
                ) : (
                    <Mic size={20} className="drop-shadow-lg" />
                )}
            </div>
            
            {/* Recording indicator */}
            {isRecording && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
        </button>
    );
};
