import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <ChatProvider>
      <div className="h-screen w-screen bg-transparent flex overflow-hidden">
        {/* HUD Window Container - Full Size */}
        <div className="flex-1 flex glass-panel overflow-hidden rounded-xl border border-white/10 shadow-2xl">
           {/* Top Drag Region */}
          <div className="absolute top-0 left-0 w-full h-6 z-50 flex items-center justify-center app-drag-region cursor-move hover:bg-white/5 transition-colors">
              <div className="w-16 h-1 bg-white/20 rounded-full"></div>
          </div>
          
          <Sidebar />
          <ChatInterface />
        </div>
      </div>
    </ChatProvider>
  );
}

export default App;
