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
  },
  REVIEW_HUB: {
    id: 'review-hub',
    path: '/review-hub',
    label: 'REVIEW_HUB',
    icon: 'fact-check',
    requiresAuth: true,
    roles: [PROFILES.ROLES.MODERATOR, PROFILES.ROLES.ADMIN]
  },
  SETTINGS: {
    id: 'settings',
    path: '/settings',
    label: 'SETTINGS',
    icon: 'settings',
  },
  TEST_LAB: {
    id: 'test-lab',
    path: '/test-lab',
    label: 'TEST_LAB',
    icon: 'science',
    requiresAuth: true,
    roles: [PROFILES.ROLES.DEVELOPER, PROFILES.ROLES.ADMIN]
  }
};

const NAVIGATION_ITEMS = Object.values(MODULES);

export {
  MODULES,
  NAVIGATION_ITEMS
};
