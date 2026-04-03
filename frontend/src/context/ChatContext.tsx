import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
    id: number;
    name: string;
}

interface ChatContextType {
    projects: Project[];
    activeProjectId: number;
    setActiveProjectId: (id: number) => void;
    fetchProjects: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState(1);

    const fetchProjects = async () => {
        try {
            const res = await fetch('http://localhost:8000/projects');
            if (res.ok) setProjects(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <ChatContext.Provider value={{ projects, activeProjectId, setActiveProjectId, fetchProjects }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
