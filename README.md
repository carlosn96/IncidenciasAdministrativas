# Sistema de Gestión de Incidencias Administrativas

Este proyecto es una aplicación web de alta productividad, diseñada específicamente para coordinadores académicos. Su propósito es simplificar y automatizar el registro de horas de trabajo, facilitar la planificación quincenal y generar reportes de incidencias de manera eficiente e intuitiva.

La aplicación está construida con las últimas tecnologías web y se integra profundamente con los servicios de Google y Firebase para ofrecer una experiencia de usuario segura, rápida y fiable.

## Propuesta de Valor: ¿Por Qué Usar Esta Aplicación?

-   **Ahorro de Tiempo:** Automatiza el cálculo de horas y la generación de reportes, liberando tiempo valioso que puedes dedicar a tareas académicas.
-   **Planificación Inteligente:** El módulo de proyecciones te permite visualizar y ajustar tu quincena para cumplir tus metas de horas sin esfuerzo, evitando sorpresas al final del periodo.
-   **Cero Errores, Cero Olvidos:** Con un sistema de registro claro y la posibilidad de editar incidencias pasadas, se minimizan los errores humanos y se asegura que cada hora trabajada quede registrada.
-   **Información Centralizada y Accesible:** Todos tus datos están seguros en la nube y disponibles desde cualquier dispositivo. Se acabó el depender de hojas de cálculo dispersas o notas de papel.
-   **Totalmente Personalizable:** Adapta la aplicación a tu rutina con plantillas de horario y listas de ubicaciones personalizadas.

---

## Funcionalidades Detalladas

A continuación se detalla el funcionamiento de cada módulo de la aplicación.

### 1. Autenticación Inteligente y Segura

El acceso a la aplicación está restringido y protegido mediante **Firebase Authentication**, usando un método de inicio de sesión moderno y seguro.

-   **Inicio de Sesión con Google (Popup):** Los usuarios acceden utilizando su cuenta de Google a través de una ventana emergente, lo que evita recargas de página y ofrece una experiencia fluida.
-   **Restricción de Dominio (Opcional):** El sistema está preparado para aceptar únicamente cuentas de un dominio institucional específico (ej. `@une.edu.mx`), asegurando que solo personal autorizado pueda registrarse.
-   **Sesión Persistente y Rutas Protegidas:** Una vez que inicias sesión, tu sesión se mantiene activa. Todas las páginas del panel están protegidas, y si un usuario no autenticado intenta acceder, es redirigido automáticamente a la página de inicio.

### 2. Panel Principal: Tu Centro de Mando Diario

Esta es la página de bienvenida y el centro de operaciones diario del usuario. Está diseñada para darte toda la información relevante de un vistazo.

-   **Saludo Personalizado y Resumen del Periodo:**
    -   Un saludo de bienvenida con tu nombre.
    -   Una **tarjeta de Periodo Activo** que muestra el progreso de tus horas laboradas con una barra de progreso visual. Es un atajo directo a la página de detalle de ese periodo.
-   **Tarjeta de Proyección del Día:**
    -   Si has planificado tu jornada, una tarjeta especial mostrará la **hora de entrada y salida proyectadas** para hoy.
    -   **Comportamiento Dinámico:** La entrada proyectada desaparece en cuanto registras tu entrada real, pero la salida proyectada permanece como recordatorio. La tarjeta completa se oculta una vez que registras tu salida real.
-   **Registro de Incidencias en Tiempo Real:**
    -   Un **reloj digital** y la fecha actual siempre visibles.
    -   Un **selector de ubicación** inteligente que carga tu lista de planteles personalizada y te sugiere automáticamente la ubicación según tu horario activo.
    -   **Botones de "Registrar Entrada" y "Registrar Salida"** que se habilitan y deshabilitan de forma lógica para prevenir errores.
-   **Tabla de Eventos del Día:**
    -   Muestra una lista clara de la entrada y salida registradas, con su hora y ubicación.
    -   Cada registro se puede **editar** (para corregir la hora o ubicación) o **eliminar** de forma segura.

### 3. Planificador de Proyecciones: Cumple tus Metas sin Estrés

Este módulo es la herramienta clave para la planificación y el cumplimiento de metas de horas.

-   **Selector de Periodo:** Elige cualquier periodo creado para visualizar o modificar su planificación.
-   **Tarjeta de Estadísticas de Proyección:** Un resumen financiero de tu tiempo.
    -   **Meta del Periodo:** Total de horas que debes cubrir.
    -   **Horas Reales:** Suma de las horas ya trabajadas.
    -   **Total Proyectado:** Suma de las horas reales y las horas planificadas para días futuros.
    -   **Balanza:** La diferencia entre el total proyectado y la meta, indicando con colores si te sobran (verde) o te faltan (rojo) horas.
