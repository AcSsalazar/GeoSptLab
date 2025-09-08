
import './Header.css'
import logoImg from '../../public/logoconsul.png'
import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, SignInButton, SignOutButton, useUser } from '@clerk/clerk-react'
const Header = () => {

const {user} = useUser();
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo a la izquierda */}
        <Link to="/" className="header__brand" >

          <img className="header-logo" src={logoImg} alt="logo" />

        </Link>

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
          <SignedOut>
            <SignInButton mode="modal">
              <button className="login-button">
                Iniciar Sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>

            <span style={{color: 'white', marginRight: '10px'}}>Hola, {user?.firstName }</span>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
             


            />

                            <SignOutButton>
                  <button className="navbar__link" >Cerrar sesión</button>
                </SignOutButton>
          </SignedIn>
       
        </div>
      
    </header>
  )
}

export default Header
