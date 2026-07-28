import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import {
  FORMS as FORMS_LANGS,
  SYSTEM as SYSTEM_LANGS
} from '../../../settings/langs.settings';
import { isNil, noop } from '../../../helpers/ramda.helpers';

import { useLanguage } from '../../../hooks/useLanguage';

import StrutctureDataStep from './sections/StructureDataStep';
import CoordinatesStep from './sections/CoordinatesStep';
import StructureSizeStep from './sections/FacesDataStep';
import DescriptionStep from './sections/DescriptionStep';
import { useEffect } from 'react';

function PlacementForm({
  isEditing = false,
  isPending = false,
  placement = {},
  onSubmit = noop,
}) {
  const [currentPlacement, setCurrentPlacement] = useState({ ...placement });
  const [currentStep, setCurrentStep] = useState(isEditing ? 3 : 1);

  const { language } = useLanguage();

  const FORM_LABELS = FORMS_LANGS[language].NEW_PLACEMENT;
  const SYSTEM_LABELS = SYSTEM_LANGS[language];

  const nextStep = (actualStepValues, isComplete) => {
    if (isPending) return;

    setCurrentPlacement((prevPlacement) => {
      if (isNil(actualStepValues)) {
        return prevPlacement;
      }
      
      return {
        ...prevPlacement,
        ...actualStepValues
      }
    });

    if (isComplete === true) {
       onSubmit({
        ...currentPlacement,
        ...actualStepValues
       });

       return;
    }

    setCurrentStep((actualStep) => actualStep + 1);
  };

  const previousStep = () => {
    if (isPending || currentStep === 1) return;

    setCurrentStep(currentStep - 1);
  };

  useEffect(() => {
    console.log('Update: ', currentPlacement);
  }, [currentPlacement])

  return (
    <section
      aria-label="placement-form"
      className="w-full"
    >
      <AnimatePresence>
        { (currentStep === 1) &&
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <StrutctureDataStep
              placement={ currentPlacement }
              formLabels={ FORM_LABELS }
              systemLabels={ SYSTEM_LABELS }
              nextStep={ nextStep }
            />
          </motion.div>
        }
      </AnimatePresence>
      <AnimatePresence>
        { (currentStep === 2) &&
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <CoordinatesStep
              placement={ currentPlacement }
              formLabels={ FORM_LABELS }
              systemLabels={ SYSTEM_LABELS }
              nextStep={ nextStep }
              previousStep={ previousStep }
            />
          </motion.div>
        }
      </AnimatePresence>
      <AnimatePresence>
        { (currentStep === 3) &&
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <StructureSizeStep
              isEditing={ isEditing }
              placement={ currentPlacement }
              formLabels={ FORM_LABELS }
              systemLabels={ SYSTEM_LABELS }
              nextStep={ nextStep }
              previousStep={ previousStep }
            />
          </motion.div>
        }
      </AnimatePresence>
      <AnimatePresence>
        { (currentStep === 4) &&
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DescriptionStep
              isPending={ isPending }
              placement={ currentPlacement }
              formLabels={ FORM_LABELS }
              systemLabels={ SYSTEM_LABELS }
              nextStep={ nextStep }
              previousStep={ previousStep }
            />
          </motion.div>
        }
      </AnimatePresence>
    </section>
  );
};

export default PlacementForm;
