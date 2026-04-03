import { KiraSidebar } from './components/KiraSidebar';
import { KiraChat } from './components/KiraChat';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <ChatProvider>
      <div className="w-[650px] h-[650px] bg-transparent flex overflow-hidden select-none"
           style={{ borderRadius: '26.444px' }}>
        <KiraSidebar />
        <KiraChat />
      </div>
    </ChatProvider>
  );
}

export default App;
