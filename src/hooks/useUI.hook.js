import { useContext } from 'react';
import { UIContext } from '../contexts/UI.context';


export const useUI = () => {
  const context = useContext(UIContext);
  
  if (!context) {
    throw new Error("useUI should to be used inside UIProvider");
  }
  
  return context;
}