# HF DM ToolKit

## ¿Qué es?
Una aplicación de escritorio para DMs que quieran llevar sus partidas de DaggerHeart desde un solo lugar. Centraliza notas, mapas, música y el sistema de cartas característico del juego, corriendo de forma nativa en Windows sin necesidad de navegador.

## Características
* **Gestión de Campañas:** Cada campaña contiene sus propias sesiones y escenarios de manera independiente.
* **Sistema de Cartas:** Gestión y generador interactivo de *Adversary Cards* y *Environment Cards*.
* **Mapas Interactivos:** Carga de imágenes para tus mapas con soporte para pines interactivos y niebla de guerra configurable.
* **World Wiki:** Sistema de carpetas para todo el Lore de tu campaña, con soporte para texto enriquecido (Markdown) y un espacio definido para secretos solo visibles al DM.
* **Reproductor de Música Local:** Manejo de audio con playlists categorizadas por ambiente (*Moods*) para transiciones rápidas en la mesa de juego.
* **Herramientas del DM:** Tracker de *Fear* y *Hope*, referencia rápida de reglas y dificultades, constructor de encuentros y soporte para contenido *homebrew*.
* **Pantalla de Jugador:** Segunda ventana proyectable en un monitor externo con control de mapa, niebla de guerra, overlays y contador de *Fear* en tiempo real.
* **Portabilidad:** Exportación e importación mediante archivos JSON para trasladar el estado de tus campañas entre dispositivos.

## Persistencia de Datos
La aplicación guarda todos los datos de forma **local** en el directorio de usuario del sistema operativo (`%APPDATA%`). Las imágenes y archivos de audio se almacenan en disco; el resto de la configuración en un archivo JSON. No se requiere conexión a internet ni cuenta de ningún tipo.

> [!WARNING]
> **Alerta de Datos:** Si se desinstala la aplicación y se borran los datos de usuario, se perderá la información de la campaña. Se recomienda usar el botón de **Exportar Datos** de manera regular.

## Instalación y Uso

### Desarrollo

```bash
# 1. Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]

# 2. Instalar las dependencias
npm install

# 3. Iniciar en modo desarrollo (Vite + Electron)
npm run dev:electron
```

### Distribución (Windows)

```bash
# Genera el instalador en /release
npm run dist:win
```

## Notas
El proyecto está pensado para uso personal en mesa de juego. No cuenta con backend ni sincronización en la nube; el objetivo es ser una herramienta ágil y sin dependencias externas.

Siendo un proyecto *Open Source*, se puede usar el código como base para crear herramientas similares. Se pide amablemente que se respete la licencia y se den los créditos correspondientes a los autores originales del juego.

> **DaggerHeart** es una propiedad intelectual de *Darrington Press / Critical Role*.

## RoadMap (Posiblemente)
- [ ] Soporte de múltiples idiomas (Inglés, Español).
- [ ] Distribución para macOS y Linux.
- [ ] Sincronización opcional de campañas entre dispositivos.
