import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import FormWizard from '../components/forms/FormWizard';
import ProjectSetupForm from '../components/forms/ProjectSetupForm';
import StrataDefinitionForm from '../components/forms/StrataDefinitionForm';
import BoreholesConfigurationForm from '../components/forms/BoreholesConfigurationForm';
import SPTIntervalsForm from '../components/forms/SPTIntervalsForm';
import FinalReport from '../components/FinalReport';

const SPTCalculator: React.FC = () => {
  const project = useAppStore((state) => state.project);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const resetAll = useAppStore((state) => state.resetAll);

  const handleResetWorkflow = () => {
    if (confirm('¿Estás seguro de que quieres iniciar un nuevo proyecto? Se perderán todos los datos no guardados.')) {
      resetAll();
      setCurrentStep(0);
    }
  };

  const steps = [
    {
      id: 'project-setup',
      title: 'Configuración del Proyecto',
      component: <ProjectSetupForm />,
    },
    {
      id: 'strata-definition',
      title: 'Configuración de Estratos',
      component: <StrataDefinitionForm />,
    },
    {
      id: 'boreholes-config',
      title: 'Perforaciones',
      component: <BoreholesConfigurationForm />,
    },
    {
      id: 'spt-intervals',
      title: 'Ensayos SPT',
      component: <SPTIntervalsForm />,
    },
    {
      id: 'results',
      title: 'Resultados',
      component: <FinalReport />,
    }
  ];

  const handleComplete = () => {
    console.log('Wizard completed!');
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="spt-calculator">
      {/* Reset Button - Only show if project exists */}
      {project && (
        <div style={{ 
          position: 'fixed', 
          top: 20, 
          right: 20, 
          zIndex: 1000 
        }}>
          <button
            onClick={handleResetWorkflow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            }}
          >
            <RefreshCw size={16} />
            Nuevo Proyecto
          </button>
        </div>
      )}
      
      <FormWizard 
        steps={steps} 
        onComplete={handleComplete}
        onStepChange={handleStepChange}
      />
      
      {import.meta.env.DEV && (
        <div className="debug-panel" style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '300px'
        }}>
          <div>Project ID: {project?.id || 'N/A'}</div>
          <div>Name: {project?.project_name || 'N/A'}</div>
        </div>
      )}
    </div>
  );
};

export default SPTCalculator;
