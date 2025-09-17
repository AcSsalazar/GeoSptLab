# 📁 Nueva Estructura del Frontend

## ✅ Estructura Implementada (Opción B - Balanceada)

```
src/
├── components/
│   ├── layout/                   ✅ Layout components
│   │   ├── Header.tsx
│   │   ├── Header.module.css
│   │   ├── Footer.tsx
│   │   ├── Footer.module.css
│   │   └── index.ts             ✅ Barrel exports
│   ├── forms/                   ✅ Form components
│   │   ├── ProjectSetupForm.tsx
│   │   ├── FormWizard.tsx
│   │   └── index.ts
│   ├── ui/                      ✅ Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── index.ts
│   └── pages/                   ✅ Page-level components
│       ├── SPTCalculator.tsx
│       └── Home.tsx
├── assets/                      ✅ Static assets
│   └── images/
│       ├── logoconsul.png
│       ├── consulcivil-logo.svg
│       └── bg.jpg
├── styles/                      ✅ Design system
│   └── design-system/
│       ├── tokens.css           ✅ Design tokens (8pt grid)
│       ├── foundations.css      ✅ Reset + typography
│       ├── utilities.css        ✅ Minimal utilities
│       └── index.css            ✅ Design system entry point
├── types/                       ✅ TypeScript types
│   └── css-modules.d.ts         ✅ CSS modules declarations
├── services/                    ✅ API & external services
├── hooks/                       ✅ Custom hooks (future)
└── utils/                       ✅ Helper functions (future)
```

## 🎯 Path Mapping Configurado

### Vite (vite.config.ts)
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/components': path.resolve(__dirname, './src/components'),
    '@/assets': path.resolve(__dirname, './src/assets'),
    '@/styles': path.resolve(__dirname, './src/styles'),
    '@/services': path.resolve(__dirname, './src/services'),
    '@/types': path.resolve(__dirname, './src/types'),
    '@/hooks': path.resolve(__dirname, './src/hooks'),
  }
}
```

### TypeScript (tsconfig.app.json)
```json
"paths": {
  "@/*": ["src/*"],
  "@/components/*": ["src/components/*"],
  "@/assets/*": ["src/assets/*"],
  "@/styles/*": ["src/styles/*"],
  "@/services/*": ["src/services/*"],
  "@/types/*": ["src/types/*"],
  "@/hooks/*": ["src/hooks/*"]
}
```

## 🎨 Design System (8pt Grid)

### Variables principales:
- **Espaciado:** `--space-1` (8px), `--space-2` (16px), `--space-3` (24px), etc.
- **Colores:** `--brand-primary`, `--color-text-primary`, `--color-background-primary`
- **Tipografía:** `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, etc.
- **Semántico:** `--spacing-element`, `--spacing-component`, `--spacing-section`

## 📦 Barrel Exports

### Imports limpios:
```typescript
// ❌ Antes
import Header from './shared/components/layout/Header/Header';
import Footer from './shared/components/layout/Footer/Footer';

// ✅ Ahora
import { Header, Footer } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { ProjectSetupForm } from '@/components/forms';
```

## 🔗 Assets con Path Mapping

### Imports de assets:
```typescript
// ❌ Antes
import logoImg from '../../../../public/logoconsul.png';

// ✅ Ahora
import logoImg from '@/assets/images/logoconsul.png';
```

## 🚀 Próximos Pasos

1. **Migrar SPTCalculator** a usar design tokens
2. **Migrar componentes UI** (Button, Input, Select)
3. **Migrar formularios** (ProjectSetupForm, FormWizard)
4. **Crear hooks personalizados** para lógica reutilizable
5. **Implementar services** para API calls

## 📏 Beneficios Implementados

- ✅ **8pt Grid System:** Espaciado consistente y profesional
- ✅ **Path Mapping:** Imports limpios sin `../../../../`
- ✅ **Design Tokens:** Sistema de variables semánticas
- ✅ **CSS Modules:** Estilos scoped automáticamente
- ✅ **Estructura Escalable:** Balanceada entre simplicidad y organización
- ✅ **TypeScript Support:** Tipos para CSS modules y assets
- ✅ **Barrel Exports:** Imports organizados y limpios

## 🎯 Ventajas vs Estructura Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Profundidad** | 5+ niveles | 2-3 niveles |
| **Imports** | `../../../../` | `@/components/` |
| **Espaciado** | Inconsistente | 8pt grid |
| **CSS Conflicts** | Posibles | Imposibles (CSS Modules) |
| **Mantenibilidad** | Difícil | Fácil |
| **Escalabilidad** | Limitada | Preparada |