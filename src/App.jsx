import { Toast } from '@heroui/react';
import SideBar from './components/ui/SideBar.ui';
import Header from './components/ui/header';
import { HomePage } from './components/views/home';
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
