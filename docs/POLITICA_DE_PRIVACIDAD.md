# POLÍTICA DE PRIVACIDAD DE "TU CHAUCHERA"

**Última actualización:** 25 de septiembre de 2026
**Versión del documento:** 1.0.0  
**Dominio principal:** https://tu-chauchera.cl
**Canales de acceso:** Aplicación Web, Aplicación Web Progresiva (PWA) y aplicaciones cliente asociadas.

---

## 1. INTRODUCCIÓN Y RESPONSABLE DEL TRATAMIENTO

Bienvenido a **Tu Chauchera** (en adelante, la "Plataforma" o el "Servicio"). La presente Política de Privacidad tiene por objeto informar de manera clara, transparente y detallada a las personas usuarias (en adelante, el "Usuario" o "Titular") sobre los términos y condiciones bajo los cuales se recopilan, almacenan, procesan, protegen y gestionan sus datos personales.

### 1.1 Identidad del Responsable del Tratamiento
La Plataforma es un proyecto independiente de libre acceso orientado a la gestión de finanzas personales, desarrollado y administrado por un desarrollador independiente en calidad de persona natural. El responsable del tratamiento de los datos personales recabados es:
- **Titular / Desarrollador Responsable:** Gabriel Cruz Soto.
- **Naturaleza del Servicio:** Plataforma web independiente de libre acceso (sin fines comerciales corporativos).
- **País y Jurisdicción:** Chile.
- **Correo Electrónico de Contacto y Privacidad:** tuchaucheracl@gmail.com
- **Sitio Web Oficial:** https://tu-chauchera.cl

### 1.2 Declaración de Compromiso y Principios
Tu Chauchera ha sido concebida bajo los principios rectores de **Privacidad desde el Diseño (Privacy by Design)** y **Privacidad por Defecto (Privacy by Default)**. Entendemos que la información financiera y patrimonial pertenece a la esfera más íntima de las personas. Por ello, asumimos el compromiso inquebrantable de salvaguardar la confidencialidad, integridad y disponibilidad de su información personal y financiera, garantizando que el Usuario mantenga en todo momento la soberanía y control exclusivo sobre sus datos.

### 1.3 Ámbito de Aplicación
Esta Política de Privacidad rige para todos los accesos e interacciones que el Usuario realice a través del sitio web, subdominios vinculados, entornos web locales, aplicaciones web progresivas (PWA) y cualquier futura aplicación móvil distribuida en canales o tiendas oficiales (iOS y Android).

### 1.4 Principio Rector: Inexistencia de Servidores Propios de Almacenamiento
Tu Chauchera opera como una aplicación web del lado cliente (*Client-Side Application*). **La Plataforma NO cuenta con servidores propios ni bases de datos centralizadas donde se almacenen las finanzas, transacciones o historiales patrimoniales de los usuarios.** La persistencia, posesión y custodia de dichos datos recae única y exclusivamente en el entorno local del Usuario y en su propia cuenta personal de Google Drive.

### 1.5 Compromiso de Mantenimiento Técnico y Exención de Responsabilidad Legal
- **Deber de Mantenimiento y Mitigación de Vulnerabilidades:** El Desarrollador Responsable (Gabriel Cruz Soto) asume el compromiso continuo de aplicar debida diligencia técnica para mantener la Plataforma operativa, realizar las tareas de mantenimiento necesarias en el sistema, corregir fallos o errores de programación (*bugs*) y mitigar oportunamente vulnerabilidades de seguridad conocidas en el código de la aplicación.
- **Exención y Limitación de Responsabilidad Legal:** Atendiendo al carácter independiente y de libre acceso del Servicio, así como a su arquitectura *Client-Side* de conocimiento cero (*Zero-Knowledge*) donde los datos son cifrados y custodiados exclusivamente por el Usuario en su dispositivo y en su cuenta personal de Google Drive:
  - El Responsable **no asume responsabilidad legal, patrimonial ni indemnizatoria ante demandas, litigios o reclamaciones por pérdida, daño, corrupción o inaccesibilidad de datos** (incluyendo, entre otros, supuestos de olvido de la Contraseña Maestra por parte del Usuario, fallos de hardware local o problemas técnicos atribuibles a servicios de terceros).
  - Asimismo, el Responsable **no es responsable legalmente ante eventuales filtraciones o accesos no autorizados a datos** derivados de vulneraciones en el entorno o dispositivo local del Usuario (malware, keyloggers, etc.), sustracción de credenciales de Google, incidentes en la infraestructura externa de proveedores (Google LLC, Vercel Inc.) o negligencia del Titular en la custodia de su clave de cifrado.
  - La Plataforma se pone a disposición "tal cual" (*as is*) y "según disponibilidad" (*as available*), sin garantías de infalibilidad absoluta.

