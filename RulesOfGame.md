# Least Count - Card Game Rules

Welcome to **Least Count**! Here are the rules for this real-time multiplayer card game.

---

## 🎯 1. Objective
The goal is to end each round with the **lowest total points** in your hand. 
* Players accumulate points across rounds.
* If a player's cumulative score reaches **100 points**, they are eliminated.
* The player with the lowest score at the end of the game wins!

---

## 🃏 2. Card Values
Points are calculated based on the cards remaining in your hand:
* **Joker**: `0 points`
* **Ace (A)**: `1 point`
* **2 to 9**: Face value (e.g., a 7 is worth 7 points)
* **10, Jack (J), Queen (Q), King (K)**: `10 points` each

---

## 🎮 3. Turn Flow
The game uses a **Discard First, Draw Next** turn dynamic:
1. **Discard Phase (Start of turn)**: 
   * You must discard at least one card from your hand.
   * You can discard multiple cards at once **only if they are of the exact same rank** (e.g., three 8s or two Jacks).
2. **Draw Phase (End of turn)**:
   * You must draw exactly one card from either the **Closed Deck (Draw Pile)** or the **Open Deck (Discard Pile)**, unless you skip the draw.

---

## ⚡ 4. Skip Draw Rule
You can reduce your hand size below 7 cards by skipping the draw phase:
* If the card you discard **matches the exact rank** of the card on top of the Discard Pile *at the start of your turn*, you skip the draw phase.
* **Note on Face Cards**: Face cards must match exactly (e.g., if a Queen is on top, you can only skip if you discard a Queen, not a Jack or King, even though they all count as 10 points).

---

## 📢 5. Declaring a "Show"
At the **very start of your turn** (before discarding or drawing), if your total hand value is **10 points or less**, you can declare a **"Show"** to end the round.

### **Resolution & Scoring**:
* **Successful Show** (You have the strictly lowest hand value):
  * **You get**: `0 points`
  * **Opponents get**: Their hand total points (capped at a maximum of `25 points`).
* **Wrong Show** (An opponent has an equal or lower hand value than yours):
  * **You get**: A `+25 point penalty`.
  * **Opponent(s) with the actual lowest hand get**: `0 points`.
  * **All other players get**: Their hand total points (capped at a maximum of `25 points`).
