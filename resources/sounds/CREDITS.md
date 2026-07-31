# Bundled audio — attribution

The five `.ogg` ambient loops in this folder are shipped inside the installer (via
`extraResources` in `package.json`) and are redistributed to every user. The MIT licence in this
repository covers the **source code only** — it does not cover these audio files, which keep the
licence of their original author.

> [!IMPORTANT]
> **The licence column below is unverified.** The table records only the author/title metadata
> embedded in each file's Vorbis comments. Nothing here has been confirmed against an original
> source page. Confirm the source and licence of every file — and add the required attribution
> text — before distributing a public release. Files whose licence cannot be established should be
> replaced with a known-free equivalent (CC0 or public domain) rather than shipped.

| File | Embedded title | Embedded author | Source | Licence |
|---|---|---|---|---|
| `dungeon-drone.ogg` | dark-dyne-master | John Bartmann | *unconfirmed* | *unconfirmed* |
| `forest.ogg` | *(no metadata)* | *(no metadata)* | *unconfirmed* | *unconfirmed* |
| `rain.ogg` | Rain against the Window | Cori Samuel | *unconfirmed* | *unconfirmed* |
| `snowstorm.ogg` | *(no metadata)* | *(no metadata)* | *unconfirmed* | *unconfirmed* |
| `thunderstorm.ogg` | Rain and thunder | Ezwa | *unconfirmed* | *unconfirmed* |

## Removed

`campfire.ogg` (Barbecue / Aldor), `cave.ogg` (drip coffee maker dripping / Hugh) and
`tavern.ogg` (Restaurant Ambience / Stephan) were dropped before the 1.1.0 release because their
provenance could not be established. Do not restore them without a confirmed source and licence.

## Notes for verification

- Three of the five remaining files were encoded with `ffmpeg2theora-0.29`, and the author fields
  are single usernames. That pattern is typical of Wikimedia Commons uploads, so Commons is the most
  likely place to start looking — but the one title checked so far (*Rain and thunder*) is credited
  on Commons to a different user than the file's `ARTIST` tag, so the match is **not** reliable.
- `forest.ogg` and `snowstorm.ogg` carry no metadata at all and give no lead to work from.
- Licence terms matter to how they must be credited: CC0 and public-domain files need no notice,
  CC BY requires naming the author, and CC BY-SA additionally requires that the audio be
  redistributed under the same licence.
- Once confirmed, fill in the source URL and licence per row, and surface the credits in the app
  (the About panel in Settings is the natural place).

## Adding new sounds

Filenames must match `^[a-z0-9-]+\.(ogg|mp3)$` — the main process validates against that pattern
before resolving a bundled path (see `electron/builtinAudio.ts`). Register the file in
`src/audio/builtinSounds.ts` and add its display name to `src/i18n/translations.ts`.
