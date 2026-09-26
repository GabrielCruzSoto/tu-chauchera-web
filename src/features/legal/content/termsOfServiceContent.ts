export const TERMS_OF_SERVICE_MD = `# CONDICIONES DEL SERVICIO Y TÉRMINOS DE USO DE "TU CHAUCHERA"

**Última actualización:** 25 de septiembre de 2026  
**Versión del documento:** 1.0.0  
**Dominio principal:** https://tu-chauchera.cl  
**Canales de acceso:** Aplicación Web, Aplicación Web Progresiva (PWA) y aplicaciones cliente asociadas.

---

## 1. ACEPTACIÓN DE LOS TÉRMINOS Y CONDICIONES

Bienvenido a **Tu Chauchera** (en adelante, la "Plataforma", la "Aplicación" o el "Servicio"). Las presentes Condiciones del Servicio y Términos de Uso (en adelante, las "Condiciones" o "Términos") constituyen un acuerdo legal vinculante celebrado entre usted, en calidad de usuario individual (en adelante, el "Usuario"), y el titular y desarrollador responsable de la Plataforma.

### 1.1 Perfeccionamiento del Consentimiento
Al acceder, navegar, autenticarse mediante su cuenta de Google, interactuar con la interfaz o utilizar cualquiera de las funcionalidades de Tu Chauchera, usted declara haber leído, comprendido íntegramente y aceptado sin reservas estas Condiciones, así como la [Política de Privacidad](/privacidad) oficial del Servicio. **Si no está de acuerdo con la totalidad de estas cláusulas, debe abstenerse de utilizar la Aplicación de forma inmediata.**

### 1.2 Capacidad Legal para Contratar
El Servicio está dirigido a personas naturales con plena capacidad legal para contraer obligaciones de conformidad con la legislación de la República de Chile (mayores de 18 años) o con las leyes de la jurisdicción desde la cual accedan. Si un menor de edad utiliza el Servicio, se presumirá que lo hace bajo la estricta supervisión, autorización y responsabilidad exclusiva de sus padres, madres o tutores legales.

---

## 2. IDENTIDAD DEL TITULAR Y NATURALEZA DEL SERVICIO

### 2.1 Desarrollador Independiente (Persona Natural)
Tu Chauchera no es una empresa comercial, persona jurídica ni entidad bancaria o fintech corporativa. Es un proyecto de software independiente de libre acceso concebido, desarrollado y mantenido por un desarrollador freelance independiente en calidad de persona natural:
- **Titular y Desarrollador Responsable:** Gabriel Cruz Soto.
- **Naturaleza Jurídica:** Persona Natural / Desarrollador de Software Independiente.
- **País de Origen y Jurisdicción:** Santiago de Chile, República de Chile.
- **Correo Electrónico Oficial de Contacto:** tuchaucheracl@gmail.com
- **Sitio Web Oficial:** https://tu-chauchera.cl

### 2.2 Objeto del Servicio
Tu Chauchera es una herramienta tecnológica interactiva orientada a la organización, control y planificación de las finanzas domésticas y personales. Entre sus herramientas se incluye el registro voluntario de ingresos, egresos, metas de ahorro, compromisos periódicos (obligaciones y deudas), cuotas de tarjetas de crédito y matrices de proyección de liquidez mensual.

---

## 3. MODELO ARQUITECTÓNICO "LOCAL-FIRST" Y "ZERO-BACKEND"

El Usuario reconoce y acepta que Tu Chauchera opera bajo un paradigma de ingeniería de software descentralizado y de conocimiento cero (*Zero-Knowledge*):

### 3.1 Inexistencia de Servidores Centrales Propios (Zero-Backend)
**Tu Chauchera carece por diseño de servidores centrales de almacenamiento, motores de bases de datos relacionales o sistemas back-end propietarios donde se guarden o consoliden los datos de los usuarios.** Todo el procesamiento lógico, cálculo matemático y renderizado de interfaces ocurre localmente en el motor JavaScript del navegador del Usuario (*Client-Side Application*).

### 3.2 Persistencia Exclusiva en Google Drive y Almacenamiento Local
La persistencia de la información opera exclusivamente en dos vías:
- **Entorno Local:** Memoria de sesión, LocalStorage e IndexedDB del navegador del propio dispositivo del Usuario para habilitar funcionamiento fluido y soporte desconectado (*Offline-First*).
- **Nube Personal de Google Drive:** Sincronización remota directa contra la cuenta personal de Google del Usuario mediante el alcance restringido \`https://www.googleapis.com/auth/drive.appdata\` (*Application Data Folder*), accesible únicamente por la propia aplicación dentro del espacio del Usuario.

---

## 4. DESCARGO FINANCIERO Y NO INTERMEDIACIÓN (DISCLAIMER)

### 4.1 Naturaleza Estrictamente Informática y de Apoyo Operativo
> ⚠️ **DECLARACIÓN EXPRESA:** TU CHAUCHERA ES UNA HERRAMIENTA INFORMÁTICA DE CÁLCULO Y GESTIÓN PERSONAL. NO ES UN BANCO, COMPAÑÍA DE SEGUROS, ENTIDAD FINANCIERA, ASESORÍA DE INVERSIONES, CASA DE CAMBIO NI INTERMEDIARIO DE VALORES O DINERO.

### 4.2 Ausencia de Supervisión de la CMF
La Plataforma no está fiscalizada ni requiere autorización de la Comisión para el Mercado Financiero (CMF) de Chile ni de ningún ente regulador bancario internacional, por cuanto no capta dinero del público, no procesa pagos interbancarios ni custodia activos financieros.

### 4.3 Responsabilidad Exclusiva en Decisiones Patrimoniales y Tributarias
- Todos los indicadores, gráficos y balances son estimaciones aritméticas basadas exclusivamente en los datos ingresados por el propio Usuario.
- El Usuario es el único responsable de validar la exactitud de sus registros.
- Ningún contenido de la Plataforma constituye asesoría de inversión, tributaria, contable o legal. El Desarrollador queda exento de responsabilidad por decisiones de gasto, endeudamiento o pérdidas económicas.

---

## 5. AUTENTICACIÓN, CREDENCIALES Y REGLAS DE SEGURIDAD

### 5.1 Autenticación Federada con Google (Cero Almacenamiento de Contraseñas)
El acceso a la Plataforma se gestiona exclusivamente a través de los servicios de identidad federada de Google (OAuth 2.0 / Google Identity Services).
- Tu Chauchera **NUNCA solicita, administra, procesa ni almacena contraseñas de cuentas de usuario**.
- La custodia de las credenciales de la cuenta de Google y factores de autenticación (2FA) recae bajo la exclusiva órbita de Google LLC y del Usuario.

### 5.2 Prohibición Estricta de Cargar Datos Bancarios Confidenciales
> 🚫 **PROHIBICIÓN ESTRICTA:** QUEDA PROHIBIDO que el Usuario ingrese en la Plataforma claves bancarias secretas, contraseñas de internet banking, pines de cajero, coordenadas o códigos de seguridad CVV/CVC de tarjetas. Se recomienda usar solo nombres de fantasía o los últimos 4 dígitos.

---

## 6. BÓVEDA CRIPTOGRÁFICA Y RESPONSABILIDAD SOBRE LA CLAVE MAESTRA

### 6.1 Cifrado Criptográfico de Nivel Militar (AES-256-GCM)
La Plataforma incorpora un módulo criptográfico de bóveda local implementado sobre la API estándar nativa del navegador (*Web Crypto API*):
- Cifrado simétrico de datos en reposo mediante **AES-256-GCM**, garantizando confidencialidad e integridad autenticada.
- Derivación de clave criptográfica mediante **PBKDF2** con **100.000 iteraciones de hash SHA-256**, salazón criptográfica única (*salt*) y vector de inicialización (*IV*).

### 6.2 ADVERTENCIA CRÍTICA: Arquitectura de Conocimiento Cero (Zero-Knowledge)
> ⚠️ **ADVERTENCIA CRÍTICA:** La Clave Maestra o PIN reside exclusivamente en la memoria personal y RAM volátil de la sesión del Usuario. El Desarrollador **NO conoce, NO almacena y NO tiene forma técnica de restablecer una clave olvidada**. En caso de olvido, los datos quedarán permanentemente inaccesibles.

---

## 7. LICENCIA DE USO, PROPIEDAD INTELECTUAL Y GRATUIDAD

### 7.1 Concesión de Licencia Limitada
El Desarrollador otorga al Usuario una licencia no exclusiva, revocable, intransferible, libre de regalías y para uso estrictamente personal y no comercial de la Plataforma.

### 7.2 Propiedad Intelectual del Desarrollador
Todos los derechos de propiedad intelectual sobre el código fuente compilado, interfaces gráficas, diseño, marcas, el nombre "Tu Chauchera" y su identidad de producto son de titularidad exclusiva de Gabriel Cruz Soto o de librerías de código abierto bajo licencias permisivas.

### 7.3 Propiedad Irrestricta de los Datos por el Usuario
El Usuario conserva en todo momento la titularidad y soberanía absoluta sobre los datos financieros, presupuestos y notas que registre en la aplicación.

### 7.4 Carácter Gratuito del Servicio
El acceso a Tu Chauchera es gratuito para fines personales. El Desarrollador se reserva el derecho de mantener esta modalidad o introducir mejoras opcionales previa comunicación transparente.

---

## 8. CONDUCTAS PROHIBIDAS Y USO ACEPTABLE

El Usuario se compromete a hacer un uso lícito y diligente de la Plataforma. Queda expresamente prohibido:
- Utilizar la Plataforma para registrar o encubrir actividades vinculadas al lavado de activos, financiamiento ilícito o fraude.
- Ejecutar ataques de denegación de servicio (DoS/DDoS), inyecciones de código o vulneraciones de infraestructura.
- Realizar ingeniería inversa malintencionada con propósitos de suplantación de identidad (*phishing*).
- Implementar scripts automatizados o *scraping* abusivo sobre las APIs de terceros.

---

## 9. EXCLUSIÓN DE GARANTÍAS Y LIMITACIÓN DE RESPONSABILIDAD LEGAL

### 9.1 Deber de Mantenimiento Técnico y Mitigación de Vulnerabilidades
El Desarrollador asume el compromiso continuo de aplicar debida diligencia técnica para el mantenimiento de la Plataforma, el despliegue de parches de seguridad, la corrección de errores (*bugs*) y la actualización oportuna de dependencias.

### 9.2 Cláusula "Tal Cual" (As Is) y "Según Disponibilidad" (As Available)
EL SERVICIO SE ENTREGA "TAL CUAL" (*AS IS*) Y "SEGÚN DISPONIBILIDAD" (*AS AVAILABLE*), SIN GARANTÍAS DE NINGÚN TIPO, SEAN EXPRESAS, IMPLÍCITAS O LEGALES, INCLUYENDO FUNCIONAMIENTO ININTERRUMPIDO O LIBRE DE ERRORES.

### 9.3 Límite Expreso de Responsabilidad Legal e Indemnizatoria
El Desarrollador (Gabriel Cruz Soto) no será patrimonial ni legalmente responsable por:
- Pérdida, alteración o inaccesibilidad de la información por fallos en el navegador o en la cuenta de Google Drive.
- Olvido de la Clave Maestra o PIN por parte del Usuario.
- Fallas, interrupciones o cambios de políticas en los servicios de Google LLC o Vercel Inc.
- Incidentes derivados de malware, keyloggers o brechas de seguridad en el dispositivo del Usuario.
- Decisiones económicas, intereses, multas o pérdidas financieras derivadas del uso de la aplicación.

---

## 10. SERVICIOS, ENLACES Y CONDICIONES DE TERCEROS

La Plataforma interactúa directamente con servicios y componentes tecnológicos provistos por terceros:
- **Google LLC:** Proveedor de autenticación (Google Sign-In) y almacenamiento remoto (Google Drive API). Sujetos a los [Términos de Servicio de Google](https://policies.google.com/terms).
- **Vercel Inc.:** Proveedor de la red de entrega de contenido (CDN) y alojamiento web.

---

## 11. MODIFICACIONES AL SERVICIO Y A LAS CONDICIONES

### 11.1 Evolución del Software
El Desarrollador se reserva el derecho de actualizar, optimizar o modificar funcionalidades de la Plataforma en cualquier momento para adaptarla a mejoras técnicas o de experiencia de usuario.

### 11.2 Actualización de las Condiciones
Las actualizaciones de estas Condiciones se reflejarán con una nueva fecha de "Última actualización". El uso continuado del Servicio tras la publicación implica la aceptación de los nuevos términos.

---

## 12. SUSPENSIÓN, RESCISIÓN Y CIERRE DE CUENTA

### 12.1 Terminación por Voluntad del Usuario
El Usuario puede cesar el uso de la Plataforma en cualquier momento:
- Cerrando la sesión desde el menú de la aplicación.
- Borrando los datos de almacenamiento local e IndexedDB desde la configuración del navegador.
- Revocando el acceso a "Tu Chauchera" desde la configuración de seguridad de su cuenta de Google.

### 12.2 Suspensión por Incumplimiento
El Desarrollador se reserva el derecho de restringir el acceso a usuarios que vulneren estas Condiciones o comprometan la seguridad del sistema.

---

## 13. LEY APLICABLE Y JURISDICCIÓN COMPETENTE

### 13.1 Marco Regulatorio
Las presentes Condiciones se rigen por las leyes de la **República de Chile** (Código Civil, Ley N° 19.496, Ley N° 19.628 y Ley N° 17.336).

### 13.2 Jurisdicción y Resolución de Controversias
Cualquier controversia derivada de estas Condiciones será sometida a la jurisdicción exclusiva de los **Tribunales Ordinarios de Justicia de la ciudad de Santiago de Chile**.

---

## 14. MISCELÁNEOS Y DIVISIBILIDAD

- **Divisibilidad:** Si cualquier cláusula es declarada nula o ineficaz, las demás permanecerán plenamente vigentes y vinculantes.
- **No Renuncia:** La tolerancia o retraso en el ejercicio de un derecho no implicará la renuncia al mismo.
- **Integridad:** Estas Condiciones y la Política de Privacidad constituyen el acuerdo completo entre las partes.

---

## 15. CANAL DE CONTACTO Y DUDAS

Para dudas legales, consultas o soporte técnico, puede comunicarse directamente:
- **Titular Responsable:** Gabriel Cruz Soto
- **Correo Electrónico:** [tuchaucheracl@gmail.com](mailto:tuchaucheracl@gmail.com)
- **Sitio Web:** [https://tu-chauchera.cl](https://tu-chauchera.cl)
`
