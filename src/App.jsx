import { Toast } from '@heroui/react';

import { SideBar, Header } from '@/components/ui';
import { HomePage } from '@/components/views';

import './App.css';

function App() {

  return (
    <main className="w-full min-h-full absolute flex">
      <SideBar />
      <div className="w-full h-screen overflow-y-auto">
        <Header />
        <HomePage />
      </div>
      <Toast.Provider />
    </main>
  );
}

export default App;
