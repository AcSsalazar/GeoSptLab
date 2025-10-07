import styles from "@/styles/Home.module.css";
import img from "/background01.png";
function Home() {
  return (
    <>
      <main style={{ marginTop: "70px", padding: "2rem" }}>
        <div className={styles.titlesSection}>
          <h1>
            SPT Analysis Tool
          </h1>
          <p>
            Herramienta profesional para análisis de ensayos de penetración
            estándar (SPT) en proyectos de consultoría civil.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          <div className={`${styles.bgCards} ${styles.card1}`}>
            <img src={img} alt="Fondo" />
            <h3>Análisis SPT</h3>
            <p>
              Procesa y analiza datos de ensayos de penetración estándar con
              precisión profesional.
            </p>
          </div>

          <div className={`${styles.bgCards} ${styles.card2} ${styles.borderFancy2}`}>
            <img src={img} alt="Fondo" />
            <h3>Reportes Automáticos</h3>
            <p>
              Genera reportes técnicos detallados siguiendo estándares de la
              industria.
            </p>
          </div>

          <div className={`${styles.bgCards} ${styles.card3} ${styles.borderFancy3}`}>
            <img src={img} alt="Fondo" />
            <h3>Visualización</h3>
            <p>
              Gráficos y visualizaciones interactivas para mejor comprensión de
              los datos.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;
