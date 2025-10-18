#!/bin/bash
# Script para encontrar clases CSS potencialmente no utilizadas

echo "🔍 Analizando CSS no utilizado en FormWizard..."
echo ""

# Extraer clases del CSS
echo "Clases definidas en FormWizard.module.css:"
grep -E "^\.[a-zA-Z]" src/styles/FormWizard.module.css | sed 's/[:{].*//' | sort -u

echo ""
echo "---"
echo ""
echo "Buscando uso en FormWizard.tsx:"

# Buscar cada clase en el TSX
for class in $(grep -E "^\.[a-zA-Z]" src/styles/FormWizard.module.css | sed 's/[:{].*//' | sed 's/^\.//' | sort -u); do
  if ! grep -q "styles\.$class" src/components/forms/FormWizard.tsx; then
    echo "⚠️  Clase potencialmente no utilizada: .$class"
  fi
done

echo ""
echo "✅ Análisis completado"
