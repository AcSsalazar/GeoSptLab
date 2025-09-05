# Instrucciones para activar Clerk Authentication

## 1. Instalar dependencias de Clerk

```bash
cd frontend
pnpm add @clerk/clerk-react
```

## 2. Configurar Clerk en el proyecto

### 2.1 Crear cuenta en Clerk
1. Ve a [clerk.com](https://clerk.com)
2. Crea una cuenta y un nuevo proyecto
3. Obtén tus API keys

### 2.2 Configurar variables de entorno
Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
```

### 2.3 Configurar ClerkProvider en main.tsx
```tsx
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

### 2.4 Activar imports en Header.tsx
Descomenta estas líneas en `src/components/Header.tsx`:

```tsx
// Cambiar esto:
// import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

// Por esto:
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
```

Y reemplazar el botón temporal con los componentes de Clerk comentados.

## 3. Resultado
- Header moderno y minimalista ✅
- Logo de ConsulCivil en la izquierda ✅
- Navegación central (Acerca, Documentación, GitHub) ✅
- Botón de login con Clerk ✅
- Esquema de colores de index.css aplicado ✅
- Responsive design ✅
