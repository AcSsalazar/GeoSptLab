# Documentación GeoSptLab - 0.1.0 (beta)

Por: acSalazar  
17/09/2025

## Abstract

Esta aplicación calcula parámetros de resistencia del suelo (φ′, c′, E, Su, τ) utilizados en diseño geotécnico a partir de resultados de SPT (Standard Penetration Test), aplicando correcciones y normalizaciones de energía. Este manual incluye la base teórica en la que se ajustan algunos cálculos de literatura fundamental en geotecnia, con las características de suelo y procedimientos para Colombia. De igual manera, se presenta aquí el flujo de cálculo, variables de entrada/salida, consideraciones de uso y referencias.

### 1. Base teórica

El ensayo SPT (Standard Penetration Test) mide el número de golpes N necesarios para hincar 30 cm un muestreador estándar. El valor N es un indicador indirecto de la resistencia del suelo y, mediante correlaciones empíricas, se puede estimar:

- Ángulo de fricción efectiva (φ′)
- Cohesión efectiva (c′)
- Resistencia no drenada (Su)
- Módulo de elasticidad (E)
- Resistencia cortante (τ)

En la práctica, el N debe corregirse por varios factores (condiciones del ensayo, confinamiento, energía) y normalizarse a una energía de referencia; en nuestro caso, 45% (práctica recomendada en Colombia).

---

### 1.1 Alcance y supuestos

Algunos de los lineamientos para la obtención de los datos a analizar, que se ajustan a la aplicación, están basados en esta base teórica, en la cual deben tenerse en cuenta principalmente:

- Enfoque práctico para arenas, limos y arcillas donde existan correlaciones SPT conocidas.
- Normalización por energía de referencia del 45% (N45) por defecto; se reportan también N55, N60 y N145 cuando aplique.
- Corrección por confinamiento Cn siguiendo Seed–Idriss (Marcuson), con límite Cn ≤ 2.0.
- φ′ estimado por correlaciones empíricas (Kishida y JRB).
- c′ y tanφ′ a partir de regresión lineal de τ vs. σ′ por material/estrato; si c′ < 0, la regresión se fuerza a pasar por el origen.
- Su aplicable a suelos cohesivos de forma aproximada.
- E a partir de correlaciones con N normalizado; su uso es orientativo.

Limitaciones:

- Las correlaciones SPT poseen alta dispersión y dependen del tipo de suelo, estructura y estado tensional. Verificar siempre con criterio geotécnico y, de ser posible, contrastar con ensayos de laboratorio y/o CPTu.
- Evitar extrapolaciones fuera de rangos de validez; documentar supuestos.

---

## 2. Procedimiento general (campo → parámetros)

a) Medir N (golpes/30 cm) en campo con su profundidad y clasificar el suelo.  
b) Asociar profundidad media del tramo (punto medio) a cada lectura de N.  
c) Estimar pesos unitarios γh y γsat (idealmente in situ).  
d) Establecer nivel freático (NF).  
e) Calcular tensiones: totales σ_tot, presión de poros u y efectivas σ′ = σ_tot − u. Considerar saturación y, eventualmente, succión capilar.  
f) Corregir N por energía y condiciones del ensayo (CB, CS, CR) y confinamiento (Cn de Seed–Idriss/Marcuson, con Cn ≤ 2).  
g) Estimar φ′eq mediante correlaciones (Kishida/JRB) con N normalizado.  
h) Calcular τ = σ′ · tan(φ′eq).  
i) Agrupar pares (σ′, τ) por material/estrato.  
j) Ajustar τ = c′ + σ′ · tan(φ′). Si c′ < 0, forzar c′ = 0.  
k) Estimar φ′ mínimo por material como φ′_min ≈ φ′eq_min y trazar c′ vs. tanφ′.

---

## 3. Variables y definiciones

### 3.1 Nspt

- Definición: Número de golpes para hincar 30 cm el muestreador.  
- Unidad: golpes/30 cm (adimensional).  
- Nota: El valor bruto debe corregirse antes de correlacionar.

### 3.2 Factores de corrección

