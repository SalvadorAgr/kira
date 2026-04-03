import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ModelOrchestrator } from './components/ModelOrchestrator';
import { ApprovalPanel } from './components/ApprovalPanel';
import { ChatProvider } from './context/ChatContext';
import { Brain, Shield, MessageSquare, Settings } from 'lucide-react';

type ActiveView = 'chat' | 'orchestrator' | 'approvals' | 'settings';

function EnhancedApp() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatInterface />;
      case 'orchestrator':
        return <ModelOrchestrator />;
      case 'approvals':
        return <ApprovalPanel />;
      case 'settings':
        return (
          <div className="p-8 text-neutral-300 flex items-center justify-center h-full">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
              <h3 className="text-xl font-medium mb-2">Configuración</h3>
              <p className="text-neutral-500">Próximamente disponible</p>
            </div>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  const navItems = [
    { id: 'chat' as ActiveView, icon: MessageSquare, label: 'Chat' },
    { id: 'orchestrator' as ActiveView, icon: Brain, label: 'Modelos' },
    { id: 'approvals' as ActiveView, icon: Shield, label: 'Aprobaciones' },
    { id: 'settings' as ActiveView, icon: Settings, label: 'Config' },
  ];

  return (
    <ChatProvider>
      <div className="h-screen w-screen bg-transparent flex overflow-hidden p-2">
        <div className="flex-1 flex glass-panel overflow-hidden rounded-2xl shadow-2xl">
          {/* Top Drag Region */}
          <div className="absolute top-0 left-0 w-full h-8 z-50 flex items-center justify-center app-drag-region cursor-move hover:bg-white/[0.02] transition-colors rounded-t-2xl">
            <div className="w-12 h-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"></div>
          </div>
          
          {/* Enhanced Navigation */}
          <div className="w-20 glass-subtle border-r border-white/[0.08] flex flex-col items-center py-10 mt-8">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
                      isActive
                        ? 'bg-accent-500/20 text-accent-400 shadow-glow border border-accent-400/30'
                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08]'
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    {isActive && (
                      <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-accent-400 rounded-full shadow-glow"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex">
            {activeView === 'chat' && <Sidebar />}
            <div className="flex-1 animate-fade-in">
              {renderActiveView()}
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}

export default EnhancedApp;
