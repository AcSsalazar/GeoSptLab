import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
//import { Button } from '@/components/ui';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isValid?: boolean;
}

interface FormWizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
}

const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      console.log("Boton Pulsado")
    } else {
      onComplete();
    }
  };

  // const handlePrevious = () => {
  //   if (currentStep > 0) {
  //     const prevStep = currentStep - 1;
  //     setCurrentStep(prevStep);
  //     onStepChange?.(prevStep);
  //   }
  // };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = index <= currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && goToStep(index)}
                    disabled={!isClickable}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      transition-colors duration-200
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }
                      ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                    `}
                  >
                    {isCompleted ? (
                      <Check size={16} />
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span className={`
                    mt-2 text-xs text-center max-w-20
                    ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 mt-5
                    ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.description}
          </p>
        </div>

        <div className="mb-8">
          {currentStepData.component}
        </div>

        {/* Navigation buttons 
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </Button>

          <div className="text-sm text-gray-500 self-center">
            Step {currentStep + 1} of {steps.length}
          </div>
          */ }

          <button
            onClick={handleNext}
            disabled={currentStepData.isValid === false}
          >

          
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight size={16} className="ml-1" />}
          </button>
        
      </div>
    </div>
  );
};

export default FormWizard;