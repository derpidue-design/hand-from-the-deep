# Prototype Tooling and Implementation Notes

## Goal

This document defines the practical tooling and implementation requirements for the first playable prototype.

## Recommended development pipeline

### Engine / technology stack

Use a toolchain that supports:

- 3D or stylized 3D exploration
- narrative scripting
- state-driven systems
- UI overlays and status monitoring
- rapid iteration on environmental changes

Recommended production-friendly approach:

- one engine with proven narrative and world-building support
- modular scene scripting
- status system authored as data-driven state logic
- separate world-state and narrative-flag systems

## Required systems to build first

### 1. State system

Implement a central status manager that tracks:

- Zinwave Stability
- Emotional Flux
- Memory Integrity
- Continuity Fracture
- Deep Contamination
- Synchronization
- others as needed

This system should be accessible from both gameplay scripting and UI.

### 2. Narrative event system

The project needs a simple event system that triggers based on:

- region entry
- memory fragment collection
- status threshold crossing
- De’juir bond progression
- player choice outcomes

### 3. Save / state data layer

This should include:

- player progression flags
- chapter and scene states
- region states
- memory discovery flags
- relationship trust / synchronization data
- major choice outcomes

### 4. Environmental instability system

Add a logic layer where a region can mutate based on:

- status thresholds
- player decision outcomes
- event triggers
- memory discovery

### 5. Companion interaction system

Implement De’juir as a support actor with:

- dialogue prompts
- stabilization actions
- tactical support during pressure events
- narrative impact state

## Prototype scope checklist

### Essential tools and systems
- movement controller
- interaction system
- dialogue system
- status UI
- memory collection system
- state save system
- simple enemy or hazard prototype
- modular environment transition system

### Build tasks for first prototype
- create the Black Glass Chamber scene
- add one memory fragment and one objective
- implement first status condition changes
- add De’juir introduction and support action
- add Xevil encounter trigger
- create the transition into the next chapter region

## Production recommendation

Do not try to build the full world first. Build the first chapter and prove the gameplay loop before expanding into the Deep. The project should remain iterative and root itself in the strongest story beats.

## Implementation philosophy

This project must be built with systems thinking. The story is not enough. The game needs structured, data-driven systems that can support emotional narrative, world instability, and iterative expansion.
