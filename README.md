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

## Tecnologías Utilizadas

-   **Framework Frontend**: Next.js 15 (con App Router)
-   **Lenguaje**: TypeScript
-   **UI y Componentes**: ShadCN UI (basado en Radix UI), Tailwind CSS
-   **Backend y Base de Datos**: Firebase (Authentication, Cloud Firestore)
-   **Integraciones**: Google OAuth 2.0, Google Sheets API
-   **Gestión de Estado**: React Context API
-   **Formularios**: React Hook Form con Zod para validación
-   **Fechas**: date-fns
-   **Gráficos**: Recharts
-   **Iconos**: Lucide React
-   **PWA**: Next-PWA para funcionalidad offline
-   **Otras**: UUID para identificadores únicos, clsx y tailwind-merge para clases CSS

---

## Estructura del Proyecto

```
src/
├── app/                          # Páginas y layouts (Next.js App Router)
│   ├── api/auth/google/callback/ # Callback de autenticación Google
│   ├── dashboard/                # Páginas del dashboard
│   │   ├── layout.tsx            # Layout del dashboard con navegación
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── period/[id]/page.tsx  # Detalle de período
│   │   ├── profile/page.tsx      # Perfil de usuario
│   │   ├── projections/page.tsx  # Proyecciones
│   │   ├── schedules/page.tsx    # Configuración de horarios
│   │   └── settings/page.tsx     # Configuración general
│   ├── globals.css               # Estilos globales
│   ├── layout.tsx                # Layout raíz
│   └── page.tsx                  # Página de inicio/login
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base de UI (ShadCN)
│   ├── add-period-dialog.tsx     # Diálogo para agregar período
│   ├── auth-guard.tsx            # Guardia de autenticación
│   ├── daily-log.tsx             # Registro diario de incidencias
│   ├── edit-period-dialog.tsx    # Diálogo para editar período
│   ├── header.tsx                # Cabecera de la aplicación
│   ├── icons.tsx                 # Iconos personalizados
│   ├── incident-types-settings.tsx # Configuración de tipos de incidencia
│   ├── loading-screen.tsx        # Pantalla de carga
│   ├── locations-settings.tsx    # Configuración de ubicaciones
│   ├── nav.tsx                   # Navegación
│   ├── periods-list.tsx          # Lista de períodos
│   ├── schedules-settings.tsx    # Configuración de horarios
│   └── ui/                       # Componentes UI (completo set de ShadCN)
├── context/
│   └── settings-context.tsx      # Contexto global de configuración y estado
├── hooks/                        # Hooks personalizados
│   ├── use-mobile.tsx            # Hook para detectar dispositivo móvil
│   ├── use-sync-period.tsx       # Hook para sincronizar períodos
│   └── use-toast.ts              # Hook para notificaciones toast
└── lib/                          # Utilidades y configuraciones
    ├── actions.ts                # Acciones del servidor (Next.js)
    ├── firebase.ts               # Configuración de Firebase
    ├── google-oauth-client.ts    # Cliente OAuth de Google
    ├── google-sheets-actions.ts  # Acciones para Google Sheets
    ├── types.ts                  # Definiciones de tipos TypeScript
    └── utils.ts                  # Utilidades generales
```

---

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta de Google Cloud Platform
- Proyecto de Firebase

### Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd IncidenciasAdministrativas
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

   # Google OAuth (para Google Sheets)
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Opcional: Modo desarrollo (simula usuario logueado)
   NEXT_PUBLIC_DEV_MODE_USER_ID=dev-user-id
   ```

### Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita Authentication con Google provider.
3. Configura Firestore Database.
4. En Authentication > Settings > Authorized domains, agrega tu dominio local (`localhost`) y de producción.
5. Copia las credenciales de Firebase al archivo `.env.local`.

### Configuración de Google OAuth

Sigue los pasos detallados en la sección "Obtención de Credenciales de Google OAuth 2.0" más abajo.

### Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo en puerto 9002
- `npm run build`: Construye la aplicación para producción
- `npm run start`: Inicia el servidor de producción
- `npm run lint`: Ejecuta ESLint
- `npm run typecheck`: Verifica tipos con TypeScript

---

## Funcionalidades Detalladas

A continuación se detalla el funcionamiento de cada módulo de la aplicación.

### 1. Autenticación Inteligente y Segura

El acceso a la aplicación está restringido y protegido mediante **Firebase Authentication**, usando un método de inicio de sesión moderno y seguro.

-   **Inicio de Sesión con Google (Popup):** Los usuarios acceden utilizando su cuenta de Google a través de una ventana emergente, lo que evita recargas de página y ofrece una experiencia fluida.
-   **Restricción de Dominio:** El sistema está configurado para aceptar únicamente cuentas de un dominio institucional específico (ej. `@une.edu.mx` o `@universidad-une.com`), asegurando que solo personal autorizado pueda registrarse.
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

-   **Selector de Periodo:** Elige cualquier periodo creado para visualizar o modificar su planificación. Por defecto, mostrará el periodo activo actual.
-   **Tarjeta de Estadísticas de Proyección:** Un resumen financiero de tu tiempo.
    -   **Meta del Periodo:** Total de horas que debes cubrir.
    -   **Horas Reales:** Suma de las horas ya trabajadas.
    -   **Total Proyectado:** Suma de las horas reales y las horas planificadas para días futuros.
    -   **Balanza:** La diferencia entre el total proyectado y la meta, indicando con colores si te sobran (verde) o te faltan (rojo) horas.
-   **Tabla de Planificación Semanal:**
    -   Muestra cada día laborable del periodo. Los días ya completados (con entrada y salida real) se marcan con un **sombreado verde** para distinguirlos.
    -   El **día actual** está marcado con un **punto animado** para encontrarlo fácilmente.
    -   Puedes introducir la **hora y lugar de entrada/salida proyectadas** para los días futuros. Los campos se deshabilitan inteligentemente a medida que registras tus incidencias reales, mostrando siempre el dato real si existe.
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

-   **Creación de Periodos:** Crea nuevos periodos de registro (normalmente quincenales) con nombre, rango de fechas y la opción de incluir o no los sábados en el cálculo de horas.
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

## Arquitectura y Dependencia Crítica de Firebase

Es **crucial** entender que esta aplicación está diseñada con una **arquitectura profundamente integrada con los servicios de Google Firebase**. No es una aplicación que simplemente *usa* Firebase para autenticarse; su núcleo funcional depende de ello.

### ¿Por qué esta dependencia?

*   **Seguridad y Simplicidad:** Usamos **Firebase Authentication** para gestionar las sesiones de usuario de forma segura y sin complicaciones.
*   **Persistencia de Datos por Usuario:** La base de datos, **Cloud Firestore**, está estructurada para que cada pieza de información (tus periodos, horarios, ubicaciones, etc.) se guarde en un "documento" que pertenece exclusivamente a tu usuario. Tu ID de usuario de Firebase (`uid`) es la llave que abre acceso a tus datos.

### Componentes Clave con Dependencia Directa:

1.  **`src/context/settings-context.tsx` (El Cerebro de la App):**
    *   Este archivo es el componente más crítico. Gestiona el estado global de la aplicación.
    *   Utiliza `onAuthStateChanged` de Firebase para saber quién eres y si has iniciado sesión.
    *   Todas las operaciones de **lectura y escritura** de datos (tus periodos, horarios, etc.) se realizan directamente contra la base de datos Firestore, usando tu ID de usuario (`uid`) para encontrar tus datos específicos.

2.  **`src/components/auth-guard.tsx` (El Guardián):**
    *   Este componente envuelve todas las páginas del panel principal.
    *   Su única función es verificar si tienes una sesión activa en Firebase. Si no la tienes, te redirige a la página de inicio. Sin Firebase, no hay cómo proteger las rutas.

3.  **`src/app/page.tsx` (La Puerta de Entrada):**
    *   Implementa la lógica de `signInWithPopup` de Firebase para el inicio de sesión con tu cuenta de Google.

### ¿Puedo Desplegarla en Otro Servidor (ej. Vercel)?

*   **Sí, pero siempre conectada a Firebase.** Puedes alojar el *frontend* (el código de Next.js) en cualquier plataforma moderna como Vercel, Netlify o tu propio servidor. Sin embargo, esta instancia **siempre deberá conectarse a tu proyecto de Firebase** para funcionar. Para ello, necesitas dos cosas:
    1.  **Configurar las Variables de Entorno:** En la configuración de tu servidor (ej. en Vercel), debes añadir las mismas variables de entorno `NEXT_PUBLIC_FIREBASE_*` que usas en desarrollo.
    2.  **Autorizar el Dominio:** En la Consola de Firebase, dentro de la sección de "Authentication", debes añadir el dominio que tu proveedor de hosting (ej. Vercel) le asigne a tu aplicación en la lista de "Dominios autorizados".

### ¿Qué se puede hacer con la autenticación?

Si el sistema de autenticación de Firebase genera problemas, existen varias alternativas, de la más simple a la más compleja:

1.  **Optimizar la Configuración Actual (Recomendado):** Muchos problemas de autenticación se deben a configuraciones en la Consola de Firebase (como dominios no autorizados). Revisar y ajustar estas configuraciones suele ser la solución más rápida. La app ya está preparada para restringir el login a un dominio específico (ej. `@universidad-une.com`), lo cual es una práctica de seguridad robusta.

2.  **Añadir otros Proveedores de Firebase:** Si el problema es la dependencia exclusiva de Google, Firebase facilita añadir otros métodos de inicio de sesión (Correo/Contraseña, Microsoft, etc.). Esto requeriría cambios en la interfaz de login, pero no alteraría la arquitectura central, ya que la gestión de datos seguiría dependiendo del `uid` de Firebase.

3.  **Reemplazar Firebase Authentication por Completo (Alta Complejidad):** Esta es una **modificación arquitectónica mayor**. Implicaría:
    *   **Elegir un nuevo proveedor** (ej. Auth0, Clerk) o construir un sistema propio con JWT.
    *   **Reescribir por completo la lógica de acceso a datos** en `src/context/settings-context.tsx`. Dado que todos los datos en Firestore están ligados al `uid` de Firebase, habría que idear una estrategia para migrar o mapear los datos a los nuevos identificadores de usuario.
    *   **Implementar una nueva interfaz de usuario** para el registro e inicio de sesión.

En resumen, aunque "omitir Firebase" no es una opción sin una reescritura significativa, la aplicación es flexible. Se puede desplegar en cualquier servidor moderno y se puede adaptar a diferentes métodos de autenticación si es necesario, aunque la ruta más sencilla suele ser optimizar la configuración existente.

---

### **Obtención de Credenciales de Google OAuth 2.0 (Para Google Sheets)**

Como se explicó anteriormente, el `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son credenciales **para toda la aplicación**, no para cada usuario. Son la forma en que tu aplicación se identifica ante Google.