---

## 2. DATOS PERSONALES RECOPILADOS

Tu Chauchera aplica el principio de minimización de datos: únicamente se recopila la información estrictamente necesaria para la correcta prestación, seguridad y personalización de las funcionalidades del Servicio.

### 2.1 Datos de Acceso y Autenticación Exclusiva con Google (Cero Almacenamiento de Credenciales)
El acceso a la Plataforma se gestiona **única y exclusivamente mediante los servicios de autenticación federada de Google (Google Sign-In / OAuth 2.0)**.
- **Cero Almacenamiento y Gestión de Contraseñas:** Tu Chauchera **NO solicita, NO procesa, NO almacena ni posee acceso a contraseñas o credenciales de los usuarios**. El proceso de autenticación ocurre enteramente en los servidores seguros de Google LLC.
- **Información Básica de Identidad Recibida:** Al autorizar el acceso mediante su cuenta de Google, la Plataforma únicamente recibe de manera directa en el navegador del cliente:
  - **Dirección de correo electrónico:** Utilizada exclusivamente en el cliente para asociar la identidad del usuario y vincular la sesión.
  - **Nombre público y fotografía de perfil:** Utilizados de forma meramente visual y cosmética dentro de la interfaz local de la aplicación.
  - **Token temporal de autorización OAuth:** Token volátil de corta duración gestionado en el cliente para autorizar las operaciones de lectura y escritura del archivo cifrado en su propio Google Drive.
- **Alcance Restringido de Google Drive (Scope):** La aplicación solicita de forma exclusiva el alcance `https://www.googleapis.com/auth/drive.appdata` (*Application Data folder*). Esto garantiza técnicamente que Tu Chauchera únicamente puede interactuar con su propio archivo de configuración y datos dentro de una carpeta privada oculta creada para la app, **sin tener acceso, lectura ni visibilidad alguna sobre los demás archivos, fotos o documentos personales alojados en el Google Drive del usuario**.

### 2.2 Datos Financieros y de Gestión Patrimonial (Ingresados por el Usuario)
La Plataforma permite al Usuario registrar voluntariamente datos relacionados con su economía doméstica y personal:
- Registros de ingresos y egresos de dinero.
- Categorías, conceptos, etiquetas y notas descriptivas de transacciones.
- Saldos referenciales de cuentas (ej. efectivo, cuenta corriente, cuenta vista, cuenta de ahorro).
- Tarjetas de crédito (nombres de fantasía asignados por el Usuario, cupos declarados, fechas de facturación/corte y fechas de pago).
- Obligaciones financieras, deudas, compromisos periódicos y fechas de vencimiento.
- Metas de ahorro y presupuestos mensuales planificados.

> ⚠️ **DECLARACIÓN EXPRESA DE NO CAPTURA DE CREDENCIALES BANCARIAS:**  
> **Tu Chauchera NO solicita, NO almacena, NO transmite y NO tiene acceso bajo ninguna circunstancia a credenciales bancarias de acceso (claves de internet, pines de cajero, coordenadas, tokens de seguridad bancaria, claves dinámicas) ni a números completos de tarjetas de crédito/débito (PAN) o códigos de validación de seguridad (CVV/CVC).** Todos los registros financieros corresponden a datos informativos introducidos directamente por el Usuario de forma manual o mediante la importación local de extractos (ej. documentos PDF de estados de cuenta o tarjetas), los cuales son interpretados y procesados de manera 100% local en la memoria volátil del navegador web mediante librerías de cliente, sin que el archivo ni su contenido sean jamás transferidos a ningún servidor externo.

