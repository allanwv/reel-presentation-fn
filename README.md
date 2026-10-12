# Fitnode — Reel Presentation (`reel-presentation-fn`)

Proyecto de presentación en video y reel interactivo para **Fitnode**, desarrollado con [HyperFrames](https://hyperframes.dev) y GSAP.

## Estructura del Proyecto

- **`reel-01/`**: Composición principal de HyperFrames (`index.html`), assets optimizados, estilos CSS, timeline GSAP y scripts de render/preview.
  - `output/`: Renders finales y previews en video MP4.
  - `completion-proof/`, `yaw-proof/`, etc.: Pruebas visuales, contact sheets y validaciones de animación.
- **`assets/`**: Logotipos oficiales de Fitnode (versiones light, dark, svg, transparentes).
- **`source/`**: Grabaciones en pantalla de la app, capturas UI originales (`Components/`, `screenshots/`, `videos/`).
- **`references/`**: Referencias visuales de movimiento y motion graphics.
- **`.agents/`**: Skills y flujos de trabajo especializados configurados para HyperFrames y edición.

## Requisitos y Uso

Para previsualizar o compilar el reel:

```bash
cd reel-01

# Previsualización interactiva local
npm run dev

# Validación de linting, layouts, timings y contrastes
npm run check

# Renderizar a video MP4 final
npm run render
```
