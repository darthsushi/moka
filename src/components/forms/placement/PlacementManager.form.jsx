import { useState } from 'react';

import { isNil } from '@/helpers/ramda.helpers';

import { Animations } from '@/components/animations';

import StructureAndLocation from './elements/StructureAndLocation';

function PlacementManagerForm({ isEditing = false, placement = {} }) {
  const [currentPlacement, setCurrentPlacement] = useState(() => isEditing ? { ...placement } : {});
  const [currentStep, setCurrentStep] = useState(1);
  const [isPending, setIsPending] = useState(false); //Cambiar a "allowChangeStep"?

  const nextStep = (actualStepValues, isLastStep) => {
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
  
      if (isLastStep === true) {
         console.log('Fin del formulario', {
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

  return (
    <>
      <Animations.VisibilityTransition visibility={ currentStep === 1 }>
        <StructureAndLocation />
      </Animations.VisibilityTransition>
    </>
  );
};

export default PlacementManagerForm;