### 2.3 Datos Técnicos, de Conectividad y Auditoría
Al interactuar con la infraestructura web, se generan registros técnicos de telemetría operativa y seguridad:
- Dirección IP (anonimizada o truncada cuando aplique a telemetría general).
- Tipo, modelo y versión de navegador web (User-Agent).
- Sistema operativo, idioma preferido y resolución de pantalla del dispositivo.
- Identificadores de sesión web cifrados (tokens de sesión JWT y cookies de seguridad).
- Marcas de tiempo (timestamps) de eventos de inicio de sesión y errores técnicos en la aplicación para trazabilidad operativa y depuración de la interfaz cliente.

---

## 3. FINALIDADES DEL TRATAMIENTO DE DATOS

El tratamiento de los datos recopilados responde exclusivamente a propósitos directos, legítimos y transparentes vinculados al funcionamiento de la Plataforma:

1. **Prestación y ejecución del servicio central:**
   - Calcular balances, saldos consolidados y proyecciones de flujo de caja.
   - Generar gráficos estadísticos, reportes de categorización de gastos y distribución presupuestaria.
   - Proveer recordatorios de fechas de pago de cuentas, servicios y tarjetas de crédito.
   - Llevar el seguimiento de cumplimiento de metas de ahorro definidas por el Usuario.

2. **Seguridad, verificación y mantenimiento de cuentas:**
   - Autenticar y validar la identidad del Usuario en cada inicio de sesión.
   - Facilitar el desbloqueo seguro de la bóveda local mediante derivación criptográfica de claves.
   - Monitorear patrones anómalos de tráfico para prevenir ataques de denegación de servicio (DDoS), inyecciones maliciosas o accesos no autorizados.

3. **Comunicaciones operativas y avisos del servicio:**
   - Atender requerimientos directos de soporte y consultas remitidas por el Usuario a través del correo de contacto.
   - Notificar modificaciones sustanciales en la presente Política de Privacidad o en las condiciones de uso de la Plataforma.
   *(Al delegarse la autenticación en Google, Tu Chauchera no envía correos de confirmación de registro ni enlaces de restablecimiento de contraseña, así como tampoco remite publicidad comercial no solicitada).*

4. **Optimización técnica y analítica no invasiva:**
   - Evaluar métricas agregadas de rendimiento del sitio (ej. tiempos de carga, latencia de renderizado mediante Vercel Speed Insights) de forma totalmente disociada y sin trazabilidad individual o comercial.

> 🚫 **PROHIBICIÓN ESTRICTA DE PERFILAMIENTO COMERCIAL O VENTA DE DATOS:**  
> Los datos patrimoniales del Usuario **NUNCA** serán utilizados para elaborar perfiles de riesgo crediticio destinados a la venta, scoring no solicitado, comercialización ante instituciones financieras, aseguradoras, empresas de cobranza ni corredores de datos (data brokers).

---

## 4. BASE LEGAL DEL TRATAMIENTO

El tratamiento de datos personales efectuado por Tu Chauchera se fundamenta en las siguientes bases jurídicas, de conformidad con la legislación aplicable (Ley N° 19.628 sobre Protección de la Vida Privada de la República de Chile, sus modificaciones y estándares internacionales equivalentes):

- **Consentimiento del Titular:** Al registrarse voluntariamente en la Plataforma y marcar la casilla de aceptación expresa, el Usuario autoriza libre, informada e inequívocamente el tratamiento de sus datos conforme a los términos de este documento.
- **Ejecución de una Relación Contractual:** El tratamiento de los datos de cuenta y financieros es indispensable para dar cumplimiento a los Términos y Condiciones de Servicio acordados entre el Usuario y la Plataforma al habilitar la cuenta de usuario.
- **Interés Legítimo de Seguridad:** El registro de eventos técnicos y direcciones IP obedece al legítimo interés de garantizar la seguridad de las redes, la integridad de los sistemas y la protección contra ataques informáticos.
- **Cumplimiento de Obligaciones Legales:** Procesamiento o conservación de ciertos registros ante mandatos expresos de tribunales de justicia competentes o normativas legales imperativas.

---

## 5. ARQUITECTURA TÉCNICA, MEDIDAS DE SEGURIDAD Y RETENCIÓN

La arquitectura de Tu Chauchera se basa en el principio de **soberanía total del dato**. A diferencia de los servicios bancarios o fintech tradicionales que centralizan bases de datos masivas con la información de todos sus usuarios, **Tu Chauchera NO utiliza servidores de base de datos propios para almacenar sus finanzas**.

