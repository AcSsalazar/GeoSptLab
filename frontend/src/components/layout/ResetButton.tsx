import { useAppStore } from "@/store/appStore";
import { RefreshCw } from "lucide-react";
import styles from "@/styles/ui/ResetButton.module.css";
const ResetButton: React.FC = () => {
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const resetAll = useAppStore((state) => state.resetAll);
  const project = useAppStore((state) => state.project);
  const handleReset = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres iniciar un nuevo proyecto? Se perderán todos los datos no guardados."
      )
    ) {
      resetAll();
      setCurrentStep(0);
    }
  };

  return (
    <div>
      {/* Reset Button - Only show if project exists */}
      {project && (
        
          <button
            onClick={handleReset}
            className={styles.resetButton}>
            <RefreshCw size={16} />
              Nuevo Proyecto
          </button>
       
      )}
    </div>
  );
};

export default ResetButton;
