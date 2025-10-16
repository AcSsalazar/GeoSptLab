import React from 'react';
import { Link } from 'react-router-dom';
import styles from '@/styles/Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.title}>SPT Calculator</h3>
            <p className={styles.description}>
              Herramienta profesional para análisis de ensayos SPT y cálculo de parámetros geotécnicos.
            </p>
          </div>

        </div>
        
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © 2025 by AcSalazar. Desarrollado según las características de los suelos en Colombia. 
            Consulte la version completa en <Link to="/changelog" >Changelogs & versions</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

