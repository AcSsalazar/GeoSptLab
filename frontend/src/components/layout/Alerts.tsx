import common from "@/styles/ui/Common.module.css";
import { OctagonAlert } from "lucide-react";

function Alerts() {
  return (
    <div className={common.placeholderContainer}>
      <OctagonAlert size={48} className={common.placeholderIcon} />
      <h3>No hay proyecto activo</h3>
      <p>Debes crear un proyecto primero.</p>
    </div>
  );
}

export default Alerts;
