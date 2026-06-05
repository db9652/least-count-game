# Implementation Plan - Mid-Game Rules Popup & Documentation

We want to add a feature to look into rules mid-game by adding a "Gameplay Rules" button in the bottom-right corner of the game board. This button will trigger a modal popup showing the game rules. At the same time, we will document the rules and this plan in `RulesOfGame.md` and `ImplementationPlan.md` in the project root, and push them to the repository.

---

## Proposed Changes

### 1. Documentation
#### [NEW] [RulesOfGame.md](file:///home/deepblue/ai/least-count/RulesOfGame.md)
* Define the rules of the Least Count card game in markdown format, detailing card values, turn flows, skip draw rules, and scoring penalties.

#### [NEW] [ImplementationPlan.md](file:///home/deepblue/ai/least-count/ImplementationPlan.md)
* Save this design and implementation plan directly to the root of the project.

---

### 2. Frontend Components
#### [MODIFY] [GameBoard.tsx](file:///home/deepblue/ai/least-count/client/src/components/GameBoard.tsx)
* Add local state `isRulesOpen` (boolean) to control the visibility of the rules popup.
* Add a floating action button at the bottom-right of the screen labeled "Gameplay Rules".
* Implement a modal overlay popup displaying:
  * **Objective & Setup**
  * **Card Values** (e.g. Ace = 1, face cards = 10)
  * **Turn Flow** ("Discard First, Draw Next", matching-rank rules)
  * **Skip Draw Rule**
  * **Declaring Show & Resolution scoring/penalties**
* Style the modal with a scrollable content area, backdrop blur, and a close button.

#### [MODIFY] [App.css](file:///home/deepblue/ai/least-count/client/src/App.css)
* Create styling rules for:
  * `.rules-floating-btn`: Positioned fixed/absolute at `bottom: 2rem; right: 2rem;` (or relative to the game board area so it doesn't overlap the player's hand).
  * `.rules-modal-overlay` / `.rules-modal-content`: Standard modal backdrop blur and layout centering.
  * `.rules-section` / `.rules-list`: Clean typography and spacing matching the existing dark glassmorphism theme.

---

## Verification Plan

### Manual Verification
1. Open the game board page at `http://localhost:5173/least-count/` (or via Tailscale/domain).
2. Start a local multiplayer match or lobby.
3. Locate the "Gameplay Rules" button in the bottom-right area.
4. Click the button to confirm the modal opens with a smooth fade/slide transition, displaying readable, structured rules.
5. Click "Close" or click the background overlay to dismiss the popup.
6. Verify that files `RulesOfGame.md` and `ImplementationPlan.md` exist in the project root and are checked into Git.
