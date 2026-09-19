# Playable Prototype Build Notes

## What is now playable

The repository now contains a dependency-free browser prototype of the opening vertical slice. Open `index.html` in a browser or serve the repository with any static web server.

## Controls

- WASD / arrow keys: move Zero2
- E: interact with diagnostic nodes, De’juir, memory fragments, and the Deep node
- Space: activate the Zinwave pulse during the Xevil encounter
- R: restart the slice

## Implemented game loop

1. Awakening in the Black Glass Chamber
2. Diagnostic interaction with the Zinwave node
3. First meeting with De’juir
4. Memory fragment recovery
5. Xevil pressure event
6. Status-driven Zinwave pulse
7. Choice to continue toward the signal
8. Ending hook: “We see you.”

## Implemented status behavior

The prototype includes live values for:

- Zinwave Stability
- Emotional Flux
- Memory Integrity
- Continuity Fracture
- Deep Contamination
- Synchronization / Anti-Drift Anchoring

Statuses change from exploration, memory recovery, Xevil’s pressure, De’juir’s support, and the Zinwave pulse.

## Next engineering pass

- replace placeholder geometry with authored pixel-art tiles
- add audio and screen-shake feedback
- move scene content into data files
- add enemy collision and a reusable encounter manager
- add local save/load for status and story flags
- add Chapter 2 region after the signal ending
- add touch/controller support

## Attribution

The prototype is based on the original Hand from the Deep story canon created for this project by derpidue-design. The game code is an adaptation layer intended to preserve and expand that source into a playable world.
