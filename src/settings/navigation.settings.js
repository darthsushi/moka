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
    roles: [PROFILES.ROLES.OWNER, PROFILES.ROLES.ADMIN, PROFILES.ROLES.MODERATOR]
  },
  SETTINGS: {
    id: 'settings',
    path: '/settings',
    label: 'SETTINGS',
    icon: 'settings',
  }
};

const NAVIGATION_ITEMS = Object.values(MODULES);

export {
  MODULES,
  NAVIGATION_ITEMS
};
