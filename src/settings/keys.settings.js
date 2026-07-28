const APP_NAME = 'moka';

const OOH_TYPES = [
  'UNIPOLE_BILLBOARD',
  'HAND_PAINTED_MURAL',
  'BARRICADE',
  'BUILDING_WRAP'
];

const PROFILES = {
  ROLES: {
    OWNER: 'owner',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    ADVERTISER: 'advertiser',
    PRODUCER: 'producer'
  }
};

const SUPABASE = {
  STORAGE: {
    PLACEMENTS_STORAGE: 'placements_images'
  }
};

const STORAGE = {
  LANGUAGE: `${APP_NAME}_language`,
  SIDEBAR: `${APP_NAME}-sidebar-expanded`,
  THEME: `${APP_NAME}-theme`,
  DASH_MAP: `${APP_NAME}-dash-map`
};

const COL_SPAN = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4'
};

export {
  APP_NAME,
  COL_SPAN,
  OOH_TYPES,
  PROFILES,
  SUPABASE,
  STORAGE
};