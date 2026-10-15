import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { isNil, noop } from '@/helpers/ramda.helpers';

import StrutctureDataStep from './elements/StructureDataStep';
import CoordinatesStep from './elements/CoordinatesStep';
import FacesDataStep from './elements/FacesDataStep';
import DescriptionStep from './elements/DescriptionStep';

function PlacementForm({
  isEditing = false,
  isPending = false,
  placement = {},
  onSubmit = noop,
}) {
  const { t } = useTranslation();
  const [currentPlacement, setCurrentPlacement] = useState({ ...placement });
  const [currentStep, setCurrentStep] = useState(isEditing ? 3 : 1);

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
      aria-label={ t('placements:a11y.form') }
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
            <FacesDataStep
              isEditing={ isEditing }
              placement={ currentPlacement }

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