### 5.1 Inexistencia de Servidores Propios de Almacenamiento Financiero
- **Cero Almacenamiento Centralizado:** Ni el desarrollador independiente ni la plataforma poseen o alquilan servidores de bases de datos donde se compilen o consoliden transacciones, presupuestos o gastos de los usuarios.
- **Modelo Client-Side Puro:** La aplicación se descarga en el navegador web del Usuario y se ejecuta de manera autónoma en su máquina. Los cálculos de balances, agregaciones de costos y proyecciones presupuestarias ocurren de forma 100% local.

### 5.2 Persistencia Exclusiva en la Cuenta Personal de Google (Google Drive) y Almacenamiento Local
La persistencia de los datos del Usuario se apoya exclusivamente en dos niveles bajo su propiedad:
1. **Persistencia Local (IndexedDB del Navegador):** Los datos operativos se guardan localmente en el motor de almacenamiento seguro del navegador web del Usuario (IndexedDB / LocalStorage).
2. **Persistencia y Sincronización Remota (Google Drive Personal):** La sincronización en la nube se realiza **directamente entre el navegador del Usuario y su propia cuenta personal de Google Drive**. 
   - El archivo de respaldo se almacena en el espacio privado de datos de aplicaciones (`appDataFolder`) de la cuenta de Google perteneciente al Usuario.
   - **Tu Chauchera no intermedia ni copia este archivo en ningún servidor intermedio.** El archivo viaja directamente desde el navegador del cliente a la API de Google Drive del usuario.
   - El titular mantiene el control físico y lógico de este archivo en su cuenta de Google y puede acceder a él, exportarlo o eliminarlo cuando lo estime conveniente desde los ajustes de su cuenta de Google o de la aplicación.

### 5.3 Blindaje Criptográfico: Cifrado AES-256-GCM de Conocimiento Cero (Zero-Knowledge)
- **Cifrado Autenticado de Grado Militar (AES-256-GCM):** Antes de ser guardados en el almacenamiento local o sincronizados con Google Drive, los datos patrimoniales y transaccionales son cifrados mediante el estándar de cifrado autenticado **AES-256-GCM** (*Galois/Counter Mode*), incorporando un vector de inicialización (IV) criptográfico aleatorio de 96 bits en cada operación.
- **Derivación Robusta con PBKDF2 (100.000 iteraciones, SHA-256):** La llave simétrica de descifrado (*CryptoKey* de 256 bits, marcada como no extraíble para seguridad en memoria) se genera en el navegador a partir de una Contraseña Maestra definida por el Usuario mediante la API estándar nativa **WebCrypto**, ejecutando **100.000 iteraciones de PBKDF2 con función de resumen SHA-256** y salteo criptográfico. Esta contraseña y su llave derivada residen única y exclusivamente en la memoria volátil del dispositivo local, son totalmente independientes de las credenciales de Google y jamás se envían a través de la red.
- **Conocimiento Cero (Zero-Knowledge Architecture):** Ni el desarrollador independiente, ni Google, ni ningún tercero disponen de la clave de descifrado o de facultades técnicas para inspeccionar, reconstruir o vulnerar el contenido de la bóveda financiera del Usuario.

### 5.4 Plazos de Retención, Purga y Soberanía de Eliminación
- **Autonomía de Borrado:** Al no existir bases de datos centrales de finanzas, el Usuario no depende de solicitudes de borrado a terceros para destruir sus datos financieros: puede purgar la bóveda local directamente desde los ajustes de la aplicación y revocar el acceso a Tu Chauchera en su cuenta de Google, eliminando el archivo correspondiente en su Google Drive al instante.
- **Datos de Sesión y Revocación Inmediata:** Tu Chauchera no almacena credenciales ni perfiles de usuario en servidores propios. Al delegarse la autenticación exclusivamente en Google, el Usuario puede revocar los permisos de acceso a Tu Chauchera en cualquier momento directamente desde el panel de seguridad de su cuenta de Google (*"Gestionar el acceso de aplicaciones de terceros"*), interrumpiendo cualquier comunicación futura con su cuenta de Google Drive.

---

## 6. TRANSFERENCIA Y DIVULGACIÓN A TERCEROS

Tu Chauchera no lucra ni comercializa bajo ningún concepto con los datos de sus Usuarios.