- CE: Corrección por pérdida de energía del martillo (entre 0.45 y 1).  
- CR: Corrección por longitud de varillaje (entre 0.75 y 1).  
- CS: Corrección por revestimiento interno del tomamuestras (entre 0.8 y 1).  
- CB: Corrección por diámetro de la perforación (usar 1.00, 1.05 o 1.15 según el diámetro).  
- Cn: Corrección por confinamiento (Seed–Idriss/Marcuson), con límite Cn ≤ 2. Para nuestro caso, CB, CS, CR = 1.  
- Energía en campo (%): Relación entre energía real del martillo y la estándar.

Corrección del valor de N obtenido en el ensayo de SPT (Skempton):

| FACTOR                 | EQUIPO VARIABLE                                                | TÉRMINO   | CORRECCIÓN                         |
|------------------------|----------------------------------------------------------------|-----------|------------------------------------|
| Relación de energía    | Martillo donut; de seguridad; automático                       | CE = ER/60| 0.5–1.0; 0.7–1.2; 0.8–1.5          |
| Diámetro del sondeo    | 65–115 mm; 150 mm; 200 mm                                      | CB        | 1.00; 1.05; 1.15                   |
| Método de muestreo     | Muestreo estándar; muestreo no estándar                        | CS        | 1.00; 1.1–1.3                      |
| Longitud de varillas   | 3–4 m; 4–6 m; 6–10 m; 10–>30 m                                 | CR        | 0.75; 0.85; 0.95; 1.00             |

### 3.3 Normalización de N

Para comparar ensayos, se normaliza el N a una energía de referencia y se aplican factores instrumentales y de confinamiento. En forma general:

N_ref ≈ N_campo · CB · CS · CR · CE · Cn

donde CE = (E_ref / E_campo), con:

- N45 → E_ref = 45%  
- N55 → E_ref = 55%  
- N60 → E_ref = 60% (estándar internacional)  
- N145 → E_ref = 145% (casos especiales)

Nota: La combinación exacta de factores puede variar según normativa/literatura. Mantener consistencia interna del método adoptado en el proyecto.

### 3.4 Pesos unitarios (γ)

- γh: Peso unitario húmedo (kN/m³).  
- γsat: Peso unitario saturado (kN/m³).  
- γw: Peso unitario del agua ≈ 9.81 kN/m³.

### 3.5 Nivel freático (NF)

- Profundidad del agua subterránea. Es esencial para u y σ′.

### 3.6 Tensiones

- σ_tot = γ · z  
- u = γw · max(0, z − NF)  
- σ′ = σ_tot − u

La tensión efectiva σ′ gobierna la resistencia del suelo.

### 3.7 φ′ — Ángulo de fricción efectiva

Estimado por correlaciones con N normalizado (R):

- JRB: φ′ (°) = 15 + √(9.375 · R)  
- Kishida: φ′ (°) = 15 + √(12.5 · R)

donde R es el N normalizado a la energía de referencia adoptada en el proyecto (por defecto, R = N45).

### 3.8 c′ — Cohesión efectiva

- Intercepto de la regresión lineal τ = c′ + σ′ · tan(φ′).  
- Si la regresión produce c′ < 0, se impone c′ = 0.

### 3.9 τ — Resistencia cortante

- τ ≈ σ′ · tan(φ′eq) por tramo. Se emplea para la regresión τ vs. σ′.

### 3.10 Su — Resistencia no drenada

- Propiedad típica de arcillas; estimable de forma aproximada con Nspt.  
- Uso común: Su ≈ α · Nspt, con α ≈ 3–6 kPa/golpe (orientativo; calibrar localmente).

### 3.11 Módulo de elasticidad (E)

- Estimación empírica a partir de N normalizado:

E ≈ k · N_ref

con k en el orden de 500–1000 kPa/golpe según suelo y literatura.

- Seleccionar k por tipo de suelo y estado (sueltos/densos, plasticidad, cementación).

---

## 4. Flujo de cálculo

1) El primer paso es recibir los datos a través de un formulario base, donde el usuario debe introducir:  
- El número de estratos (máximo 6).  
- Nombres de los estratos.  
- Número de perforaciones.  
- Valores de γh y γsat (para cada estrato).

Una vez completado este formulario, se generan los pasos (steps) a partir del número de perforaciones.

1) En cada paso, que representa una perforación, el usuario deberá completar la siguiente información:  
- NF: Nivel freático (m)  
- Formulación: En la versión beta solo están disponibles Kishida y JRB  
- Diámetro de la perforación (mm)  
- Profundidad inicial y profundidad final  
- Profundidad por estrato (Desde qué profundidad (m))  
- Nspt: El Nspt de campo