-   **Tabla de Planificación Semanal:**
    -   Muestra cada día laborable del periodo. Los días ya completados (con entrada y salida real) se marcan con un **sombreado verde** para distinguirlos.
    -   El **día actual** está marcado con un **punto animado** para encontrarlo fácilmente.
    -   Puedes introducir la **hora y lugar de entrada/salida proyectadas** para los días futuros. Los campos se deshabilitan inteligentemente a medida que registras tus incidencias reales.
-   **Automatización de la Planificación:**
    -   **Cargar Horario por Defecto:** Con un solo clic, rellena toda la proyección con tu plantilla de horario activa.
    -   **Guardar como Plantilla:** Si creas una planificación que quieres reutilizar, guárdala como una nueva plantilla directamente desde aquí.

### 4. Gestión de Periodos y Reportes

#### Detalle y Reporte del Periodo

Se accede desde la tarjeta del periodo activo en el panel principal o desde el listado de periodos. Ofrece una vista consolidada de un periodo completo.

-   **Resumen de Horas:** Muestra un resumen visual del progreso, incluyendo horas laboradas, restantes y la meta total.
-   **Descarga de Reporte CSV:** Una función crítica que genera y descarga un archivo `.csv` con el detalle de todas las incidencias del periodo. Este archivo está formateado profesionalmente para su entrega administrativa.
-   **Tabla de Incidencias del Periodo:**
    -   Lista cada día del periodo. El **día actual** está resaltado con el mismo punto animado.
    -   Permite **editar** incidencias de días pasados.
    -   Para días futuros, el botón de editar está deshabilitado y un mensaje guía al usuario hacia la sección de **Proyecciones**.

#### Listado y Creación de Periodos (`Ajustes > Periodos`)

-   **Creación de Periodos:** Crea nuevos periodos de registro (normalmente quincenales) con nombre, rango de fechas y la opción de incluir sábados en el cálculo de horas.
-   **Validación de Fechas:** Impide crear periodos con fechas que se solapen para mantener la integridad de los datos.
-   **Listado de Periodos:** Muestra todos los periodos creados, ordenados del más reciente al más antiguo.
-   **Menú de Acciones por Periodo:** Cada periodo tiene un menú desplegable profesional que permite:
    -   Ver Incidencias
    -   Realizar Proyección
    -   Editar
    -   Eliminar (con diálogo de confirmación)

### 5. Configuración Totalmente Personalizable (`Ajustes`)

#### Mis Ubicaciones

-   Gestiona tu lista personal de planteles o lugares de trabajo.
-   Puedes añadir ubicaciones desde una lista maestra de la institución y eliminarlas cuando ya no las necesites. Esta lista es la que aparece en los selectores de ubicación en toda la aplicación.

#### Plantillas de Horario Flexibles

-   **Múltiples Plantillas:** Crea y guarda varias plantillas de horario (ej. "Horario de Verano", "Horario Regular").
-   **Horario Activo:** Selecciona una plantilla como tu horario "activo". Este se usará para autocompletar proyecciones y sugerir ubicaciones en el registro diario.
-   **Editor de Horarios Completo:**
    -   Un potente formulario para definir el horario de toda la semana (Lunes a Sábado).
    -   **Función "Horario Rápido":** Define una hora y lugar de entrada/salida y aplícalo a todos los días con un solo clic.
    -   **Ajuste Individual:** Después de aplicar el horario rápido, puedes modificar cualquier día de forma individual o marcarlo como día libre.

### 6. Gestión de Perfil

-   Permite al usuario ver la información de su cuenta, como su foto de perfil, nombre y correo, obtenidos de Google.
-   Incluye campos adicionales (actualmente desactivados) para futura información profesional.

---

## Tecnologías Utilizadas

-   **Framework**: Next.js (con App Router)
-   **Backend y Base de Datos**: Firebase (Authentication, Cloud Firestore)
-   **UI y Componentes**: ShadCN UI, Tailwind CSS
-   **Gestión de Estado**: React Context API
-   **Iconos**: Lucide React
-   **Lenguaje**: TypeScript

---

## Arquitectura y Despliegue

-   **Dependencia de Firebase**: La aplicación está diseñada para funcionar con los servicios de Firebase (Authentication y Firestore). No puede ser desplegada en un servidor diferente sin una reescritura de la lógica de datos y autenticación.
-   **Portabilidad del Frontend**: El código del frontend (Next.js) puede ser alojado en cualquier plataforma compatible (como Vercel, Netlify, etc.), siempre que se configuren las variables de entorno correctas para conectarse al proyecto de Firebase y se autorice el nuevo dominio en la consola de Firebase.