### 6.1 Principio General de Confidencialidad
Queda estrictamente prohibida la venta, arriendo, cesión, intercambio o distribución comercial de datos personales o financieros a agencias de marketing, corredores de seguros, plataformas publicitarias o cualquier otra entidad lucrativa externa.

### 6.2 Proveedores de Servicios Tecnológicos Auxiliares
Al carecer de servidores de backend o bases de datos centralizadas, Tu Chauchera se apoya exclusivamente en los siguientes proveedores tecnológicos auxiliares para posibilitar la entrega del código web y la autenticación:
1. **Google LLC:** Proveedor de los servicios de autenticación federada (Google Sign-In / OAuth 2.0) y de almacenamiento en la nube (Google Drive API en el espacio `appDataFolder`). La autenticación y la gestión de permisos se rigen adicionalmente por los Términos de Servicio y la Política de Privacidad de Google LLC.
2. **Vercel Inc.:** Plataforma proveedora del alojamiento y distribución del código estático de la aplicación web (HTML, JavaScript, CSS) mediante redes de distribución de contenido (CDN), así como de métricas técnicas de velocidad de carga (Vercel Speed Insights) procesadas de forma disociada sin recolección de datos personales identificables.

### 6.3 Requerimientos Judiciales o Gubernamentales
Tu Chauchera únicamente revelará información personal ante una resolución u orden emanada de un tribunal de justicia de la República de Chile u organismo público competente, siempre que dicha solicitud se encuentre debidamente fundada en derecho y con arreglo a las facultades legales conferidas por el ordenamiento jurídico. Siempre que la ley y las disposiciones judiciales no lo prohíban expresamente, se notificará al Usuario sobre la existencia de dicho requerimiento.

---

## 7. USO DE COOKIES Y TECNOLOGÍAS DE ALMACENAMIENTO LOCAL

Tu Chauchera utiliza cookies y tecnologías de almacenamiento local en el navegador (como `localStorage` y `IndexedDB`) con fines estrictamente funcionales y de seguridad.

### 7.1 Tipos de Tecnologías Empleadas
- **Cookies y Almacenamiento Estrictamente Necesarios (Técnicos):** Indispensables para mantener la sesión autenticada activa, recordar el estado de desbloqueo de la interfaz durante la navegación, prevenir ataques de falsificación de peticiones en sitios cruzados (CSRF) y gestionar preferencias técnicas esenciales (como el tema oscuro/claro).
- **Métricas de Rendimiento Agregadas (Analítica no invasiva):** Herramientas técnicas de diagnóstico (ej. Vercel Speed Insights) que registran métricas acumulativas de velocidad de renderizado (Core Web Vitals). Estas tecnologías no registran información financiera, correos electrónicos ni nombres de usuarios, y no realizan rastreo entre diferentes sitios web (cross-site tracking).
- **Bóveda Local Cifrada (IndexedDB):** Espacio de almacenamiento local en el disco de su propio dispositivo donde reside la base de datos cifrada de sus cuentas y gastos personales.

### 7.2 Gestión y Bloqueo de Cookies
El Usuario puede en cualquier momento bloquear, restringir o eliminar las cookies instaladas modificando las preferencias de seguridad y privacidad de su navegador de internet (Chrome, Firefox, Safari, Edge, Brave, etc.). No obstante, se hace presente que la inhabilitación de las cookies estrictamente necesarias impedirá el inicio de sesión y la operatividad técnica de la Plataforma.

---

## 8. DERECHOS DEL TITULAR (DERECHOS ARCO Y PORTABILIDAD)

En cumplimiento de la Ley N° 19.628 de la República de Chile, sus modificaciones y los estándares internacionales de protección de datos personales, el Titular de los datos tiene garantizado el ejercicio gratuito de los siguientes derechos:

- **Derecho de Acceso:** Conocer qué datos personales suyos están siendo tratados por la Plataforma, el origen de los mismos y las finalidades asociadas.
- **Derecho de Rectificación:** Solicitar la corrección o actualización de datos personales que sean inexactos, incompletos, desactualizados o equívocos.
- **Derecho de Cancelación / Supresión:** Solicitar la eliminación total y definitiva de sus datos personales cuando hayan dejado de ser necesarios para las finalidades del servicio o cuando retire su consentimiento.
- **Derecho de Oposición:** Oponerse al tratamiento de sus datos para finalidades específicas que no sean indispensables para la continuidad del servicio o cuando existan motivos fundados vinculados a su situación particular.
- **Derecho a la Portabilidad:** Obtener una copia de sus registros financieros en un formato estructurado, transparente, legible por máquina y de uso común (ej. descarga directa de la bóveda en formato **JSON** o exportación en hojas de cálculo).