Sigue estos pasos para obtenerlas:

1.  **Ir a la Consola de Google Cloud:**
    *   Abre la [Consola de Google Cloud](https://console.cloud.google.com/).
    *   Asegúrate de tener seleccionado el proyecto de Google Cloud asociado a tu proyecto de Firebase.

2.  **Habilitar la API de Google Sheets:**
    *   En el menú de navegación, ve a **APIs y Servicios > Biblioteca**.
    *   Busca "Google Sheets API" y selecciónala.
    *   Haz clic en el botón **Habilitar**. Si ya está habilitada, puedes omitir este paso.

3.  **Configurar la Pantalla de Consentimiento (OAuth Consent Screen):**
    *   En el menú de navegación, ve a **APIs y Servicios > Pantalla de consentimiento de OAuth**.
    *   Selecciona el tipo de usuario **Externo** y haz clic en "Crear".
    *   **Rellena la información de la aplicación:**
        *   **Nombre de la aplicación:** El nombre que verán los usuarios cuando pidan permiso (ej. "Sistema de Gestión de Incidencias").
        *   **Correo electrónico de asistencia al usuario:** Tu correo electrónico.
    *   En "Dominios autorizados", añade el dominio de tu aplicación si ya la tienes desplegada (ej. `mi-app.com`).
    *   Añade tu correo en la sección de "Información de contacto del desarrollador". Haz clic en "Guardar y continuar" en los siguientes pasos hasta volver al panel.

4.  **Crear las Credenciales (ID de Cliente de OAuth):**
    *   En el menú de navegación, ve a **APIs y Servicios > Credenciales**.
    *   Haz clic en **+ CREAR CREDENCIALES** y selecciona **ID de cliente de OAuth**.
    *   En "Tipo de aplicación", elige **Aplicación web**.
    *   Dale un nombre (ej. "Cliente Web de Incidencias").
    *   **Configuración Crítica - URIs de redireccionamiento autorizados:** Aquí debes añadir las URLs a las que Google redirigirá al usuario después de que conceda el permiso. Añade las siguientes dos:
        *   `http://localhost:9002/api/auth/google/callback` (para tu entorno de desarrollo local).
        *   `https://[TU_DOMINIO_DE_PRODUCCION]/api/auth/google/callback` (reemplaza `[TU_DOMINIO_DE_PRODUCCION]` con la URL real donde desplegarás la aplicación).
    *   Haz clic en **Crear**.

5.  **Obtener y Usar las Credenciales:**
    *   Aparecerá una ventana emergente con tu **ID de cliente** y tu **Secreto de cliente**.
    *   Copia estos dos valores.
    *   Pégalos en tu archivo `.env` en la raíz del proyecto:
        ```env
        GOOGLE_CLIENT_ID="tu-id-de-cliente-aqui.apps.googleusercontent.com"
        GOOGLE_CLIENT_SECRET="GOCSPX-tu-secreto-de-cliente-aqui"
        ```

6.  **Reiniciar el Servidor:**
    *   Detén tu servidor de desarrollo (si está en ejecución) y vuelve a iniciarlo con `npm run dev` para que lea las nuevas variables de entorno.

Con estos pasos, tu aplicación estará correctamente identificada ante Google y lista para que los usuarios puedan autorizar la sincronización con sus cuentas de Google Sheets de manera individual y segura.
