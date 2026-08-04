import { Outlet } from 'react-router-dom';
import { Header, SideBar } from '@/components/ui';

function AppLayout() {
  return (
    <main className="w-full min-h-full absolute flex">
      <SideBar />
      <div className="w-full h-screen overflow-y-auto">
        <Header />
        <Outlet />
      </div>
    </main>
  );
}

export default AppLayout;