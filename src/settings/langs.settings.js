import systemEn from './langs/system.en';
import systemEs from './langs/system.es';

import newPlacementFormEn from './langs/forms/new-placement.en';
import newPlacementFormEs from './langs/forms/new-placement.es';

import inventoryTableEn from './langs/tables/inventory.en';
import inventoryTableEs from './langs/tables/inventory.es';
import placementsTableEn from './langs/tables/placements.en';
import placementsTableEs from './langs/tables/placements.es';

const AVAILABLE_LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' }
];

const SYSTEM = {
  es: systemEs,
  en: systemEn,
};

const FORMS = {
  es: { NEW_PLACEMENT: newPlacementFormEs  },
  en: { NEW_PLACEMENT: newPlacementFormEn  }
};

const TABLE_LANGS = {
  es: { INVENTORY: inventoryTableEs, PLACEMENTS: placementsTableEs },
  en: { INVENTORY: inventoryTableEn, PLACEMENTS: placementsTableEn }
};

export {
  AVAILABLE_LANGUAGES,
  SYSTEM,
  FORMS,
  TABLE_LANGS
};
