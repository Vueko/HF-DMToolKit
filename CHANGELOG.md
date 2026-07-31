# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The `version` field in `package.json` is the source of truth: electron-builder writes it into
`latest.yml`, and electron-updater compares it against the running app. It must be incremented
for every release or existing installs will never detect the update.

## [1.1.0] - 2026-07-29

### Added

- **PC Resources** page: per-character tracking of HP, stress, armor slots, evasion and damage
  thresholds (major/severe), with player names and notes.
- **Dice Tray**: duality rolls with hope/fear tone and outcome, d20 rolls, free-form dice notation,
  advantage/disadvantage, and a capped roll history.
- Roll buttons directly on adversary and environment cards, covering attack modifiers, damage
  notation and critical damage.
- **Audio Hub** at `/audio`, unifying the music player and soundboard into one page with tabs.
  `/music` and `/soundboard` now redirect there and keep working as bookmarks.
- Five ambient loops bundled with the installer, so the soundboard is usable with no user-supplied
  audio: dungeon drone, forest, rain, snowstorm and thunderstorm.
  See `resources/sounds/CREDITS.md` for attribution status.
- Soundboard pads with an icon picker and a per-sound edit dialog.
- World Wiki now renders PDF, DOCX and image files from the vault, not just Markdown.
- Session items in the campaign store, grouped for display in the session view.

### Changed

- Scene Tracker rewritten; countdown logic extracted into its own tested module.
- Sidebar navigation reorganised around the new Audio Hub and PC Resources entries.
- Electron main process split into focused, unit-tested modules for bundled-audio path
  resolution, window security policy and the persisted store key whitelist.

### Removed

- Legacy DM Screen page, superseded by the dashboard.

### Fixed

- Auto-update was configured to publish to a GitHub repository that does not exist
  (`Vueko/HF-GM-Toolkit`), so every update check failed. Now points at `Vueko/HF-DMToolKit`.
- `version` had remained `0.1.0` across the `v0.1.0`, `v1.0` and `v1.00` tags, which made it
  impossible for electron-updater to ever detect a newer release.
- Installer artifact name now includes the version and no longer contains spaces.

## Earlier releases

Releases tagged `v1.00`, `v1.0` and `v0.1.0` predate this changelog.
