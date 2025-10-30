import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, SignInButton, SignOutButton, useUser } from '@clerk/clerk-react';
/* import logoImg from '@/assets/images/logoconsul.png'; */
import styles from '@/styles/ui/Header.module.css';
const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo Section */}
{/*         <Link to="/" className={styles.brand}>
          <img className={styles.logoImage} src={logoImg} alt="ConsulCivil Logo" />
        </Link> */}

        {/* Navigation */}
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            Inicio
          </Link>
          <Link to="/manual" className={styles.navLink}>
            Manual de Uso
          </Link>
          <Link to="/devdocs" className={styles.navLink}>
            Devopers Docs
          </Link>
          <Link to="/theory" className={styles.navLink}>
            Fundamentos Teóricos
          </Link>
          <Link to="/calculator" className={styles.navLink}>
            Calculador
          </Link>

          <a 
            href="https://github.com/AcSsalazar/SPT-Parameters-Calculator" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.navLink}
          >
            Repositorio
          </a>
        </nav>

        {/* Auth Section */}
        <div className={styles.authSection}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={styles.loginButton}>
                Iniciar Sesión
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            {user?.firstName && (
              <span className={styles.userGreeting}>
                Hola, {user.firstName}
              </span>
            )}
            
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
            
            <SignOutButton>
              <button className={styles.logoutButton}>
                Cerrar sesión
              </button>
            </SignOutButton>
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Header;