import React, { useState } from 'react';
import { CircuitBoard, Plus, Folder, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { ModelSwitcher } from './ModelSwitcher';

export const Sidebar = () => {
    const { projects, activeProjectId, setActiveProjectId, fetchProjects } = useChat();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const createProject = async () => {
        const name = prompt("Nombre del proyecto:");
        if (!name) return;
        try {
            const res = await fetch('http://localhost:8000/projects', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                fetchProjects();
            }
        } catch (e) {
            console.error(e);
        }
    };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-80'} h-full glass-subtle border-r border-white/[0.08] flex flex-col transition-all duration-300 ease-out relative`}>
      
      {/* Collapse Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 glass-subtle rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:scale-110 transition-all duration-200 z-50 shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-4' : 'justify-start px-6'} border-b border-white/[0.08] app-drag-region`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <CircuitBoard className="w-8 h-8 text-accent-400 animate-float" />
              <div className="absolute inset-0 w-8 h-8 text-accent-400 animate-pulse opacity-50">
                <CircuitBoard className="w-8 h-8" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-wider text-white">PSYKIRA</span>
                <span className="text-xs text-accent-400 font-mono">v2.0.1</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Projects Section */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className={`flex items-center justify-between mb-4 ${isCollapsed ? 'flex-col gap-3' : ''}`}>
            {!isCollapsed && (
              <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                Proyectos
              </span>
            )}
            <button 
              onClick={createProject} 
              className="btn-ghost w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white group" 
              title="Nuevo Proyecto"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-premium">
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 p-3'} rounded-xl text-sm transition-all duration-200 group ${
                  activeProjectId === p.id 
                    ? 'bg-accent-500/10 text-accent-400 border border-accent-400/20 shadow-glow' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent hover:border-white/[0.08]'
                }`}
                title={p.name}
              >
                <Folder size={16} className={`shrink-0 transition-transform duration-200 ${activeProjectId === p.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                {!isCollapsed && (
                  <span className="truncate font-medium">{p.name}</span>
                )}
                {activeProjectId === p.id && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pb-4">
          <NavItem 
            icon={<Settings size={18} />} 
            label="Configuración" 
            isCollapsed={isCollapsed} 
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.08]">
        <ModelSwitcher isCollapsed={isCollapsed} />
        
        <div className={`p-4 glass-subtle ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 items-end h-4">
              <div className="w-1 bg-emerald-400 h-2 animate-bounce status-online rounded-full"></div>
              <div className="w-1 bg-emerald-400 h-4 animate-bounce delay-75 status-online rounded-full"></div>
              <div className="w-1 bg-emerald-400 h-3 animate-bounce delay-150 status-online rounded-full"></div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-emerald-400 font-mono font-semibold">ONLINE</span>
                <span className="text-xs text-neutral-500">Sistema activo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, isCollapsed }: { icon: React.ReactNode, label: string, active?: boolean, isCollapsed: boolean }) => (
  <button 
    className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-start gap-3 p-3'} rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-white/[0.08] text-white border border-white/[0.12]' 
        : 'text-neutral-400 hover:bg-white/[0.03] hover:text-white border border-transparent hover:border-white/[0.08]'
    }`} 
    title={label}
  >
    <div className="transition-transform duration-200 group-hover:scale-105">
      {icon}
    </div>
    {!isCollapsed && <span className="font-medium">{label}</span>}
  </button>
);
