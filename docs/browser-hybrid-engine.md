# Browser Hybrid Engine Pass

## What changed

The playable slice now has a browser-native hybrid shell around the canvas game:

- local continuity save and restore
- automatic save every ten seconds during play
- persistence before the browser tab closes
- installable web-app metadata
- service-worker asset caching when served over HTTP(S)
- explicit creator-facing origin attribution in the playable page

## How to play

Open `index.html` directly for the game. For save persistence and offline caching, serve the repository with a local web server, for example:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Continuity controls

- **Save Continuity** stores the current scene, player position, statuses, flags, and choice in browser local storage.
- **Restore Continuity** returns to the last stored state.
- The game also saves automatically during play and before the page closes.

## Hybrid direction

The project remains a browser-based playable slice while gaining engine-like layers:

1. Canvas runtime for movement, scenes, enemies, and status simulation.
2. Browser shell for persistence, installability, and future menus.
3. Data-driven save state that can later expand into multiple slots.
4. Service-worker cache for an offline-capable prototype.

## Next build pass

- split scene content and status definitions into JSON data
- add multiple continuity slots
- add touch and controller input
- add a Chapter 2 region and transition from the surviving signal
- add authored pixel-art assets and audio without changing the canon
