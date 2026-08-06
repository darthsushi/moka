import { Outlet } from 'react-router-dom';
import { SideBar } from '@/components/ui';

function AppLayout() {
  return (
    <main className="w-full min-h-full absolute flex">
      <SideBar />
      <div className="w-full h-screen overflow-y-auto">
        <Outlet />
      </div>
    </main>
  );
}

export default AppLayout;