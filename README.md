# HF GM Toolkit

HF GM Toolkit is an independent Windows desktop application for game masters running fantasy tabletop campaigns. It is built with Electron, React 19 and TypeScript, and consolidates campaign management, card-based encounter tools, encounter building, maps, audio and lore notes into a single offline tool. There is no backend, no account and no telemetry; all state is persisted locally.

## Features

- Campaign and session management with scenes, encounters and active cards.
- Adversary and Environment card library with editor and JSON import/export for user-provided or community-created data.
- Encounter builder based on battle points, with per-instance HP and stress tracking.
- Scene tracker with trigger flags and countdown clocks.
- World Wiki: renders a folder of Markdown notes from disk, with wikilinks, callouts, full-text search and note-linked map pins.
- Campaign map with pan/zoom, travel paths and pins.
- Player screen on a second display, with fog of war, image overlays and a live token counter.
- PC resource tracking: HP, stress, armour slots, evasion and damage thresholds per character.
- Dice tray with duality (hope/fear) rolls, d20, free-form notation and advantage/disadvantage, plus
  attack and damage roll buttons on cards.
- Audio hub combining a local music player and a soundboard, with five ambient loops bundled in the
  installer so it works before you add any audio of your own.
- GM tools with table notes and NPC name generator.
- Four themes, interface scaling, and UI in English and Spanish.
- Versioned JSON backup/restore with automatic pre-migration backups.
- Auto-update through GitHub Releases; downloads on confirm, installs on restart.

## Data persistence

All data is stored locally under the OS user-data directory (`%APPDATA%` on Windows). Audio, maps and images are stored as binary files; application state lives in a single JSON store written atomically with a debounced flush. Store schemas are versioned; migrations run automatically on startup and are preceded by a backup.

> [!WARNING]
> Uninstalling the application and removing its user data deletes all campaign information. Use **Export Data** (available in Settings and Campaigns) regularly.

## Development

```bash
git clone https://github.com/Vueko/HF-DMToolKit.git
npm install
npm run dev:electron   # Vite dev server + Electron main process
```

Additional scripts:

```bash
npm run test       # Vitest suite
npm run lint       # ESLint
npm run dist:win   # Windows NSIS installer, emitted to /release
```

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, Zustand 5 (persisted stores over IPC), Electron with context isolation and a validated IPC surface.

## Releases and updates

Installed builds query GitHub Releases on startup and prompt before downloading. To publish a release:

1. Increment `version` in `package.json` and add a section to `CHANGELOG.md`.
2. Run `npm run lint`, `npm run test` and `npm run dist:win`.
3. Create a public GitHub Release tagged `v<version>` (semver, e.g. `v1.1.0`).
4. Attach the installer `.exe`, `latest.yml` and the `.blockmap` produced in `/release`.

`latest.yml` is required; electron-updater reads it to detect the new version and verify the download.

> [!IMPORTANT]
> The version in `package.json` is what electron-updater compares against the running app. If it is
> not incremented, installed builds report "no update available" no matter what is published — the
> git tag alone has no effect.

## Contributing

Issues and pull requests are welcome. For anything beyond a bug fix, open an issue first to discuss the approach. Keep pull requests focused, run `npm run lint` and `npm run test` before submitting, and follow the existing code conventions. Corrections to the Spanish translation are also welcome; UI strings are defined in `src/i18n/translations.ts`.

## Notes

The project is intended for personal use at the game table. It has no backend and no cloud synchronization; the goal is a fast tool with no external dependencies.

As an open source project, the code may be used as a base for building similar tools. Please respect the licenses and rights of any game systems or content you use with it.

The MIT license covers the source code only. The bundled ambient audio in `resources/sounds` keeps the license of its original authors; see `resources/sounds/CREDITS.md` for attribution and licensing status.

HF GM Toolkit is independent and unofficial. Daggerheart™ Compatible. It is not published, sponsored, approved, or endorsed by Darrington Press or Critical Role. Terms and license information: https://darringtonpress.com/license/
