import styles from "@/styles/Home.module.css";
import img1 from "/background01.png";
import img2 from "/background02.png";
import img3 from "/background03.png";
function Home() {
  return (
    <>
      <main style={{ marginTop: "70px", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "var(--color-strong)", marginBottom: "1rem" }}>
            SPT Analysis Tool
          </h1>
          <p
            style={{
              color: "var(--main-text-color)",
              fontSize: "1.1rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Herramienta profesional para análisis de ensayos de penetración
            estándar (SPT) en proyectos de consultoría civil.
          </p>
        </div>

        <div
          style={{
            marginTop: "3rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2.4rem",
            maxWidth: "1000px",
            margin: "3rem auto 0",
           
          }}
        >
          <div className={styles.bgCards}>
            <img
              src={img1}
              alt="Fondo"
              style={{ top: "-178%", left: "-146%" }}
            />
            <h3 style={{ color: "var(--color-strong)", marginBottom: "1rem" }}>
              Análisis SPT
            </h3>
            <p style={{ color: "var(--main-text-color)" }}>
              Procesa y analiza datos de ensayos de penetración estándar con
              precisión profesional.
            </p>
          </div>

          <div className={styles.bgCards}>
            <img
              src={img2}
              alt="Fondo"
              style={{ top: "-200%", left: "-110%" }}
            />
            <h3 style={{ color: "var(--color-strong)", marginBottom: "1rem" }}>
              Reportes Automáticos
            </h3>
            <p style={{ color: "var(--main-text-color)" }}>
              Genera reportes técnicos detallados siguiendo estándares de la
              industria.
            </p>
          </div>

          <div className={styles.bgCards}>
            <img
              src={img3}
              alt="Fondo"
              style={{ top: "-160%", left: "-160%" }}
            />
            <h3 style={{ color: "var(--color-strong)", marginBottom: "1rem" }}>
              Visualización
            </h3>
            <p style={{ color: "var(--main-text-color)" }}>
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
