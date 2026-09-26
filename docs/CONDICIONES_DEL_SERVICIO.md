# CONDICIONES DEL SERVICIO Y TÉRMINOS DE USO DE "TU CHAUCHERA"

**Última actualización:** 25 de septiembre de 2026  
**Versión del documento:** 1.0.0  
**Dominio principal:** https://tu-chauchera.cl  
**Canales de acceso:** Aplicación Web, Aplicación Web Progresiva (PWA) y aplicaciones cliente asociadas.

---

## 1. ACEPTACIÓN DE LOS TÉRMINOS Y CONDICIONES

Bienvenido a **Tu Chauchera** (en adelante, la "Plataforma", la "Aplicación" o el "Servicio"). Las presentes Condiciones del Servicio y Términos de Uso (en adelante, las "Condiciones" o "Términos") constituyen un acuerdo legal vinculante celebrado entre usted, en calidad de usuario individual (en adelante, el "Usuario"), y el titular y desarrollador responsable de la Plataforma.

### 1.1 Perfeccionamiento del Consentimiento
Al acceder, navegar, autenticarse mediante su cuenta de Google, interactuar con la interfaz o utilizar cualquiera de las funcionalidades de Tu Chauchera, usted declara haber leído, comprendido íntegramente y aceptado sin reservas estas Condiciones, así como la [Política de Privacidad](POLITICA_DE_PRIVACIDAD.md) oficial del Servicio. **Si no está de acuerdo con la totalidad de estas cláusulas, debe abstenerse de utilizar la Aplicación de forma inmediata.**

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

```
+-------------------------------------------------------------------------+
|                        DISPOSITIVO DEL USUARIO                          |
|  [Navegador Web / PWA] -> [Cómputo en Memoria Volátil]                 |
|            |                                |                           |
|            v                                v                           |
|  [Almacenamiento Local]           [Cifrado WebCrypto API]               |
|  IndexedDB / LocalStorage          AES-256-GCM (PBKDF2)                 |
+-------------------------------------------------------------------------+
                                     |
                       (Payload Cifrado de Extremo a Extremo)
                                     v
+-------------------------------------------------------------------------+
|                  NUBE PERSONAL DEL USUARIO (GOOGLE)                     |
|           Google Drive (Carpeta Oculta Privada 'drive.appdata')         |
|   * INEXISTENCIA DE SERVIDORES O BASES DE DATOS DEL DESARROLLADOR *      |
+-------------------------------------------------------------------------+
```

### 3.1 Inexistencia de Servidores Centrales Propios (Zero-Backend)
**Tu Chauchera carece por diseño de servidores centrales de almacenamiento, motores de bases de datos relacionales o sistemas back-end propietarios donde se guarden o consoliden los datos de los usuarios.** Todo el procesamiento lógico, cálculo matemático y renderizado de interfaces ocurre localmente en el motor JavaScript del navegador del Usuario (*Client-Side Application*).

### 3.2 Persistencia Exclusiva en Google Drive y Almacenamiento Local
La persistencia de la información opera exclusivamente en dos vías:
1. **Entorno Local:** Memoria de sesión, LocalStorage e IndexedDB del navegador del propio dispositivo del Usuario para habilitar funcionamiento fluido y soporte desconectado (*Offline-First*).
2. **Nube Personal de Google Drive:** Sincronización remota directa contra la cuenta personal de Google del Usuario mediante el alcance restringido `https://www.googleapis.com/auth/drive.appdata` (*Application Data Folder*), accesible únicamente por la propia aplicación dentro del espacio del Usuario.

---

## 4. DESCARGO FINANCIERO Y NO INTERMEDIACIÓN (DISCLAIMER)

### 4.1 Naturaleza Estrictamente Informática y de Apoyo Operativo
**TU CHAUCHERA ES UNA HERRAMIENTA INFORMÁTICA DE CÁLCULO Y GESTIÓN PERSONAL. NO ES UN BANCO, COMPAÑÍA DE SEGUROS, ENTIDAD FINANCIERA, ASESORÍA DE INVERSIONES, CASA DE CAMBIO NI INTERMEDIARIO DE VALORES O DINERO.**

