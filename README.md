# Least Count - Real-Time Multiplayer Card Game

A beautiful, real-time, remote multiplayer implementation of the popular card game **Least Count** (also known as *Show*, *Count*, or *Lisko*). Built with a Node.js + Socket.io backend and a React + Vite + TypeScript frontend.

---

## 🎮 Game Overview & Rules

In **Least Count**, the objective is to end the round with the lowest total card points in your hand. Players accumulate points across rounds, and anyone crossing the **200-point threshold** is eliminated. The player with the lowest score at the end wins!

### **Our Custom Ruleset:**
1. **Starting Hand**: Each player receives exactly **7 cards**.
2. **Discard First, Draw Next**: A player's turn begins by discarding and ends by drawing a card.
3. **Multi-Discard**: You can discard multiple cards at once *only* if they are of the exact same rank (e.g., two 8s).
4. **Skip Draw Rule**: If you discard cards matching the rank of the top card of the Discard Pile at the start of your turn, you do **not** have to draw a card, reducing your hand size.
5. **Declaring Show**: You can declare a "Show" at the start of your turn if your hand total is **10 points or less**.
6. **Scoring & Penalties**:
   - **Successful Show**: The declarer gets `0 points`. Others get their hand points (capped at a maximum of `25 points`).
   - **Wrong Show**: If anyone has a lower or equal hand than the declarer, the declarer gets a `+25 point penalty`. The player(s) with the actual lowest hand get `0 points`. All others get their hand points (capped at `25 points`).

---

## 🚀 Tech Stack

- **Frontend**: React, Vite, TypeScript, Vanilla CSS (with glassmorphism and card animations), Lucide Icons.
- **Backend**: Node.js, Express, Socket.io (WebSocket), TypeScript, ts-node-dev.
- **Monorepo Manager**: Concurrently (runs both client and server with a single command).

---


---

## 🛠️ Quick Start

To set up and run the game on your local machine, check out the detailed instructions in the [setup.md](setup.md) file.
