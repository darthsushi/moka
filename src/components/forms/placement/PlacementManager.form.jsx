import { useState } from 'react';

import { isNil } from '@/helpers/ramda.helpers';
import { Animations } from '@/components/animations';

import StructureAndLocation from './elements/StructureAndLocation';
import FacesDetails from './elements/FacesDetails';
import PlacementDetails from './elements/PlacementDetails';

function PlacementManagerForm({ isEditing = false, placement = {}, onCreate, isCreatingPlacement = false }) {
  const [currentPlacement, setCurrentPlacement] = useState(() => isEditing ? { ...placement } : {});
  const [currentStep, setCurrentStep] = useState(1);
  
  const nextStep = async (actualStepValues, isLastStep = false) => {
      if (isCreatingPlacement) return;
    
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
        if (!isEditing) await onCreate?.({ ...currentPlacement, ...actualStepValues });
  
         return;
      }
  
      setCurrentStep((actualStep) => actualStep + 1);
    };
  
    const previousStep = () => {
      if (isCreatingPlacement || currentStep === 1) return;
  
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
          isPending={ isCreatingPlacement }
        />
      </Animations.VisibilityTransition>
    </>
  );
};

export default PlacementManagerForm;
