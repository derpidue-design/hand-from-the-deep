# Hand from the Deep — Playable Build Status

## Current status

The project has a playable browser vertical slice and now includes the packaging configuration for a user-friendly desktop build.

### Available now

- browser-playable opening slice
- movement and interaction
- Zero2, De’juir, and Xevil story flow
- live status mechanics
- memory and continuity progression
- browser save / restore controls
- installable web metadata
- Electron desktop wrapper configuration
- Windows installer and portable build configuration

### Not yet complete

- a committed prebuilt `.exe` release artifact
- full Chapter 1 content
- all three story parts as playable chapters
- finished art, audio, combat, and menu systems
- production QA and release testing

## Build readiness

The next person with Node.js installed can create the Windows build using:

```bash
npm install
npm run build:win
```

This is the shortest route to a double-clickable startup game while keeping the browser version available.