### 4.2 Ausencia de Supervisión de la CMF
La Plataforma no está fiscalizada ni requiere autorización de la Comisión para el Mercado Financiero (CMF) de Chile ni de ningún ente regulador bancario internacional, por cuanto:
- No capta dinero ni fondos del público.
- No procesa, liquida ni ejecuta pagos, transferencias bancarias ni transacciones interbancarias.
- No custodia dinero en efectivo, instrumentos de deuda, divisas ni activos financieros de ninguna índole.

### 4.3 Responsabilidad Exclusiva en Decisiones Patrimoniales y Tributarias
- Todos los indicadores, gráficos, proyecciones presupuestarias y balances presentados en la aplicación son el resultado de cálculos aritméticos automatizados basados **exclusivamente en los datos ingresados de forma manual o cargados voluntariamente por el propio Usuario**.
- El Usuario es el único y exclusivo responsable de validar la exactitud, veracidad e integridad de la información que digita.
- Ningún contenido, gráfica o estimación de la Plataforma debe interpretarse como recomendación de inversión, asesoría legal, tributaria, contable o financiera profesional. El Desarrollador queda exento de toda responsabilidad por decisiones de gasto, endeudamiento, inversión o pérdidas económicas de cualquier índole derivadas del uso del Servicio.

---

## 5. AUTENTICACIÓN, CREDENCIALES Y REGLAS DE SEGURIDAD

### 5.1 Autenticación Federada con Google (Cero Almacenamiento de Contraseñas)
El acceso a la Plataforma se gestiona exclusivamente a través de los servicios de identidad federada de Google (OAuth 2.0 / Google Identity Services).
- Tu Chauchera **NUNCA solicita, administra, procesa ni almacena contraseñas de cuentas de usuario**.
- La custodia de las credenciales de la cuenta de Google, contraseñas y factores de autenticación de dos pasos (2FA) recae bajo la exclusiva órbita de Google LLC y de la debida diligencia del Usuario.

### 5.2 Prohibición Estricta de Cargar Datos Bancarios Confidenciales
Tu Chauchera fue diseñada para el seguimiento conceptual de finanzas. **QUEDA ESTRICTAMENTE PROHIBIDO que el Usuario ingrese en la Plataforma:**
- Claves secretas de acceso a banca electrónica o aplicaciones móviles (*passwords*, pines numéricos, claves dinámicas, coordenadas de tarjetas de transferencias).
- Códigos de validación o seguridad de tarjetas de crédito o débito (CVV, CVC, CID).
- Números de cuenta bancaria completos o números de tarjeta completos (PAN de 16 dígitos). Se recomienda utilizar únicamente nombres descriptivos de fantasía (ej. "Tarjeta Banco de Chile") o a lo sumo los últimos cuatro (4) dígitos con fines puramente identificatorios.

---

## 6. BÓVEDA CRIPTOGRÁFICA Y RESPONSABILIDAD SOBRE LA CLAVE MAESTRA

### 6.1 Cifrado Criptográfico de Nivel Militar (AES-256-GCM)
La Plataforma incorpora un módulo criptográfico de bóveda local implementado sobre la API estándar nativa del navegador (*Web Crypto API*):
- Cifrado simétrico de datos en reposo mediante **AES-256-GCM** (*Galois/Counter Mode*), garantizando confidencialidad e integridad autenticada.
- Derivación de clave criptográfica mediante **PBKDF2** (*Password-Based Key Derivation Function 2*) con **100.000 iteraciones de hash SHA-256**, incorporando salazón criptográfica única (*salt*) y vector de inicialización (*IV*) por cada ciclo de cifrado.

