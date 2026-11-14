import { Outlet } from 'react-router-dom';
import { SideBar } from '@/components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';
import Notifications from '@/components/ui/sidebar/elements/Notifications';

function AppLayout() {
  const isMobile = useIsMobile();
  return (
    <main className="w-full min-h-full absolute flex">
      <SideBar />
      { isMobile && <div className="fixed bottom-4 right-4 z-50"><Notifications compact /></div> }
      <div className="w-full h-screen overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}

export default AppLayout;
