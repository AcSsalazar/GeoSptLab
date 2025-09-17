import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

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
          
          <div className={styles.section}>
            <h4 className={styles.subtitle}>Enlaces útiles</h4>
            <nav className={styles.links}>
              <Link to="/docs" className={styles.link}>Documentación</Link>
              <Link to="/about" className={styles.link}>Acerca de</Link>
              <a 
                href="https://github.com/AcSsalazar/SPT-Parameters-Calculator" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.link}
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
        
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © 2025 ConsulCivil. Desarrollado para ingenieros geotécnicos.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

