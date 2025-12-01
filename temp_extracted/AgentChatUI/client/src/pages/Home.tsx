import { AppSidebar } from '@/components/AppSidebar';
import { ChatArea } from '@/components/ChatArea';
import { RightPanel } from '@/components/RightPanel';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="h-screen flex overflow-hidden" data-testid="page-home">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <ChatArea />
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
