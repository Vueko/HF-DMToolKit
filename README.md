# HF DM ToolKit

## ¿Qué es?
Una herramienta de ayuda para cualquier DM que quiera empezar su partida de DaggerHeart. Esta aplicación ayuda a centralizar notas, mapas, música y el apartado de cartas que caracteriza a este juego de rol en una sola pantalla.

## Características
* **Gestión de Campañas:** Cada campaña contiene sus propias sesiones y escenarios de manera independiente.
* **Sistema de Cartas:** Gestión y generador interactivo de *Adversary Cards* y *Environment Cards*.
* **Mapas Interactivos:** Carga de imágenes para tus mapas con soporte para pines interactivos, ideal para ayudar a tus PCs a visualizar el recorrido que han llevado.
* **World Wiki:** Un sistema de carpetas para contener todo el Lore que necesites en tus partidas. Cuenta con soporte para texto enriquecido (Markdown) y un espacio definido para guardar secretos que solamente quieres que tus ojos vean.
* **Reproductor de Música Local:** Manejo de audio a través de playlists con categorización por ambiente (*Moods*) para transiciones rápidas y fluidas en la mesa de juego.
* **Herramientas del DM:** Tracker integrado de *Fear* y *Hope*, un apartado de referencia rápida para reglas y dificultades, así como soporte para contenido *homebrew*.
* **Portabilidad:** Exportación e importación mediante archivos JSON para trasladar el estado de tus campañas entre distintos dispositivos.

## Persistencia de Datos
La aplicación está pensada para ser **Offline First**. La mayoría del texto y configuraciones se guardan dentro del `localStorage` de tu navegador, exceptuando las imágenes y la música, las cuales viven de forma segura dentro de `IndexedDB` para no consumir la memoria de texto.

> [!WARNING]
> **Alerta de Datos:** Si se llega a borrar la caché o los datos del navegador de forma manual, se perderá la información de la campaña. Es altamente recomendable utilizar el botón de **Exportar Datos** de manera regular.

## Instalación y Uso

Para correr el proyecto en tu máquina local, ejecuta los siguientes comandos en tu terminal:

```bash
# 1. Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]

# 2. Instalar las dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev

# 4. Compilar para producción (Opcional)
npm run build
```

## Notas
El proyecto está pensado para ser ejecutado de manera local. No cuenta con soporte para backend ni bases de datos externas en la nube; el objetivo es ser una herramienta ágil de uso personal.

Siendo un proyecto *Open Source*, se puede usar el código como base para crear herramientas similares. Sin embargo, se pide amablemente que se respete la licencia y se den los créditos correspondientes a los autores originales del juego.

> **DaggerHeart** es una propiedad intelectual de *Darrington Press / Critical Role*.

## RoadMap (Posiblemente)
- [ ] Soporte de múltiples idiomas (Inglés, Español).
- [ ] Traslado a aplicación nativa de escritorio (Tauri).
- [ ] Generación de encuentros.