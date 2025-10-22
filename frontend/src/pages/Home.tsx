import styles from "@/styles/pages/Home.module.css"
import img from "/background01.webp"
import { Link } from "react-router-dom"

function Home() {
  return (
    <>
      <main className={styles.mainContainer}>
        {/* Elementos decorativos de fondo */}
        <div className={styles.bgDecoration1}></div>
        <div className={styles.bgDecoration2}></div>

        <div className={styles.contentWrapper}>
          <div className={styles.titlesSection}>
            <div className={styles.badge}>
              <Link to="/calculator">Comenzar Ahora</Link>
            </div>
            <h3 className={styles.mainTitle}>
              <span className={styles.titleGradient}>GeoSptLab 0.1.1</span>
            </h3>
            <p className={styles.subtitle}>
              Herramienta profesional para análisis de ensayos de penetración estándar (SPT) en proyectos de consultoría
              geotécnica y de ingeniería civil.
            </p>
          </div>

          <div className={styles.cardsGrid}>
            <div className={`${styles.bgCards} ${styles.card1}`}>
              <img src={img || "/placeholder.svg"} alt="Fondo" />
              <h3>Calculador de Parámetros</h3>
              <p>Procesa y analiza datos de ensayos de penetración estándar con precisión profesional mediante un proceso modular y facil de usar.</p>
            </div>

            <div className={`${styles.bgCards} ${styles.card2} ${styles.borderFancy2}`}>
              <img src={img || "/placeholder.svg"} alt="Fondo" />
              <h3>Reportes Automáticos</h3>
              <p>Esta aplicación genera, guarda, y descarga reportes técnicos detallados siguiendo estándares de la industria.</p>
            </div>

            <div className={`${styles.bgCards} ${styles.card3} ${styles.borderFancy3}`}>
              <img src={img || "/placeholder.svg"} alt="Fondo" />
              <h3>Visualización</h3>
              <p>Gráficos y visualizaciones precisas e interactivas para mejor comprensión y manejo de los parámetros.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Home