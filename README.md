# Sistema de Gestión de Incidencias Administrativas

Este proyecto es una aplicación web diseñada para ayudar a los coordinadores académicos a registrar y gestionar sus horas de trabajo, planificar sus periodos quincenales y generar reportes de incidencias de manera eficiente. La aplicación está construida con Next.js y se integra profundamente con los servicios de Firebase para la autenticación y el almacenamiento de datos.

## Índice

1.  [Tecnologías Utilizadas](#tecnologías-utilizadas)
2.  [Funcionalidades Principales](#funcionalidades-principales)
    - [Autenticación](#autenticación)
    - [Panel Principal (Resumen Diario)](#panel-principal-resumen-diario)
    - [Proyecciones (Planificador)](#proyecciones-planificador)
    - [Gestión de Periodos](#gestión-de-periodos)
    - [Detalle y Reporte de Periodo](#detalle-y-reporte-de-periodo)
    - [Configuración Personalizada](#configuración-personalizada)
        - [Mis Ubicaciones](#mis-ubicaciones)
        - [Plantillas de Horario](#plantillas-de-horario)
    - [Gestión de Perfil](#gestión-de-perfil)
3.  [Despliegue y Arquitectura](#despliegue-y-arquitectura)

---

## Tecnologías Utilizadas

-   **Framework**: Next.js (con App Router)
-   **Backend y Base de Datos**: Firebase (Authentication, Cloud Firestore)
-   **UI y Componentes**: ShadCN UI, Tailwind CSS
-   **Gestión de Estado**: React Context API
-   **Iconos**: Lucide React
-   **Lenguaje**: TypeScript

---

## Funcionalidades Principales

A continuación se detalla el funcionamiento de cada módulo de la aplicación.

### Autenticación

El acceso a la aplicación está restringido y securizado mediante **Firebase Authentication**.

-   **Inicio de Sesión con Google**: Los usuarios acceden utilizando su cuenta de Google. El sistema está diseñado para aceptar únicamente cuentas de un dominio institucional específico (ej. `@une.edu.mx`).
-   **Restricción de Dominio**: El dominio permitido se configura a través de variables de entorno, asegurando que solo personal autorizado pueda registrarse.
-   **Rutas Protegidas**: Una vez que el usuario inicia sesión, todas las páginas del panel (como el resumen, proyecciones y ajustes) están protegidas. Si un usuario no autenticado intenta acceder, es redirigido automáticamente a la página de inicio de sesión.

### Panel Principal (Resumen Diario)

Esta es la página de bienvenida y el centro de operaciones diario del usuario.

-   **Saludo Personalizado**: La pantalla saluda al usuario por su nombre, extraído de su perfil de Google.
-   **Tarjeta de Periodo Activo**: Muestra el periodo de registro actual. Incluye una barra de progreso que compara las horas laboradas hasta el momento con el total de horas esperadas para ese periodo. Es un enlace directo a la página de detalle de ese periodo.
-   **Plan del Día (Proyección)**: Si el usuario ha planificado su jornada en la sección de "Proyecciones", una tarjeta especial mostrará la hora de entrada y salida proyectadas para el día actual.
    -   Esta tarjeta se actualiza dinámicamente: una vez que se registra la entrada real, la entrada proyectada desaparece, pero la salida proyectada permanece visible como recordatorio.
    -   La tarjeta completa desaparece una vez que se registra la salida real del día.
-   **Registro de Incidencias en Tiempo Real**:
    -   **Reloj y Fecha**: Muestra la hora actual y la fecha completa.
    -   **Selector de Ubicación**: Permite al usuario elegir el plantel donde está registrando su entrada o salida. La lista de ubicaciones se personaliza en la sección de Ajustes. También incluye una opción para "Otro (especificar)" si el lugar no está en la lista.
    -   **Botones de Registro**:
        -   **Registrar Entrada**: Se habilita al inicio del día. Una vez presionado, se deshabilita.
        -   **Registrar Salida**: Se habilita únicamente después de haber registrado una entrada.
        -   Ambos botones se deshabilitan si el día laboral ya está completo (entrada y salida registradas).
-   **Tabla de Eventos del Día**: Muestra una lista clara de la entrada y salida registradas, con su hora y ubicación. Cada registro se puede **editar** (para corregir la hora o ubicación) o **eliminar**.

### Proyecciones (Planificador)

Este módulo es una herramienta clave para la planificación y el cumplimiento de metas de horas.

-   **Selector de Periodo**: El usuario puede elegir cualquier periodo creado para visualizar o modificar su planificación.
-   **Resumen de Proyección**: Una tarjeta de estadísticas muestra un panorama completo:
    -   **Meta del Periodo**: Total de horas que se deben cubrir.
    -   **Horas Reales**: Suma de las horas ya trabajadas y registradas.
    -   **Total Proyectado**: Suma de las horas reales y las horas planificadas para los días futuros.
    -   **Balanza**: La diferencia entre el total proyectado y la meta del periodo, indicando si al final del periodo sobrarían o faltarían horas.
-   **Tabla de Planificación Semanal**:
    -   Muestra cada día laborable del periodo seleccionado.
    -   El usuario puede introducir la **hora y lugar de entrada/salida proyectadas** para los días futuros.
    -   Los días que ya tienen un registro real aparecen marcados y no se pueden modificar desde esta pantalla para proteger los datos históricos.
-   **Cargar Horario por Defecto**: Con un solo clic, el usuario puede rellenar toda la proyección con la plantilla de horario que haya marcado como activa, ahorrando tiempo de planificación.
-   **Guardar como Plantilla**: Si el usuario crea una planificación que podría querer reutilizar, puede guardarla como una nueva plantilla de horario directamente desde esta página.

### Gestión de Periodos

Se accede a través de `Ajustes > Periodos`.

-   **Creación de Periodos**: Los usuarios pueden crear nuevos periodos de registro (normalmente quincenales) especificando un nombre y un rango de fechas. El sistema calcula automáticamente el total de horas esperadas basándose en los días laborables (lunes a viernes, con opción de incluir sábados).
-   **Validación de Fechas**: El sistema impide crear periodos con fechas que se superpongan para evitar duplicidad de registros.
-   **Listado de Periodos**: Muestra todos los periodos creados, ordenados del más reciente al más antiguo.
-   **Acciones por Periodo**: Cada periodo tiene un menú de acciones que permite:
    -   **Ver Incidencias**: Navega a la página de detalle del periodo.
    -   **Realizar Proyección**: Navega a la página de proyecciones con ese periodo ya seleccionado.
    -   **Editar**: Permite cambiar el nombre y el rango de fechas de un periodo existente.
    -   **Eliminar**: Borra permanentemente un periodo y todos sus datos asociados.

### Detalle y Reporte de Periodo

Esta página ofrece una vista consolidada de un periodo completo.

-   **Resumen de Horas**: Muestra un resumen visual del progreso, incluyendo horas laboradas, horas restantes y la meta total del periodo.
-   **Descarga de Reporte CSV**: Una de las funciones más importantes. Permite descargar un archivo `.csv` con el detalle de todas las incidencias del periodo (fecha, día de la semana, horas y lugares de entrada/salida, y total de horas trabajadas por día). Este archivo es ideal para fines de reporte administrativo.
-   **Tabla de Incidencias**: Lista cada día del periodo.
    -   Para días pasados, se puede **editar** la hora o ubicación de la entrada/salida para corregir errores.
    -   Para días futuros, el botón de editar está deshabilitado y un mensaje emergente guía al usuario hacia la sección de **Proyecciones**, con un enlace directo para facilitar la planificación.

### Configuración Personalizada

El menú de `Ajustes` permite al usuario adaptar la aplicación a sus necesidades específicas.

#### Mis Ubicaciones

-   El usuario gestiona su lista personal de planteles o lugares de trabajo.
-   Puede añadir ubicaciones desde una lista maestra proporcionada por la institución y eliminarlas de su lista personal cuando ya no las necesite. Esta lista personalizada es la que aparece en los selectores de ubicación en toda la aplicación.

#### Plantillas de Horario

-   **Múltiples Plantillas**: El usuario puede crear varias plantillas de horario (ej. "Horario de Verano", "Horario Regular").
-   **Horario Activo**: Se puede seleccionar una plantilla como el "horario por defecto" o activo. Este es el horario que se usará para autocompletar las proyecciones.
-   **Editor de Horarios Completo**:
    -   Al crear o editar una plantilla, se abre un formulario que permite definir el horario para toda la semana.
    -   **Función de "Horario Rápido"**: Para agilizar la configuración, el usuario puede definir una hora de entrada/salida, un lugar, y aplicarlo a todos los días de la semana con un solo clic, con la opción de incluir o no los sábados.
    -   **Ajuste Individual**: Después de aplicar el horario rápido, se puede modificar cualquier día de forma individual.

### Gestión de Perfil

-   Permite al usuario ver la información de su cuenta, como su foto de perfil, nombre completo y correo electrónico, obtenidos de su cuenta de Google.
-   Incluye campos adicionales (actualmente desactivados o como placeholders) para futura información profesional.

---

## Despliegue y Arquitectura

-   **Dependencia de Firebase**: La aplicación está intrínsecamente ligada a los servicios de Firebase (Authentication y Firestore). No puede ser desplegada en un servidor diferente y funcionar de manera autónoma sin una reescritura significativa de la lógica de datos y autenticación.
-   **Portabilidad del Frontend**: A pesar de la dependencia del backend, el código del frontend (Next.js) puede ser alojado en cualquier plataforma compatible (como Vercel, Netlify, etc.), siempre y cuando se configuren las variables de entorno correctas para conectarse al proyecto de Firebase y se autorice el nuevo dominio en la consola de Firebase.