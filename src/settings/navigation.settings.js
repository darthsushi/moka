import { PROFILES } from './keys.settings';

const MODULES = {
  HOME: {
    id: 'home',
    path: '/',
    label: 'HOME',
    icon: 'home'
  },
  INVENTORY: {
    id: 'inventory',
    path: '/inventory',
    label: 'INVENTORY',
    icon: 'inventory',
    requiresAuth: true,
    roles: [PROFILES.ROLES.OWNER]
  }
};

const NAVIGATION_ITEMS = Object.values(MODULES);

export {
  MODULES,
  NAVIGATION_ITEMS
};