### 6.2 ADVERTENCIA CRÍTICA: Arquitectura de Conocimiento Cero (Zero-Knowledge)
**EL USUARIO COMPRENDE Y ACEPTA DE FORMA EXPRESA QUE:**
1. La Clave Maestra o PIN definido para desbloquear la bóveda criptográfica reside exclusivamente en su memoria personal y en la memoria RAM volátil de su sesión de navegación.
2. **El Desarrollador NO conoce, NO almacena, NO transmite y NO tiene forma técnica ni humana de restablecer, descifrar o recuperar una Clave Maestra olvidada.**
3. En caso de olvido, extravío o confusión de la Clave Maestra o PIN, **los datos respaldados en Google Drive o almacenados en el navegador quedarán irreversiblemente inaccesibles e irrecuperables**. El Usuario asume total y conscientemente dicho riesgo derivado del modelo de máxima soberanía de datos.

---

## 7. LICENCIA DE USO, PROPIEDAD INTELECTUAL Y GRATUIDAD

### 7.1 Concesión de Licencia Limitada
Bajo el cumplimiento de estas Condiciones, el Desarrollador otorga al Usuario una licencia no exclusiva, revocable, intransferible, libre de regalías y para uso estrictamente personal y no comercial de la Plataforma.

### 7.2 Propiedad Intelectual del Desarrollador
Todos los derechos de propiedad intelectual e industrial sobre la Plataforma —incluyendo, sin limitación, el código fuente compilado, interfaces gráficas de usuario, hojas de estilo, componentes de diseño, arquitectura de software, manuales, logotipos, marcas, el nombre "Tu Chauchera" y su identidad de producto— son de titularidad exclusiva de Gabriel Cruz Soto o de sus respectivos licenciantes legítimos (librerías de código abierto bajo sus respectivas licencias MIT/Apache).

### 7.3 Propiedad Irrestricta de los Datos por el Usuario
El Usuario conserva en todo momento la titularidad, propiedad y soberanía exclusiva sobre los datos financieros, presupuestos, registros de transacciones y notas que procese a través de la aplicación. Tu Chauchera no adquiere derecho, licencia de uso comercial ni interés alguno sobre dichos contenidos personales.

### 7.4 Carácter Gratuito del Servicio
Actualmente, el acceso a Tu Chauchera es gratuito y de libre disposición para fines personales. El Desarrollador se reserva el derecho de mantener esta modalidad, introducir mejoras opcionales o, en caso fortuito futuro, redefinir la estructura del Servicio previa comunicación transparente a los usuarios mediante las presentes Condiciones.

---

## 8. CONDUCTAS PROHIBIDAS Y USO ACEPTABLE

El Usuario se compromete a hacer un uso lícito, diligente y de buena fe de la Plataforma. En particular, queda prohibido:
1. **Actividades Ilegales:** Utilizar la Plataforma para registrar, planificar o encubrir actividades vinculadas al lavado de activos, financiamiento del terrorismo, fraude electrónico, estafas o cualquier ilícito sancionado por la legislación penal chilena o internacional.
2. **Ataques Informáticos y Vulneraciones:** Ejecutar ataques de denegación de servicio (DoS/DDoS), inyecciones de código malicioso (*cross-site scripting*, inyecciones de payload en JSON), sondeos no autorizados de seguridad (*port scanning*) o intentos de desestabilizar la infraestructura de distribución (CDN/Vercel).
3. **Ingeniería Inversa Malintencionada:** Descompilar, realizar ingeniería inversa o extraer código con el objeto de crear plataformas fraudulentas que suplanten la identidad del Servicio (*phishing*).
4. **Automatizaciones Abusivas:** Implementar robots, spiders, scripts automatizados o herramientas de *scraping* que saturen las APIs de terceros (Google OAuth y Google Drive) o generen sobrecargas injustificadas.

---

## 9. EXCLUSIÓN DE GARANTÍAS Y LIMITACIÓN DE RESPONSABILIDAD LEGAL

