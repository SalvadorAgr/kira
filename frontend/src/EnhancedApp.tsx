import { FigmaInputBar } from './components/FigmaInputBar';

function EnhancedApp() {
  return (
    <div className="relative h-screen w-screen bg-transparent">
      <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2">
        <FigmaInputBar />
      </div>
    </div>
  );
}

export default EnhancedApp;
