/**
 * Multi-step form wizard for SPT project creation
 */
import React, { useState } from 'react';
import { WizardStep, WizardData } from '../../types/calculations';
import ProjectSetupForm from './ProjectSetupForm';
import StrataForm from './StrataForm';
import BoreholeForm from './BoreholeForm';
import { projectApi } from '../../services/api';
import './forms.css';

interface FormWizardProps {
  onComplete: (projectId: number) => void;
  onCancel?: () => void;
}

const FormWizard: React.FC<FormWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('project');
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const steps: { key: WizardStep; title: string; description: string }[] = [
    { key: 'project', title: 'Configuración del Proyecto', description: 'Datos generales del proyecto SPT' },
    { key: 'strata', title: 'Estratos de Suelo', description: 'Definir capas de suelo' },
    { key: 'boreholes', title: 'Perforaciones', description: 'Configurar perforaciones y datos SPT' },
    { key: 'results', title: 'Resultados', description: 'Revisar y procesar datos' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const currentStepInfo = steps[currentStepIndex];

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  };

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const handleSubmitProject = async () => {
    if (!wizardData.project) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create project
      const project = await projectApi.create(wizardData.project);
      
      // Create strata if any
      if (wizardData.strata && wizardData.strata.length > 0) {
        // Note: We'll need stratum API endpoints on backend
        console.log('Creating strata:', wizardData.strata);
      }
      
      // Create boreholes if any  
      if (wizardData.boreholes && wizardData.boreholes.length > 0) {
        console.log('Creating boreholes:', wizardData.boreholes);
      }
      
      onComplete(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'project':
        return (
          <ProjectSetupForm
            initialData={wizardData.project}
            onSubmit={(projectData) => {
              updateWizardData({ project: projectData });
              goToNextStep();
            }}
            onCancel={onCancel}
          />
        );
      
      case 'strata':
        return (
          <StrataForm
            projectData={wizardData.project}
            initialData={wizardData.strata || []}
            onSubmit={(strataData) => {
              updateWizardData({ strata: strataData });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        );
      
      case 'boreholes':
        return (
          <BoreholeForm
            projectData={wizardData.project}
            strataData={wizardData.strata || []}
            initialData={wizardData.boreholes || []}
            onSubmit={(boreholeData, intervals) => {
              updateWizardData({ 
                boreholes: boreholeData,
                sptIntervals: intervals 
              });
              goToNextStep();
            }}
            onBack={goToPreviousStep}
          />
        );
      
      case 'results':
        return (
          <div className="wizard-results">
            <h3>Resumen del Proyecto</h3>
            
            <div className="project-summary">
              <h4>Proyecto: {wizardData.project?.project_code}</h4>
              <p>Formulación: {wizardData.project?.formulation?.toUpperCase()}</p>
              <p>Estratos: {wizardData.strata?.length || 0}</p>
              <p>Perforaciones: {wizardData.boreholes?.length || 0}</p>
              <p>Intervalos SPT: {wizardData.sptIntervals?.length || 0}</p>
            </div>

            {error && (
              <div className="error-message">
                Error: {error}
              </div>
            )}

            <div className="wizard-actions">
              <button 
                type="button" 
                onClick={goToPreviousStep}
                disabled={loading}
                className="btn-secondary"
              >
                Anterior
              </button>
              <button 
                type="button" 
                onClick={handleSubmitProject}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creando...' : 'Crear Proyecto'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="form-wizard">
      {/* Progress indicator */}
      <div className="wizard-progress">
        <div className="steps-container">
          {steps.map((step, index) => (
            <div 
              key={step.key}
              className={`step ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <div className="wizard-content">
        <div className="step-header">
          <h2>{currentStepInfo.title}</h2>
          <p>{currentStepInfo.description}</p>
        </div>
        
        <div className="step-form">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default FormWizard;