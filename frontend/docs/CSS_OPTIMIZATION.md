# CSS Optimization Guide

## Herramientas para detectar CSS no utilizado:

### 1. Chrome DevTools Coverage (Manual)
- F12 → Ctrl+Shift+P → "Show Coverage"
- Mejores para análisis en runtime

### 2. PurgeCSS (Automatizado - Producción)
```bash
pnpm add -D @fullhuman/postcss-purgecss
```

### 3. VS Code Extensions
- "Better Unused CSS" - Marca CSS no utilizado
- "CSS Peek" - Ver dónde se usa cada clase

### 4. Vite Bundle Analyzer
```bash
pnpm add -D rollup-plugin-visualizer
```

## Scripts útiles:

### Analizar tamaño del bundle:
```bash
pnpm build
```

### Ver CSS modules utilizados:
```bash
grep -r "styles\." src/components/ | sort -u
```

## Mejores prácticas:
- ✅ Usa CSS Modules (ya lo haces)
- ✅ Elimina imports no utilizados
- ✅ Usa design tokens (ya lo haces)
- ✅ Minimiza duplicación
- ⚠️ Cuidado con CSS global
