# Tecladito

Tecladito es una experiencia web pensada para que chicos y chicas descubran el teclado de forma visual, divertida y segura. La interfaz ocupa toda la pantalla durante el juego y mantiene las opciones de configuración fuera del alcance de pulsaciones accidentales.

## Modos de juego

| Modo | Edad orientativa | Experiencia |
| --- | --- | --- |
| **Preescolar** | 2–5 años | Cada tecla genera una letra grande, colorida y animada en distintas partes de la pantalla. |
| **Primeras palabras** | 6–7 años | Muestra la letra activa y permite formar palabras con una presentación clara y de gran tamaño. |
| **Escritura libre** | 8+ años | Ofrece una hoja rayada que crece y se desplaza automáticamente mientras se escribe. |

## Características

- Lectura de letras y números con audios en español latino incluidos en el proyecto.
- Sonidos de teclado para el modo de escritura libre.
- Opción para alternar entre mayúsculas, mayúsculas y minúsculas, sonido y silencio desde la pantalla de juego.
- Fondos clásico, espacial, oceánico y de bosque.
- Temas claro y oscuro basados en la identidad visual de Tecladito.
- Letras multicolores, animaciones y tamaño adaptado a cada etapa.
- Opción para conservar las letras en pantalla o hacer que desaparezcan automáticamente.
- Pantalla completa con una guía específica para habilitar `F11`.
- Diseño adaptable para computadoras, tablets y teléfonos.

## Controles para adultos

La configuración permanece oculta durante el juego. Para abrirla hay que mantener presionado el botón de ajustes durante tres segundos.

Teclas especiales como `Esc`, `Ctrl`, `Alt`, `Windows` y las teclas de función requieren una pulsación prolongada de tres segundos. Al completar el temporizador se habilitan todas las teclas especiales durante cinco segundos. Un indicador circular discreto muestra el avance de la pulsación.

> Los atajos administrados directamente por el sistema operativo, como `Alt + Tab` o la tecla Windows, no pueden bloquearse por completo desde una página web.

## Instalación como aplicación

Tecladito es una Progressive Web App (PWA). En navegadores compatibles puede instalarse desde el icono de la barra de direcciones o desde el menú del navegador. Una vez instalada se abre en una ventana independiente y puede iniciarse desde el escritorio o el menú de aplicaciones.

La aplicación incluye:

- Manifest con nombre, colores e iconos propios.
- Service worker que conserva la base de la aplicación y guarda localmente los recursos utilizados.
- Metadatos para instalarla en dispositivos móviles.

En iPhone o iPad se puede instalar desde **Compartir → Agregar a pantalla de inicio**.

## Tecnologías

- React 19
- TypeScript
- Vite 8
- CSS sin librerías de componentes
- Web Audio API y archivos de audio locales
- Web App Manifest y Service Worker
- Configuración de despliegue para Cloudflare

## Desarrollo local

Requisitos: una versión reciente de Node.js y npm.

```bash
npm install
npm run dev
```

Vite mostrará en la terminal la dirección local de desarrollo.

Para probar la versión de producción y el registro del service worker:

```bash
npm run build
npm run preview
```

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor local con recarga automática. |
| `npm run build` | Verifica TypeScript y genera la aplicación en `dist/`. |
| `npm run preview` | Sirve localmente el contenido compilado. |
| `npm run lint` | Ejecuta ESLint sobre el proyecto. |

## Despliegue

El archivo `wrangler.jsonc` configura `dist/` como directorio de recursos estáticos y habilita el fallback de Single Page Application. El proceso de despliegue debe ejecutar primero:

```bash
npm run build
```

Si Cloudflare está conectado al repositorio de GitHub, cada actualización de la rama configurada genera y publica una nueva versión automáticamente.

## Estructura principal

```text
src/
  App.tsx          Lógica de juego, modos y controles
  App.css          Componentes, animaciones y diseño adaptable
  themes.css       Variables de color para los temas claro y oscuro
public/
  audio/           Audios locales de letras y números
  icons/           Iconos de instalación de la PWA
  manifest.webmanifest
  sw.js
```

## Verificación antes de publicar

```bash
npm run lint
npm run build
```
