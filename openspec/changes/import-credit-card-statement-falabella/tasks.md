# Implementation Tasks: import-credit-card-statement-falabella

## Plan de Ejecución
- **Paso 1:** Parser del estado de cuenta de CMR Falabella (`falabellaParser.ts`) con pruebas unitarias TDD exhaustivas que validen la extracción de fechas, comercios, cuotas y montos.
- **Paso 2:** Modal de importación y conciliación (`StatementImportModal.tsx`) con soporte para cargar PDF/texto, previsualización en tabla, asignación de terceros y guardado masivo en el store.
- **Paso 3:** Botón "📄 Importar Estado de Cuenta" integrado en el `CreditCardsDashboard.tsx` con pruebas de componentes.
