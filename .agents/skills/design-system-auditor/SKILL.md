---
name: design-system-auditor
description: Audita código de interfaz y estilos para detectar inconsistencias visuales, valores hardcodeados y falta de tokens de diseño.
---

# Design System Auditor

Audita código de interfaz y estilos bajo los siguientes criterios:

## Procedimiento
1. Identifica valores numéricos 'mágicos' (p. ej., márgenes, paddings o radios de borde arbitrarios no estandarizados).
2. Detecta colores hexadecimales dispersos que deban ser abstraídos a tokens de color semánticos (`primary`, `surface`, `on-surface`, `error`, `success`).
3. Revisa la escala tipográfica (`font-size`, `line-height`, `font-weight`) y verifica consistencia de jerarquía (H1 a body/caption).
4. Entrega una tabla de hallazgos con la línea de código afectada, el valor inconsistente y la recomendación de tokenización.