Con estos datos ya es posible calcular:

- Las tensiones: σ_tot, u, σ′.  
- Aplicar correcciones CB, CS, CR, Cn.  
- Normalizar N45 (por defecto), N55, N60, N145 (si aplica).  
- φ′eq: por Kishida/JRB con Rs = σ′v / Pa (parámetro de estandarización para un esfuerzo vertical de referencia equivalente).  
- Parámetros derivados: τ, E, Su (si aplica).  
- Agrupar (σ′, τ) por estrato/proyecto.  
- Regresión lineal: τ = c′ + σ′ tan(φ′), forzando c′ ≥ 0 si es necesario.  
- Generar las tablas y gráficos de resistencia (τ–σ′, c′–tanφ′).

---

## 5. I/O de la aplicación web

Con el fin de ofrecer una UX accesible y consistente con la hoja de Excel que se usa de base para la elaboración de esta aplicación, se describen entradas, salidas y notas clave referentes a su tipo o formato en backend y frontend.

### 5.1 Inputs (generales del proyecto)

**Estructura de datos actualizada (v0.2.0):**

La aplicación ahora utiliza una estructura de datos que separa las definiciones de materiales de las profundidades específicas por perforación, permitiendo mayor flexibilidad para modelar proyectos reales donde los mismos estratos aparecen a diferentes profundidades en cada perforación.

**Tabla de configuración del proyecto:**

| Campo | Tipo, etiqueta en frontend |
|-------|-----------------------------|
| Id Proyecto | Generado de manera aleatoria con formato XX-1111, `<p>` |
| Nº de perforaciones | Int, `<input>` |
| Nº de estratos | Int, `<input>` |
| Formulación | String, `<selector>` |

**Definiciones de Estratos (StratumDefinition):**

Los estratos ahora se definen únicamente por sus propiedades de material, sin profundidades específicas:

| Campo | Tipo, etiqueta en frontend | Descripción |
|-------|-----------------------------|-------------|
| Código Estrato | Int, `<input>` | Identificador único del estrato |
| Nombre | String, `<input>` | Nombre descriptivo del estrato |
| Descripción | String, `<input>` | Descripción del material |
| γh (kN/m³) | Float, `<input>` | Peso unitario húmedo |
| γsat (kN/m³) | Float, `<input>` | Peso unitario saturado |
| Comportamiento | String, `<selector>` | Drenado/No drenado |

**Por cada Perforación:**

| Campo | Tipo, etiqueta en frontend |
|-------|-----------------------------|
| Nombre Perforación | String, `<input>` |
| Profundidad Final (m) | Float, `<input>` |
| Energía en campo (%) | Int, `<input>` |
| Ø sondeo (mm) | Int, `<selector>` |
| NF (m) | Float, `<input>` |
| Formulación | String, `<selector>` |

**Estratos por Perforación (BoreholeStratum):**

Cada perforación puede tener los mismos estratos a profundidades diferentes:

| Campo | Tipo, etiqueta en frontend | Descripción |
|-------|-----------------------------|-------------|
| Código Estrato | Int, `<selector>` | Referencia a StratumDefinition |
| Profundidad Inicial (m) | Float, `<input>` | Inicio del estrato en esta perforación |
| Profundidad Final (m) | Float, `<input>` | Final del estrato en esta perforación |

**Ejemplo de Definiciones de Estratos:**

| Código | Estrato | γh (kN/m³) | γsat (kN/m³) | Comportamiento |
|---------|---------|------------|--------------|----------------|
| 1 | Ceniza Volcánica | 18.50 | 19.00 | Drenado |
| 2 | H-VI Migmatita Puente P | 19.50 | 20.00 | Drenado |
| 3 | H-V Migmatita de Puente P | 16.00 | 16.50 | Drenado |

Notas de validación:

- γh, γsat: input numérico, rango recomendado 0–40 kN/m³ (en el Excel se usaba 0–4000 por escala).  
- Comportamiento: selector (Drenado / No drenado). En la versión beta no tiene implicación en los cálculos.

### 5.2 Ejemplo de proyecto con nueva estructura

**Proyecto CP-00633 Casa Las Palmas 02:**

**Estratos por Perforación (diferente profundidades):**