### 9.1 Deber de Mantenimiento Técnico y Mitigación de Vulnerabilidades
El Desarrollador asume un compromiso ético y profesional de aplicar debida diligencia técnica para el mantenimiento de la Plataforma, el despliegue de parches de seguridad, la corrección de errores de código (*bugs*) y la actualización oportuna de dependencias de software con el objeto de preservar la fiabilidad del Servicio.

### 9.2 Cláusula "Tal Cual" (As Is) y "Según Disponibilidad" (As Available)
EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEGISLACIÓN APLICABLE, EL SERVICIO SE ENTREGA "TAL CUAL" (*AS IS*) Y "SEGÚN DISPONIBILIDAD" (*AS AVAILABLE*), SIN GARANTÍAS DE NINGÚN TIPO, SEAN EXPRESAS, IMPLÍCITAS O LEGALES, INCLUYENDO, ENTRE OTRAS, GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO ESPECÍFICO, NO INFRACCIÓN, O FUNCIONAMIENTO ININTERRUMPIDO O LIBRE DE ERRORES.

### 9.3 Límite Expreso de Responsabilidad Legal e Indemnizatoria
El Usuario reconoce que el software no es infalible y que el Servicio se presta de forma gratuita y descentralizada. Por tanto, **el Desarrollador (Gabriel Cruz Soto) NO será civil, penal ni patrimonialmente responsable, bajo ninguna circunstancia, por:**
1. **Pérdida o Daño de Datos:** Pérdida, alteración, corrupción, sincronización fallida o inaccesibilidad de la información financiera respaldada en Google Drive o guardada en el navegador local, sin importar la causa técnica.
2. **Olvido de Clave de Cifrado:** Daños derivados de la imposibilidad de desbloquear la información debido al olvido de la Clave Maestra o PIN por parte del Usuario.
3. **Fallas en Proveedores de Infraestructura Externa:** Interrupciones, caídas de servicio, cambios de políticas, bloqueos de cuentas o fallos técnicos imputables a Google LLC (Google Identity Services, Google Drive API) o Vercel Inc. (red de distribución de contenidos y hosting).
4. **Vulneraciones en el Dispositivo del Usuario:** Acceso no autorizado, sustracción de información o malware resultante de falta de higiene digital, virus, keyloggers o brechas de seguridad en el sistema operativo, navegador o dispositivo físico del Usuario.
5. **Decisiones Económicas del Usuario:** Pérdidas comerciales, lucro cesante, pagos de intereses, multas bancarias o endeudamiento derivados de la interpretación o uso de los cómputos de la aplicación.

---

## 10. SERVICIOS, ENLACES Y CONDICIONES DE TERCEROS

