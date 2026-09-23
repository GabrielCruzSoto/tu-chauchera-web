---
name: a11y-wcag-validator
description: Evalúa componentes y pantallas bajo los criterios de accesibilidad web WCAG 2.1 niveles AA y AAA.
---

# A11y WCAG Validator

Evalúa el componente o plantilla HTML/JSX/CSS entregado:

## Criterios de Evaluación
1. **Contraste de color:** Comprueba que el ratio sea de al menos 4.5:1 para texto normal y 3:1 para texto grande o elementos interactivos esenciales.
2. **Semántica y ARIA:** Verifica etiquetas nativas (`button`, `nav`, `main`, etc.), presencia de `aria-label`, atributos de estado (`aria-expanded`, `aria-busy`) y relación `label`/`input`.
3. **Foco y teclado:** Asegura que todos los elementos interactivos cuenten con indicador visible de foco (`:focus-visible`) y orden lógico de tabulación.
4. **Reporte:** Genera un reporte clasificado en: Crítico (bloquea uso), Moderado (dificulta uso) y Sugerencia de mejora.
