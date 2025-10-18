import React from "react";
import { useAppStore } from "../store/appStore";
import FormWizard from "../components/forms/FormWizard";
import ProjectSetupForm from "../components/forms/ProjectSetupForm";
import StrataDefinitionForm from "../components/forms/StrataDefinitionForm";
import BoreholesConfigurationForm from "../components/forms/BoreholesConfigurationForm";
import SPTIntervalsForm from "../components/forms/SPTIntervalsForm";
import FinalReport from "../components/FinalReport";

const SPTCalculator: React.FC = () => {
  const project = useAppStore((state) => state.project);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);

  const steps = [
    {
      id: "project-setup",
      title: "Configuración del Proyecto",
      component: <ProjectSetupForm />,
    },
    {
      id: "strata-definition",
      title: "Configuración de Estratos",
      component: <StrataDefinitionForm />,
    },
    {
      id: "boreholes-config",
      title: "Perforaciones",
      component: <BoreholesConfigurationForm />,
    },
    {
      id: "spt-intervals",
      title: "Ensayos SPT",
      component: <SPTIntervalsForm />,
    },
    {
      id: "results",
      title: "Resultados",
      component: <FinalReport />,
    },
  ];

  const handleComplete = () => {
    console.log("Wizard completed!");
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="spt-calculator">
      <FormWizard
        steps={steps}
        onComplete={handleComplete}
        onStepChange={handleStepChange}
      />

      {import.meta.env.DEV && (
        <div
          className="debug-panel"
          style={{
            position: "fixed",
            bottom: 10,
            right: 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            maxWidth: "300px",
          }}
        >
          <div>Project ID: {project?.id || "N/A"}</div>
          <div>Name: {project?.project_name || "N/A"}</div>
        </div>
      )}
    </div>
  );
};

export default SPTCalculator;