La Plataforma interactúa directamente con servicios y componentes tecnológicos provistos por terceros:
- **Google LLC:** Proveedor del motor de autenticación (Google Sign-In) y del almacenamiento remoto (Google Drive API). El uso de dichos servicios está sujeto de manera adicional a los [Términos de Servicio de Google](https://policies.google.com/terms) y su respectiva Política de Privacidad.
- **Vercel Inc.:** Proveedor de la red de entrega de contenido (CDN) y alojamiento del código compilado de la aplicación web.

El Desarrollador no ejerce control sobre la infraestructura técnica ni sobre las políticas comerciales o de privacidad de tales terceros.

---

## 11. MODIFICACIONES AL SERVICIO Y A LAS CONDICIONES

### 11.1 Evolución del Software
El Desarrollador se reserva el derecho de modificar, actualizar, mejorar, optimizar o retirar temporal o definitivamente funcionalidades, interfaces o herramientas de la Plataforma en cualquier momento, con el fin de adaptarla a nuevas tecnologías, exigencias legales o mejoras en la experiencia de usuario.

### 11.2 Actualización de las Condiciones
El Desarrollador podrá revisar y actualizar estas Condiciones cuando sea necesario (por ejemplo, ante cambios regulatorios o adición de nuevas capacidades técnicas). La versión vigente se identificará siempre mediante la fecha de "Última actualización" al inicio del documento. El uso continuado del Servicio tras la publicación de los cambios constituye la aceptación íntegra de las nuevas Condiciones.

---

## 12. SUSPENSIÓN, RESCISIÓN Y CIERRE DE CUENTA

### 12.1 Terminación por Voluntad del Usuario
El Usuario puede cesar el uso de la Plataforma en cualquier momento sin necesidad de aviso previo ni penalidad alguna. Para eliminar todo rastro operativo de la aplicación, el Usuario puede ejecutar por su cuenta:
1. **Cierre de Sesión:** Hacer clic en "Cerrar sesión" dentro del menú de la Plataforma.
2. **Borrado Local:** Limpiar los datos de navegación, almacenamiento local e IndexedDB asociados a `tu-chauchera.cl` desde la configuración de su navegador web.
3. **Eliminación Remota:** Acceder a la configuración de su cuenta de Google (Seguridad -> Administrar aplicaciones de terceros con acceso a la cuenta), revocar el acceso a "Tu Chauchera" y optar por eliminar los datos de la aplicación guardados en Google Drive.

### 12.2 Suspensión por Incumplimiento
El Desarrollador se reserva el derecho de denegar, restringir o bloquear el acceso al Servicio a cualquier Usuario que vulnere las presentes Condiciones, realice un uso ilícito de la herramienta o comprometa la seguridad del ecosistema.

---

## 13. LEY APLICABLE Y JURISDICCIÓN COMPETENTE

### 13.1 Marco Regulatorio
Las presentes Condiciones del Servicio se rigen, interpretan y aplican de conformidad con las leyes de la **República de Chile**, en particular conforme a las disposiciones del Código Civil, la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores (en lo que fuere contractualmente aplicable a servicios de software gratuitos), la Ley N° 19.628 sobre Protección de la Vida Privada y la Ley N° 17.336 sobre Propiedad Intelectual.

### 13.2 Jurisdicción y Resolución de Controversias
Para todos los efectos legales, las partes fijan su domicilio en la ciudad y comuna de Santiago de Chile. Cualquier dificultad, litigio o controversia que se suscite entre el Usuario y el Desarrollador con motivo de la validez, aplicación, interpretación, cumplimiento o resolución de estas Condiciones será sometida a la jurisdicción exclusiva de los **Tribunales Ordinarios de Justicia de la ciudad de Santiago de Chile**, renunciando expresamente a cualquier otro fuero que pudiera corresponder.

---

## 14. MISCELÁNEOS Y DIVISIBILIDAD

- **Divisibilidad:** Si cualquier cláusula o disposición de las presentes Condiciones fuere declarada nula, inválida o inoponible por una sentencia judicial ejecutoriada de un tribunal competente, dicha nulidad afectará exclusivamente a dicha disposición, manteniéndose vigentes, válidas y vinculantes las restantes estipulaciones.
- **No Renuncia:** La omisión o tardanza por parte del Desarrollador en exigir el cumplimiento estricto de cualquiera de estas cláusulas no constituirá ni podrá interpretarse como una renuncia a sus derechos.
- **Integridad del Acuerdo:** Estas Condiciones, junto con la [Política de Privacidad](POLITICA_DE_PRIVACIDAD.md), constituyen el acuerdo completo y definitivo entre el Usuario y el Desarrollador respecto del uso de Tu Chauchera, reemplazando cualquier acuerdo o comunicación previa.

---

## 15. CANAL DE CONTACTO Y DUDAS

Para cualquier consulta legal, sugerencia, informe de incidencia técnica o inquietud relacionada con las presentes Condiciones del Servicio, puede ponerse en contacto directo con el titular a través del siguiente canal:

- **Titular Responsable:** Gabriel Cruz Soto
- **Correo Electrónico Oficial:** [tuchaucheracl@gmail.com](mailto:tuchaucheracl@gmail.com)
- **Asunto Recomendado:** *Consulta Legal / Condiciones del Servicio - Tu Chauchera*
- **Sitio Web:** [https://tu-chauchera.cl](https://tu-chauchera.cl)
