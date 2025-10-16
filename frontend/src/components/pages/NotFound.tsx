import notFound from "/404.webp"
import styles from "@/styles/NotFound.module.css"
function NotFound() {
   
    return (
      <div>
        <section className={styles.notFoundContainer}> 
          <h2 className={styles.title}>
            Error 404 - Página no encontrada
          </h2>
        <img className={styles.imageWebp} src={notFound || "/404.webp"} alt="=Error 404" />
          
        </section>
      </div>
    )
  
}

export default NotFound