### 8.1 Mecanismo y Procedimiento para el Ejercicio de Derechos
Para ejercer cualquiera de los derechos enunciados, el Usuario deberá remitir una solicitud escrita al canal de privacidad:
- **Correo Electrónico:** [CORREO DE CONTACTO DPO/SOPORTE - ej. tuchaucheracl@gmail.com]
- **Asunto:** "Ejercicio de Derechos ARCO - Tu Chauchera"
- **Contenido del Mensaje:** Identificación del solicitante (nombre completo y correo electrónico registrado en la Plataforma), indicación precisa del derecho que desea ejercer y los antecedentes que fundamenten la petición.

### 8.2 Plazos de Respuesta
Las solicitudes serán revisadas y resueltas en un plazo no mayor a **quince (15) días hábiles** contados desde la recepción válida de la solicitud con la acreditación correspondiente de identidad, sin costo alguno para el Titular.

---

## 9. PRIVACIDAD DE MENORES DE EDAD

La Plataforma "Tu Chauchera" y sus herramientas de administración financiera están orientadas y destinadas exclusivamente a personas que cuenten con plena capacidad legal para contratar y gestionar recursos patrimoniales conforme a la legislación de su país de residencia (en Chile, personas **mayores de 18 años**).

Tu Chauchera no recopila, solicita ni procesa conscientemente datos personales de menores de edad o personas legalmente incapaces. En caso de detectarse que una cuenta ha sido registrada por un menor de edad sin la acreditación fehaciente de autorización de sus representantes legales, se procederá al bloqueo inmediato de la cuenta y a la supresión irreversible de todos los registros asociados.

---

## 10. MODIFICACIONES A LA POLÍTICA DE PRIVACIDAD

Tu Chauchera se reserva el derecho de modificar o actualizar la presente Política de Privacidad de forma periódica, ya sea para reflejar mejoras operativas en la aplicación, nuevas integraciones tecnológicas, actualizaciones de seguridad o adecuaciones derivadas de reformas legales o regulatorias en materia de protección de datos personales.

### 10.1 Notificación de Cambios Sustanciales
Cuando se introduzcan modificaciones de carácter sustancial que incidan significativamente en las finalidades del tratamiento, la titularidad del responsable o los derechos de los usuarios:
1. Se publicará un aviso destacado o banner informativo dentro de la Plataforma web y móvil.
2. Se remitirá una comunicación informativa a la dirección de correo electrónico vinculada a la cuenta de cada Usuario con una anticipación razonable a la entrada en vigencia de las nuevas condiciones.

### 10.2 Aceptación del Documento Actualizado
La fecha de la última actualización estará permanentemente consignada en el encabezado de este documento. El acceso continuado o la utilización de los servicios de Tu Chauchera con posterioridad a la entrada en vigor de las modificaciones constituye la plena aceptación de la Política de Privacidad actualizada. Si el Usuario no estuviere conforme con los nuevos términos, podrá en cualquier momento ejercer su derecho de supresión de cuenta y exportar sus registros financieros.

---

## 11. CANAL DE CONTACTO, CONSULTAS Y DUDAS LEGALES

Si tiene consultas, comentarios, dudas técnicas sobre los mecanismos de cifrado o inquietudes relativas a la interpretación o aplicación de esta Política de Privacidad, puede comunicarse de manera directa con nuestro equipo a través de los siguientes canales:

- **Canal Principal de Privacidad y Soporte:** tuchaucheracl@gmail.com
- **Desarrollador Responsable:** Gabriel Alejandro Cruz Soto
- **Ubicación de Referencia:** Chile / Santiago de Chile
- **Sitio Web Oficial:** https://tu-chauchera.cl

---
*Este documento constituye la manifestación íntegra de la Política de Privacidad de Tu Chauchera y ha sido redactado con pleno apego a los estándares de transparencia, seguridad por diseño y respeto irrestricto a los derechos de autodeterminación informativa de los usuarios.*
