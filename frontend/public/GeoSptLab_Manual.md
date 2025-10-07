# Documentación GeoSptLab - 0.1.0 (beta)

Por: AcSalazar  
20/10/2025

## Abstract

GeoSptLab es una aplicación web para el análisis de ensayos SPT (Standard Penetration Test) y la estimación de parámetros geotécnicos del suelo mediante correlaciones empíricas. La herramienta permite ingresar datos de campo, aplicar correcciones y normalizaciones, y obtener parámetros como φ′, c′, Su y E, así como gráficos y tablas resumen.


### 1. Configuración del proyecto
- ID del proyecto: Generado automáticamente y su formato es tipo: XX-1111.Este ID es el que le permitira al usuario buscar el proyecto en el futuro (Función disponible solo para usuarios registrados).
- Número de perforaciones: Aquí debe ingresar el número de perforaciones totales del ensayo.
- Número de estratos: Aquí debe ingresar el numero de estratos totales del ensayo (máximo 6 en la versión beta).
- Tipo de formulación: Selección entre Kishida y JRB.

### 2. Definiciones de estratos
Por cada estrato, el usuario debe ingresar:
- Código del estrato: Identificador único para cada estrato (e.g., 1, 2, 3, etc.).
- Nombre del estrato: Descripción del material (e.g., Arena fina, Arcilla limosa, etc.).
- Peso unitario húmedo γh (kN/m³): Peso del suelo en condiciones no saturadas.
- Peso unitario saturado γsat (kN/m³): Peso del suelo en condiciones saturadas.
- Comportamiento: Selección entre Drenado y No drenado (para futuras versiones).


### 3. Datos por perforación
Por cada perforación, el usuario debe ingresar:

- Nombre de la perforación: Identificador único para cada perforación (e.g., P1, P2, etc.).
- Profundidad inicial (m): Profundidad de inicio del tramo.
- Profundidad final (m): Profundidad total de la perforación.
- Energía en campo (%): Porcentaje de energía del martillo respecto al estándar (45%, 55%, 60%, 145%).
- Ø sondeo (mm): Diámetro de la perforación (60–120, 150, 200 mm).
- NF (m): Nivel freático, profundidad a la que se encuentra el agua subterránea.
   
---





