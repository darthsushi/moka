import systemEn from './langs/system.en';
import systemEs from './langs/system.es';

import newPlacementFormEn from './langs/forms/new-placement.en';
import newPlacementFormEs from './langs/forms/new-placement.es';

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

export {
  AVAILABLE_LANGUAGES,
  SYSTEM,
  FORMS
};
