// import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo a la izquierda */}
        <div className="header-logo">
          <img 
            src="/consulcivil-logo.svg" 
            alt="ConsulCivil" 
            className="logo-image"
          />
          <span className="logo-text">ConsulCivil</span>
        </div>

        {/* Navegación central */}
        <nav className="header-nav">
          <a href="/about" className="nav-link">
            Acerca de la herramienta
          </a>
          <a href="/docs" className="nav-link">
            Documentación
          </a>
          <a 
            href="https://github.com/tu-usuario/consulcivil-tool" 
            target="_blank" 
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
        </nav>

        {/* Login/Usuario a la derecha - Temporal sin Clerk */}
        <div className="header-auth">
          <button className="login-button">
            Iniciar Sesión
          </button>
          {/* 
          Una vez que instales @clerk/clerk-react, reemplaza lo de arriba con:
          <SignedOut>
            <SignInButton mode="modal">
              <button className="login-button">
                Iniciar Sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
          */}
        </div>
      </div>
    </header>
  )
}

export default Header
