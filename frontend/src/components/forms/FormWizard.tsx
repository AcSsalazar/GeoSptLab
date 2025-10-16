"use client";

import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import styles from "@/styles/FormWizard.module.css";

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
}

const FormWizard: React.FC<FormWizardProps> = ({
  steps = [],
  onComplete,
  onStepChange,
  onStepNext,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

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

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  const safeCurrentStep = Math.min(Math.max(0, currentStep), steps.length - 1);
  const currentStepData = steps[safeCurrentStep];
  const isLastStep = safeCurrentStep === steps.length - 1;

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
        <button
          onClick={handleNext}
          disabled={currentStepData.isValid === false}
          className={styles.nextButton}
        >
          {isLastStep ? "Complete" : "Next"}
          {!isLastStep && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;