*Perforación P1:*
| Código | Estrato | Desde (m) | Hasta (m) |
|--------|---------|-----------|-----------|
| 1 | Ceniza Volcánica | 1.00 | 2.00 |
| 2 | H-VI Migmatita Puente P | 2.00 | 4.45 |
| 3 | H-V Migmatita de Puente P | 4.45 | 6.45 |

*Perforación P2:*
| Código | Estrato | Desde (m) | Hasta (m) |
|--------|---------|-----------|-----------|
| 1 | Ceniza Volcánica | 1.00 | 1.45 |
| 2 | H-VI Migmatita Puente P | 1.45 | 2.45 |
| 3 | H-V Migmatita de Puente P | 2.45 | 6.45 |

*Perforación P3:*
| Código | Estrato | Desde (m) | Hasta (m) |
|--------|---------|-----------|-----------|
| 2 | H-VI Migmatita Puente P | 1.00 | 4.45 |
| 3 | H-V Migmatita de Puente P | 4.45 | 6.45 |

**Intervalos SPT por perforación:**

*P1:*
| Estrato | Desde (m) | Hasta (m) | Punto medio (m) | Nspt |
|---------|-----------|-----------|------------------|-------|
| 1 | 1.00 | 1.45 | 1.23 | 9 |
| 2 | 3.00 | 3.45 | 3.23 | 4 |
| 2 | 4.00 | 4.45 | 4.23 | 6 |
| 3 | 5.00 | 5.45 | 5.23 | 33 |
| 3 | 6.00 | 6.45 | 6.23 | 77 |

*P2:*
| Estrato | Desde (m) | Hasta (m) | Punto medio (m) | Nspt |
|---------|-----------|-----------|------------------|-------|
| 1 | 1.00 | 1.45 | 1.23 | 11 |
| 2 | 2.00 | 2.45 | 2.23 | 12 |
| 3 | 4.00 | 4.45 | 4.23 | 30 |
| 3 | 6.00 | 6.45 | 6.23 | 41 |

*P3:*
| Estrato | Desde (m) | Hasta (m) | Punto medio (m) | Nspt |
|---------|-----------|-----------|------------------|-------|
| 2 | 3.00 | 3.45 | 3.23 | 10 |
| 2 | 4.00 | 4.45 | 4.23 | 16 |
| 3 | 6.00 | 6.45 | 6.23 | 53 |

### 5.3 API Endpoints (v0.2.0)

La nueva arquitectura incluye los siguientes endpoints principales:

**Proyectos:**
- `POST /api/v1/projects/` - Crear proyecto
- `GET /api/v1/projects/{id}` - Obtener proyecto
- `GET /api/v1/projects/` - Listar proyectos

**Definiciones de Estratos:**
- `POST /api/v1/stratum-definitions/` - Crear definición de estrato
- `GET /api/v1/stratum-definitions/` - Listar definiciones
- `POST /api/v1/stratum-definitions/bulk` - Crear múltiples estratos

**Perforaciones:**
- `POST /api/v1/boreholes/` - Crear perforación
- `GET /api/v1/boreholes/` - Listar perforaciones
- `GET /api/v1/boreholes/{id}` - Obtener perforación específica

**Estratos por Perforación:**
- `POST /api/v1/borehole-strata/` - Asignar estrato a perforación con profundidades
- `GET /api/v1/borehole-strata/` - Listar asignaciones
- `GET /api/v1/borehole-strata/borehole/{borehole_id}` - Estratos de una perforación

**Intervalos SPT:**
- `POST /api/v1/spt-intervals/` - Crear intervalo SPT
- `GET /api/v1/spt-intervals/` - Listar intervalos
- `GET /api/v1/spt-intervals/borehole/{borehole_id}` - Intervalos de una perforación

**Flujo de Trabajo Completo:**
- `POST /api/v1/project-workflow/complete` - Crear proyecto completo
- `POST /api/v1/project-workflow/example-cp00633` - Crear proyecto de ejemplo

### 5.4 Ventajas de la nueva estructura

1. **Flexibilidad Real:** Los mismos materiales pueden aparecer a diferentes profundidades en cada perforación, como ocurre en la realidad.

2. **Reutilización de Materiales:** Las propiedades del material (γh, γsat) se definen una sola vez y se reutilizan.

3. **Escalabilidad:** Fácil agregar nuevas perforaciones con estratos existentes.

