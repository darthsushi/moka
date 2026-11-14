import { useState } from 'react';

import { isNil } from '@/helpers/ramda.helpers';
import { Animations } from '@/components/animations';

import StructureAndLocation from './elements/StructureAndLocation';
import FacesDetails from './elements/FacesDetails';
import PlacementDetails from './elements/PlacementDetails';

function PlacementManagerForm({ isEditing = false, placement = {}, onSubmitPlacement, isSaving = false }) {
  const [currentPlacement, setCurrentPlacement] = useState(() => isEditing ? { ...placement } : {});
  const [currentStep, setCurrentStep] = useState(1);
  
  const nextStep = async (actualStepValues, isLastStep = false) => {
      if (isSaving) return;
    
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
        await onSubmitPlacement?.({ ...currentPlacement, ...actualStepValues });
  
         return;
      }
  
      setCurrentStep((actualStep) => actualStep + 1);
    };
  
    const previousStep = () => {
      if (isSaving || currentStep === 1) return;
  
      setCurrentStep(currentStep - 1);
    };

  return (
    <>
      <Animations.VisibilityTransition visibility={ currentStep === 1 }>
        <StructureAndLocation
          placement={ currentPlacement }
          nextStep={ nextStep }
          isEditing={ isEditing }
        />
      </Animations.VisibilityTransition>
      <Animations.VisibilityTransition visibility={ currentStep === 2 }>
        <FacesDetails
          placement={ currentPlacement }
          nextStep={ nextStep }
          previousStep={ previousStep }
        />
      </Animations.VisibilityTransition>
      <Animations.VisibilityTransition visibility={ currentStep === 3 }>
        <PlacementDetails
          placement={ currentPlacement }
          nextStep={ nextStep }
          previousStep={ previousStep }
          isPending={ isSaving }
        />
      </Animations.VisibilityTransition>
    </>
  );
};

export default PlacementManagerForm;
