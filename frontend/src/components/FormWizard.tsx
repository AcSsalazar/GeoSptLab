"use client";

import { useEffect } from "react";
import { ArrowBigRightDash, Check, ArrowBigLeftDash } from "lucide-react";
import styles from "@/styles/FormWizard.module.css";
import ResetButton from "@/components/layout/ResetButton";
import { useAppStore } from "@/store/appStore";

interface WizardStep {
  id: string;
  title: string;
  component: React.ReactNode;
  isValid?: boolean;
  onNext?: () => void; // Optional callback for form to trigger next
}

interface FormWizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  onStepNext?: (stepIndex: number) => Promise<void> | void;
  onStepBack?: (stepIndex: number) => Promise<void> | void;
}

const FormWizard: React.FC<FormWizardProps> = ({
  steps = [],
  onComplete,
  onStepChange,
  onStepNext,
  onStepBack,
}) => {
  // ✅ USAR ZUSTAND STORE en lugar de useState local
  const currentStep = useAppStore((state) => state.currentStep);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);

  // Notificar al padre cuando cambia el step en el store
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  if (!steps || steps.length === 0) {
    return (
      <div className={styles.wizard}>
        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>No Steps Available</h2>
            <p className={styles.contentDescription}>
              Please provide steps to display the wizard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Call onStepNext if provided (for API calls)
      if (onStepNext) {
        try {
          await onStepNext(currentStep);
          // After successful API call, proceed with navigation
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          onStepChange?.(nextStep);
        } catch (error) {
          console.error("Step submission failed:", error);
          // Don't proceed if submission fails
          return;
        }
      } else {
        // Fallback to default navigation
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        onStepChange?.(nextStep);
      }
      // debugLog("Next button clicked")
    } else {
      onComplete();
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) {
      // Call onStepBack if provided (for API calls)
      if (onStepBack) {
        try {
          await onStepBack(currentStep);
          // After successful API call, proceed with navigation
          const previousStep = currentStep - 1;
          setCurrentStep(previousStep);
          onStepChange?.(previousStep);
        } catch (error) {
          console.error("Step back failed:", error);
          // Don't proceed if submission fails
          return;
        }
      } else {
        // Fallback to default navigation
        const previousStep = currentStep - 1;
        setCurrentStep(previousStep);
        onStepChange?.(previousStep);
      }
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  const safeCurrentStep = Math.min(Math.max(0, currentStep), steps.length - 1);
  const currentStepData = steps[safeCurrentStep];
  const isLastStep = safeCurrentStep === steps.length - 1;
  const isFirstStep = safeCurrentStep === 0;

  return (
    <div className={styles.wizard}>
      {/* Progress indicator */}
      <div className={styles.progress}>
        <div className={styles.progressSteps}>
          {steps.map((step, index) => {
            const isActive = index === safeCurrentStep;
            const isCompleted = index < safeCurrentStep;
            const isClickable = index <= safeCurrentStep;

            return (
              <div key={step.id} className={styles.stepWrapper}>
                <div className={styles.stepContent}>
                  <button
                    onClick={() => isClickable && goToStep(index)}
                    disabled={!isClickable}
                    className={`${styles.stepButton} ${
                      isCompleted
                        ? styles.completed
                        : isActive
                        ? styles.active
                        : styles.inactive
                    } ${isClickable ? styles.clickable : ""}`}
                  >
                    {isCompleted ? <Check size={16} /> : index + 1}
                  </button>
                  <span
                    className={`${styles.stepTitle} ${
                      isActive ? styles.active : styles.inactive
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`${styles.progressLine} ${
                      index < safeCurrentStep
                        ? styles.completed
                        : styles.incomplete
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimalist: Just render the component directly */}
      {currentStepData.component}

      {/* Navigation buttons */}

      <div className={styles.navigation}>
        {!isFirstStep && (
          <button
            onClick={handleBack}
            className={styles.backButton}
            aria-label="Atrás"
          >
            <ArrowBigLeftDash
              width={47}
              height={35}
              color="#341c55c9"
              strokeWidth={1}
            />
          </button>
        )}

        <ResetButton />

        <button
          onClick={handleNext}
          disabled={currentStepData.isValid === false}
          className={styles.nextButton}
          aria-label={isLastStep ? "Finalizar" : "Siguiente"}
        >
          {isLastStep ? (
            <Check width={47} height={35} color="#341c55c9" strokeWidth={1.5} />
          ) : (
            <ArrowBigRightDash
              width={47}
              height={35}
              color="#341c55c9"
              strokeWidth={1}
            />
          )}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;