4. **Consistencia:** Evita duplicación de datos y errores de inconsistencia en propiedades de materiales.

5. **Compatibilidad con Excel:** Replica exactamente la estructura de datos de los proyectos Excel reales.

Cabecera:

| Campo | Valor |
|-------|-------|
| Proyecto | CP-00630 |
| Perforación | P1 |
| Profundidad final (m) | 6.56 |
| Formulación | Kishida |
| Ø sondeo (mm) | 60–120 |
| Energía en campo (%) | 45 |
| L. varilla (m) | 3.0 |
| NF (m) | 3.00 |
| Nº de estratos | 3 |

Tabla de estratos (misma que en 5.1):

| Código Estrato | Descripción | Prof. Inicial (m) | Prof. Final (m) | γh (kN/m³) | γsat (kN/m³) |
|----------------|-------------|-------------------|-----------------|------------|--------------|
| 1 | Ceniza Volcánica | 1.00 | 2.00 | 18.50 | 19.00 |
| 2 | H-VI Migmatita Puente P | 2.00 | 4.45 | 19.50 | 20.00 |
| 3 | H-V Migmatita de Puente P | 4.45 | 6.45 | 16.00 | 16.50 |

Tabla de tramos (entradas):

| Estrato | Descripción | Desde (m) | Hasta (m) | Punto medio (m) | Nspt (campo) |
|---------|-------------|-----------|-----------|------------------|--------------|
| 1 | Limos, finogranulares | 1.00 | 1.45 | 1.23 | 9 |
| 2 | Limos, finogranulares | 3.00 | 3.45 | 3.23 | 4 |
| 2 | Limos, finogranulares | 4.00 | 4.45 | 4.23 | 6 |
| 3 | Limos, finogranulares | 5.00 | 5.45 | 5.23 | 33 |
| 3 | Limos, finogranulares | 6.00 | 6.45 | 6.23 | 77 |

Tabla de resultados por tramo (completa):

| Estrato | Descripción | Desde (m) | Hasta (m) | Punto medio (m) | Nspt (campo) | σ′ (kPa) | CB | CS | CR | Cn (Marcuson) | N45 | N55 | N60 | N145 | φ′eq (°) Kishida | E (kPa) | τ (kPa) | Su (kPa) |
|---------|-------------|-----------|-----------|------------------|--------------|----------|----|----|----|---------------|------|------|-----|------|------------------|---------|---------|----------|
| 1 | Limos, finogranulares | 1.00 | 1.45 | 1.23 | 9 | 22.66 | 1.00 | 1.00 | 0.75 | 1.91 | 9.00 | 6.19 | 5 | 17 | 29.65 | 3,656 | 12.90 | N/A |
| 2 | Limos, finogranulares | 3.00 | 3.45 | 3.23 | 4 | 58.79 | 1.00 | 1.00 | 0.75 | 1.33 | 4.00 | 2.75 | 2 | 5 | 23.14 | 2,625 | 25.13 | N/A |
| 2 | Limos, finogranulares | 4.00 | 4.45 | 4.23 | 6 | 68.98 | 1.00 | 1.00 | 0.85 | 1.23 | 6.80 | 5.30 | 4 | 8 | 25.21 | 3,390 | 32.48 | N/A |
| 3 | Limos, finogranulares | 5.00 | 5.45 | 5.23 | 33 | 76.46 | 1.00 | 1.00 | 0.85 | 1.16 | 37.40 | 29.14 | 24 | 44 | 38.33 | 10,542 | 60.45 | N/A |
| 3 | Limos, finogranulares | 6.00 | 6.45 | 6.23 | 77 | 83.15 | 1.00 | 1.00 | 0.95 | 1.11 | 97.53 | 84.94 | 69 | 109 | 51.84 | 27,281 | 105.80 | N/A |

Notas:

- No es necesario renderizar todos los campos en la primera versión; la tabla completa se incluye para contexto y validación de cálculo.  
- En la cabecera se recomienda mostrar: NF, Nº de estratos, Ø sondeo (mm), L. varilla (m). Los dos últimos como listas desplegables.  
- Si no hay NF, ingresar una profundidad mayor a la máxima de cálculo para no afectar σ′.  
- En "Formulación" se listan JRB y Kishida. JRB utiliza Cn de Skempton (tiende a valores de Cn ≤ 2 y φ′ algo menores). Kishida con Cn de Seed–Idriss (Marcuson) es el recomendado por práctica local, usualmente arrojando φ′ algo mayores.

