# Project Implementation Plan - Least Count Multiplayer Game

This document outlines the complete architecture, implementation details, and communication flow for the **Least Count** real-time multiplayer card game.

---

## 1. System Architecture
The application is structured as a decoupled monorepo containing a React-based client and a Node.js-based server, running concurrently in development and production environments.

### 1.1 Backend Engine (Node.js + Express + Socket.io)
* **Express Server**: Simple hosting instance configured with CORS to permit cross-origin development connections.
* **Socket.io WebSocket Layer**: Serves as the primary communication medium, handling bidirectional, real-time event distribution.
* **Game Manager (`GameRoom` class)**: 
  * Orchestrates the active state of each distinct lobby.
  * Controls the phase lifecycle (`DISCARD` ➔ `DRAW` ➔ `ROUND_END`).
  * Manages game rules execution (creating decks, shuffling, validating multi-card discards of matching ranks, calculating hand values, checking skip-draw triggers, and resolving "Show" declarations with penalties).
  * Stores session rooms in-memory with automatic cleanup upon player disconnection.

### 1.2 Frontend Application (React + Vite + TypeScript)
* **State Orchestrator (`App.tsx`)**: Controls screen routing (Welcome Screen ➔ Lobby ➔ Active Game Table ➔ Round-End Scoreboard) based on state events received from the WebSocket layer.
* **Real-time Synchronization (`socket.ts`)**: Establishes connections, automatically resolving ports and hostnames to route WebSocket requests through HTTP/HTTPS or Cloudflare Tunnel pathways.
* **UI Components**:
  * **Lobby**: Displays joined players, room codes, and hosts' control actions.
  * **GameBoard**: Layout of the active card table with opponent rings, card piles, history logs, and player hands.
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

## 3. Communication Protocols & Event Catalog

### 3.1 Client-to-Server Events
* `createRoom({ name }, callback)`: Instantiates a new lobby and returns the player and room context.
* `joinRoom({ roomId, name }, callback)`: Connects a player to an existing room code, supporting reconnections.
* `startGame({ roomId, playerId })`: Initiates the card dealing phase (runs only if triggered by the room host).
* `discard({ roomId, playerId, cardIds }, callback)`: Transmits selected card IDs to discard.
* `draw({ roomId, playerId, source }, callback)`: Requests drawing a card from `drawPile` or `discardPile`.
* `declareShow({ roomId, playerId })`: Declares a Show to end the round.
* `nextRound({ roomId, playerId })`: Resets round parameters and deals new hands (runs only if triggered by the host).
* `syncState({ roomId, playerId }, callback)`: Synchronizes state variables during client page refreshes or reconnection events.

### 3.2 Server-to-Client Events
* `gameStateUpdate`: Broadcasts the updated client-specific state payload to all connected clients in a lobby.
