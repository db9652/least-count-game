# TO-DO: Custom WebRTC Peer-to-Peer Audio Communication

This document outlines the requirements, step-by-step implementation plan, and potential hurdles for adding custom peer-to-peer audio communication among players using WebRTC (Mesh Topology).

---

## 📋 1. Core Requirements

1. **Signaling Server**:
   * Reuse the existing Socket.IO backend to exchange metadata between peers before establishing a direct connection.
2. **STUN/TURN Infrastructure**:
   * **STUN Server**: Used to discover public IP addresses. Free public STUN servers (like Google's `stun:stun.l.google.com:19302`) can be used.
   * **TURN Server**: Relays media traffic when players are behind restrictive firewalls (symmetric NATs). Requires a self-hosted instance (e.g., *Coturn*) or a paid third-party provider (e.g., *Xirsys* or *Metered.ca*).
3. **Browser Permissions**:
   * Secure origin requirement (HTTPS or localhost) to access microphone streams using `navigator.mediaDevices.getUserMedia`.

---

## 🛠️ 2. Step-by-Step Implementation Plan

### Step A: Backend Signaling Setup
1. Define new Socket.IO events in `server/src/index.ts` to act as a generic signal relay:
   * `relayIceCandidate({ roomId, targetPlayerId, candidate })`: Sends ICE candidates to the target peer.
   * `relaySDP({ roomId, targetPlayerId, sdp })`: Relays session descriptions (Offers/Answers) to the target peer.
2. Ensure that target players are routed correctly within the socket rooms.

### Step B: Frontend Client Integration
1. **Audio Controller State**:
   * Create a React context or state tracker inside `App.tsx` or a custom hook `useWebRTCAudio` to track player peer connections.
2. **Capture Microphone**:
   * Call `navigator.mediaDevices.getUserMedia({ audio: true, video: false })` to retrieve the local media stream.
   * Render a microphone mute/unmute control button in the Lobby and GameBoard.
3. **Establish Peer Connections (Mesh Layout)**:
   * When a player joins a lobby or game, loop over existing players and instantiate an `RTCPeerConnection` for each peer:
     ```typescript
     const pc = new RTCPeerConnection({
       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Add TURN servers here
     });
     ```
   * Add the local audio track to each peer connection: `pc.addTrack(localTrack, localStream)`.
   * Bind the `onicecandidate` callback to emit candidates via the signaling server.
   * Bind the `ontrack` callback to receive remote audio tracks and play them back dynamically inside `<audio>` HTML elements.
4. **Offer/Answer Handshake**:
   * The initiator creates an SDP Offer: `pc.createOffer()`, sets it locally, and sends it to the target peer.
   * The target peer receives the offer, sets it as the remote description, creates an Answer: `pc.createAnswer()`, sets it locally, and sends it back.
5. **Session Teardown**:
   * Ensure that when a player disconnects, leaves the room, or shuts down their microphone, all `RTCPeerConnection` objects are closed and garbage-collected.

---

## ⚠️ 3. Key Hurdles & Gotchas

* **Mesh Topology Overhead**:
  * Because every player connects directly to every other player, the number of peer connections scales quadratically: $N \times (N-1)$.
  * For 6 players, each player must maintain **5 separate upstream (upload) and downstream (download) audio connections**. This consumes substantial upload bandwidth and CPU.
* **Firewall Traversals (NAT)**:
  * Approximately 15% to 20% of users will fail to establish a direct connection due to strict residential or office firewalls. Without a properly configured **TURN server** running on port 443 (to bypass deep packet inspection), these players will experience silence.
* **Echo & Feedback**:
  * Without headphone use, microphone playback from other players will cause loops. Setting standard configuration flags:
    ```typescript
    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    ```
    is required, but physical echo cancellation remains browser/device-dependent.
* **Browser Sandbox Restrictions**:
  * Chrome, Firefox, and Safari block audio elements from playing automatically without prior user interaction. The game must verify that audio elements play after the user clicks "Join Room" or "Create Room" to avoid playback blocks.