---

## 6. Resultados esperados

- Por estrato (fila): φ′eq, E, τ, Su, σ′.  
- Por perforación: tabla de estratos + parámetros derivados.  
- Por proyecto: regresión global τ–σ′ por material para obtener c′ y φ′.  
- Gráficos:  
  - τ vs. σ′ (pendiente = tanφ′; intercepto = c′)  
  - Diagrama c′ vs. tanφ′ por materiales/estratos  
  - Opcional: histogramas de N_ref y φ′eq, perfiles de σ′ y τ

---

## 7. Buenas prácticas y validaciones

- Unidades:  
  - γ, γsat en kN/m³ (típico 14–22)  
  - σ, σ′, u en kPa  
  - E en kPa o MPa (mantener consistencia en reportes)

- Rango de entradas:  
  - Nspt: entero ≥ 0 (verificar valores atípicos)  
  - NF: ≥ 0 m  
  - Profundidades: desde < hasta  
  - Energía de campo: 0–200%  
  - Factores CB, CS, CR: > 0 (valores típicos cercanos a 1)  
  - Cn: limitar a Cn ≤ 2

- Consistencia:  
  - Si comportamiento = No drenado (arcillas), priorizar Su y usar φ′ con cautela.  
  - Si comportamiento = Drenado (arenas/limos), priorizar φ′; c′ ≈ 0 salvo evidencia.

- Redondeo:  
  - φ′: 0.1–0.5°  
  - c′, σ′, τ, Su: 1–5 kPa según escala  
  - N_ref: entero o 0.1 según política

- Advertencias:  
  - Emitir aviso si E se calcula fuera de rangos típicos para el material.  
  - Marcar Nspt = 0 o muy altos para revisión.  
  - Reportar cuando c′ se fuerza a 0.

---

## 8. Glosario de símbolos

- N: golpes/30 cm del SPT (campo)  
- N_ref: N normalizado (N45 por defecto)  
- γh, γsat: pesos unitarios húmedo y saturado  
- γw: peso unitario del agua (≈ 9.81 kN/m³)  
- NF: nivel freático (m)  
- z: profundidad (m)  
- σ_tot: tensión total (kPa)  
- u: presión de poro (kPa)  
- σ′: tensión efectiva (kPa)  
- CB, CS, CR: factores de corrección (muestreador, sampler, varillaje)  
- Cn: corrección por confinamiento (Seed–Idriss/Marcuson)  
- CE: corrección por energía (E_ref/E_campo)  
- φ′, φ′eq: ángulo de fricción efectiva (°)  
- c′: cohesión efectiva (kPa)  
- τ: resistencia cortante (kPa)  
- Su: resistencia no drenada (kPa)  
- E: módulo de elasticidad (kPa)

---

## 9. Referencias

- Ishihara, K. (1989). Dinámica aplicada a la estabilidad de taludes. Sociedad Colombiana de Geotecnia – Universidad Nacional.  
- Terzaghi, K., Peck, R. B., & Mesri, G. Soil Mechanics in Engineering Practice.  
- Robertson, P. K., & Campanella, R. G. Interpretation of Cone Penetration Tests.  
- Marcuson, W. F., & Seed, H. B. Energy correction factors in SPT.  
- Kishida, H. (1967). Correlation between N-value and φ′.

---

## 10. Notas para desarrollo

- La versión beta implementa formularios por "steps" en React, generados según el número de perforaciones indicado en el primer paso (FormBase).  
- El ID de proyecto se genera en frontend (Math.random), no es editable por el usuario y se envía como string al backend.  
- Preparar el modelo de datos para soportar:  
  - Múltiples perforaciones por proyecto  
  - Múltiples estratos por perforación  
  - Parámetros calculados por tramo y agregaciones por estrato/material  
- Considerar internacionalización (ES/EN) y formatos numéricos (punto decimal).  
- Registrar logs de validación y cálculos clave para trazabilidad (NF, Cn aplicado, E_ref, forcing c′ = 0, etc.).  
- Se espera que el endpoint de resultados, cuyo contenido debe incluir todos los datos para validaciones con el documento original, basándose en los datos brindados en el Excel y las tablas anexadas aquí, presente un formato similar al siguiente:

