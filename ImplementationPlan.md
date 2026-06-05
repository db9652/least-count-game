# Project Implementation Plan - Least Count Multiplayer Game

This document outlines the complete architecture, implementation details, communication flow, and customizable gameplay rules for the **Least Count** real-time multiplayer card game.

---

## 1. System Architecture
The application is structured as a decoupled monorepo containing a React-based client and a Node.js-based server, running concurrently in development and production environments.

### 1.1 Backend Engine (Node.js + Express + Socket.io)
* **Express Server**: Simple hosting instance configured with CORS to permit cross-origin development connections.
* **Socket.io WebSocket Layer**: Serves as the primary communication medium, handling bidirectional, real-time event distribution.
* **Game Manager (`GameRoom` class)**: 
  * Orchestrates the active state of each distinct lobby.
  * Controls the phase lifecycle (`DISCARD` ➔ `DRAW` ➔ `ROUND_END`).
  * Manages game rules execution (creating decks, shuffling, dealing, validating multi-card discards of matching ranks, calculating hand values, checking skip-draw triggers, and resolving "Show" declarations with penalties).
  * Stores session rooms in-memory with automatic cleanup upon player disconnection.

### 1.2 Frontend Application (React + Vite + TypeScript)
* **State Orchestrator (`App.tsx`)**: Controls screen routing (Welcome Screen ➔ Lobby ➔ Active Game Table ➔ Round-End Scoreboard) based on state events received from the WebSocket layer.
* **Real-time Synchronization (`socket.ts`)**: Establishes connections, automatically resolving ports and hostnames to route WebSocket requests through HTTP/HTTPS or Cloudflare Tunnel pathways.
* **UI Components**:
  * **Lobby**: Displays joined players, room codes, customizable settings, and control actions.
  * **GameBoard**: Layout of the active card table with opponent rings, card piles, history logs, player hands, and drag-and-drop support.
  * **Card**: Represents a playing card with suit-based styling, custom joker patterns, hover transitions, and selection logic.
  * **Scoreboard**: Displays round-end hand reveals, scores, penalties, and game-over standings.

---

## 2. Key Gameplay Features Implementation

### 2.1 "Discard First, Draw Next" Game Loop
* When it is a player's turn, they start in the `DISCARD` phase. The client displays buttons to discard selected cards or declare a Show.
* Once they select cards of matching rank and click discard, the client emits a `discard` event.
* The server validates the action, removes the cards from their hand, places them on the discard pile, checks if a skip draw was achieved, and either advances the turn or transitions the phase to `DRAW`.
* In the `DRAW` phase, the player clicks either the Draw Pile or the Discard Pile to draw a card, which ends their turn.

### 2.2 Dynamic Local Card Reordering
* Players can customize their card layout by dragging and dropping cards to place identical ranks next to each other.
* Built using native HTML5 drag-and-drop APIs.
* The client maintains an `orderedHand` state synchronizing with server updates. If cards are drawn or discarded, the state adapts without resetting the player's custom ordering.

### 2.3 Single-Domain Path-Based WebSocket Routing
* To facilitate routing via reverse proxies (like Cloudflare Tunnel) without requiring open custom ports:
  * Both client and server utilize a custom WebSocket path: `/least-count/socket.io`.
  * Allows a domain name proxy to forward normal HTTP traffic to Vite (port `5173`) and path-based WebSocket traffic to Node.js (port `3000`).

---

## 3. Dynamic Rules Setup & Customizable Gameplay
We allow the lobby host to customize four game parameters before starting the game:
1. **Elimination Score Limit**: The cumulative point threshold at which a player is eliminated (default: `200`).
2. **Cards Dealt per Player**: Number of cards dealt to each player at the start of a round (default: `7`).
3. **Show Threshold**: The maximum hand value a player can have to declare a Show (default: `10`).
4. **Wrong Show Penalty / Round Cap**: The points added to a wrong show declarer, and the maximum score cap for opponents in a round (default: `25`).

### 3.1 State & Type Modifications
* **`server/src/types.ts`**:
  * Added `GameRules` interface containing `eliminationScore`, `cardsPerPlayer`, `showThreshold`, and `penaltyScore`.
  * Included `rules: GameRules` in both `GameRoomState` and `ClientGameState`.
* **`server/src/game.ts`**:
  * Initialize default `rules` inside the `GameRoom` constructor.
  * Added `updateRules(rules: Partial<GameRules>)` method to apply changes.
  * Use `this.state.rules.cardsPerPlayer` when dealing hands.
  * Use `this.state.rules.showThreshold` inside `handleDeclareShow` to check if a show is allowed.
  * Use `this.state.rules.penaltyScore` to apply wrong show penalties and cap round scores.
  * Use `this.state.rules.eliminationScore` to check for game-over elimination conditions.
  * Propagate `rules` in the `getClientState` state payload.

---

## 4. Communication Protocols & Event Catalog

### 4.1 Client-to-Server Events
* `createRoom({ name }, callback)`: Instantiates a new lobby and returns the player and room context.
* `joinRoom({ roomId, name }, callback)`: Connects a player to an existing room code, supporting reconnections.
* `updateRules({ roomId, playerId, rules }, callback)`: Updates customizable rules (host only). Broadcasts updated lobby state to all players.
* `startGame({ roomId, playerId })`: Initiates the card dealing phase (runs only if triggered by the room host).
* `discard({ roomId, playerId, cardIds }, callback)`: Transmits selected card IDs to discard.
* `draw({ roomId, playerId, source }, callback)`: Requests drawing a card from `drawPile` or `discardPile`.
* `declareShow({ roomId, playerId })`: Declares a Show to end the round.
* `nextRound({ roomId, playerId })`: Resets round parameters and deals new hands (runs only if triggered by the host).
* `syncState({ roomId, playerId }, callback)`: Synchronizes state variables during client page refreshes or reconnection events.

### 4.2 Server-to-Client Events
* `gameStateUpdate`: Broadcasts the updated client-specific state payload to all connected clients in a lobby.