```json
{
  "project": {
    "id": "CP-00630",
    "name": "Edificio Residencial",
    "date": "2025-08-17",
    "elaborated_by": "Gerardo Bastidas",
    "reviewed_by": "Santiago Perez"
  },
  "boreholes": [
    {
      "id": "P1",
      "depth_final_m": 6.56,
      "nf_m": 3.00,
      "formulation": "Kishida",
      "energy_field_pct": 45,
      "num_strata": 3,
      "strata": [
        {
          "code": 1,
          "name": "Ceniza Volcánica",
          "depth_from_m": 1.00,
          "depth_to_m": 2.00,
          "gamma_h_kN_m3": 18.5,
          "gamma_sat_kN_m3": 19.0
        },
        {
          "code": 2,
          "name": "H-VI Migmatita Puente P",
          "depth_from_m": 2.00,
          "depth_to_m": 4.45,
          "gamma_h_kN_m3": 19.5,
          "gamma_sat_kN_m3": 20.0
        },
        {
          "code": 3,
          "name": "H-V Migmatita de Puente P",
          "depth_from_m": 4.45,
          "depth_to_m": 6.45,
          "gamma_h_kN_m3": 16.0,
          "gamma_sat_kN_m3": 16.5
        }
      ],
      "intervals": [
        {
          "stratum_code": 1,
          "depth_from_m": 1.00,
          "depth_to_m": 1.45,
          "midpoint_m": 1.23,
          "nspt_raw": 9,
          "sigma_eff_kPa": 22.66,
          "cb": 1.0,
          "cs": 1.0,
          "cr": 0.75,
          "ce": 1.0,
          "cn": 1.91,
          "n45": 9.0,
          "phi_deg_eq": 29.65,
          "tau_kPa": 12.90,
          "su_kPa": null,
          "E_kPa": 3656,
          "formula": "Kishida"
        },
        {
          "stratum_code": 2,
          "depth_from_m": 3.00,
          "depth_to_m": 3.45,
          "midpoint_m": 3.23,
          "nspt_raw": 4,
          "sigma_eff_kPa": 58.79,
          "cb": 1.0,
          "cs": 1.0,
          "cr": 0.75,
          "ce": 1.0,
          "cn": 1.33,
          "n45": 4.0,
          "phi_deg_eq": 23.14,
          "tau_kPa": 25.13,
          "su_kPa": null,
          "E_kPa": 2625,
          "formula": "Kishida"
        },
        {
          "stratum_code": 2,
          "depth_from_m": 4.00,
          "depth_to_m": 4.45,
          "midpoint_m": 4.23,
          "nspt_raw": 6,
          "sigma_eff_kPa": 68.98,
          "cb": 1.0,
          "cs": 1.0,
          "cr": 0.85,
          "ce": 1.0,
          "cn": 1.23,
          "n45": 6.8,
          "phi_deg_eq": 25.21,
          "tau_kPa": 32.48,
          "su_kPa": null,
          "E_kPa": 3390,
          "formula": "Kishida"
        },
        {
          "stratum_code": 3,
          "depth_from_m": 5.00,
          "depth_to_m": 5.45,
          "midpoint_m": 5.23,
          "nspt_raw": 33,
          "sigma_eff_kPa": 76.46,
          "cb": 1.0,
          "cs": 1.0,
          "cr": 0.85,
          "ce": 1.0,
          "cn": 1.16,
          "n45": 37.4,
          "phi_deg_eq": 38.33,
          "tau_kPa": 60.45,
          "su_kPa": null,
          "E_kPa": 10542,
          "formula": "Kishida"
        },
        {
          "stratum_code": 3,
          "depth_from_m": 6.00,
          "depth_to_m": 6.45,
          "midpoint_m": 6.23,
          "nspt_raw": 77,
          "sigma_eff_kPa": 83.15,
          "cb": 1.0,
          "cs": 1.0,
          "cr": 0.95,
          "ce": 1.0,
          "cn": 1.11,
          "n45": 97.5,
          "phi_deg_eq": 51.84,
          "tau_kPa": 105.80,
          "su_kPa": null,
          "E_kPa": 27281,
          "formula": "Kishida"
        }
      ],
      "regression_results": {
        "method": "linear_regression_tau_sigma",
        "phi_global_deg": 30.5,
        "c_prime_kPa": 0.0,
        "r2": 0.92
      }
    }
  ]
}
```

---