import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { GameRoom } from './game';
import { startDashboard } from './dashboard';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: '*', // Allow all origins for local dev
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// In-memory rooms database
const rooms = new Map<string, GameRoom>();

// Map to track which socket belongs to which player and room
// SocketId -> { roomId, playerId }
const socketToPlayerMap = new Map<string, { roomId: string; playerId: string }>();

// Map to track room deletion timers
const roomCleanupTimers = new Map<string, NodeJS.Timeout>();

// In-memory completed games history
const HISTORY_FILE = path.join(__dirname, '../history.json');
let completedGames: any[] = [];
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    completedGames = JSON.parse(data);
  }
} catch (e) {
  console.error('Failed to load history file:', e);
}

function archiveCompletedGame(room: GameRoom) {
  const winner = room.state.players.find(p => p.id === room.state.winnerId);
  const gameInfo = {
    roomId: room.state.roomId,
    winnerName: winner ? winner.name : 'Unknown',
    players: room.state.players.map(p => ({ name: p.name, score: p.score, isHost: p.isHost })),
    roundNumber: room.state.roundNumber,
    completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  completedGames.unshift(gameInfo);
  if (completedGames.length > 50) {
    completedGames.pop();
  }
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(completedGames, null, 2));
  } catch (e) {
    console.error('Failed to save history file:', e);
  }
}

function cancelCleanupTimer(roomId: string) {
  const timer = roomCleanupTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    roomCleanupTimers.delete(roomId);
    console.log(`Cleanup timer cancelled for room ${roomId}`);
  }
}

// Generate a random 4-letter room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

// Broadcast personalized game state updates to everyone in a room
function broadcastGameState(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.state.players.forEach(player => {
    const personalizedState = room.getClientState(player.id);
    io.to(player.socketId).emit('gameStateUpdate', personalizedState);
  });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('createRoom', ({ name }, callback) => {
    try {
      if (!name || name.trim() === '') {
        return callback({ error: 'Name is required' });
      }

      const roomId = generateRoomCode();
      const playerId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const room = new GameRoom(roomId);
      room.addPlayer(playerId, name.trim(), socket.id);
      
      rooms.set(roomId, room);
      socketToPlayerMap.set(socket.id, { roomId, playerId });
      
      socket.join(roomId);
      
      callback({ roomId, playerId });
      broadcastGameState(roomId);
    } catch (err: any) {
      console.error(err);
      callback({ error: err.message || 'Failed to create room' });
    }
  });

  // Join Room
  socket.on('joinRoom', ({ roomId, name }, callback) => {
    try {
      if (!roomId || roomId.trim() === '') {
        return callback({ error: 'Room ID is required' });
      }
      if (!name || name.trim() === '') {
        return callback({ error: 'Name is required' });
      }

      const cleanRoomId = roomId.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);

      if (!room) {
        return callback({ error: 'Room not found' });
      }

      // Cancel any pending cleanup timer for this room
      cancelCleanupTimer(cleanRoomId);

      // Check if player is reconnecting
      // Search by name in existing player list
      let player = room.state.players.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
      let playerId: string;
 
      if (!player) {
        if (room.state.gameStarted) {
          return callback({ error: 'Game has already started in this room!' });
        }
        if (room.state.players.length >= 6) {
          return callback({ error: 'Room is full! Max 6 players.' });
        }
        playerId = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        player = room.addPlayer(playerId, name.trim(), socket.id);
      } else {
        // Player reconnecting
        playerId = player.id;
        player.socketId = socket.id;
        room.state.history.push(`${player.name} reconnected.`);
      }

      socketToPlayerMap.set(socket.id, { roomId: cleanRoomId, playerId });
      socket.join(cleanRoomId);

      callback({ roomId: cleanRoomId, playerId });
      broadcastGameState(cleanRoomId);
    } catch (err: any) {
      console.error(err);
      callback({ error: err.message || 'Failed to join room' });
    }
  });

  // Update Rules
  socket.on('updateRules', ({ roomId, playerId, rules }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    const player = room.state.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      return callback?.({ error: 'Only the host can modify gameplay rules' });
    }

    try {
      room.updateRules(rules);
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Send Chat Message
  socket.on('sendChatMessage', ({ roomId, playerId, text }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    const player = room.state.players.find(p => p.id === playerId);
    if (!player) return callback?.({ error: 'Player not found' });

    if (!text || text.trim() === '') {
      return callback?.({ error: 'Message text is required' });
    }

    try {
      room.addChatMessage(player.name, text.trim());
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Start Game
  socket.on('startGame', ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    const player = room.state.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      return callback?.({ error: 'Only the host can start the game' });
    }

    try {
      room.startGame();
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Discard Cards
  socket.on('discard', ({ roomId, playerId, cardIds }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    try {
      room.handleDiscard(playerId, cardIds);
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Draw Card
  socket.on('draw', ({ roomId, playerId, source }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    try {
      room.handleDraw(playerId, source);
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Declare Show
  socket.on('declareShow', ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    try {
      room.handleDeclareShow(playerId);
      broadcastGameState(roomId);
      callback?.({ success: true });

      if (room.state.isGameOver) {
        archiveCompletedGame(room);
      }
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Next Round
  socket.on('nextRound', ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    try {
      room.handleNextRound(playerId);
      broadcastGameState(roomId);
      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Reconnect / Sync State
  socket.on('syncState', ({ roomId, playerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback?.({ error: 'Room not found' });

    // Cancel any pending cleanup timer for this room
    cancelCleanupTimer(roomId);

    const player = room.state.players.find(p => p.id === playerId);
    if (!player) return callback?.({ error: 'Player not found in this room' });

    // Update socket ID on reconnect
    player.socketId = socket.id;
    socketToPlayerMap.set(socket.id, { roomId, playerId });
    socket.join(roomId);

    callback?.({ success: true });
    broadcastGameState(roomId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const mapping = socketToPlayerMap.get(socket.id);
    if (mapping) {
      const { roomId, playerId } = mapping;
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        const allDisconnected = room.state.players.every(p => p.socketId === '');
        if (room.state.players.length === 0) {
          // Case A: Lobby/Game hasn't started and room is empty. Delete after 5 minutes.
          cancelCleanupTimer(roomId);
          const timer = setTimeout(() => {
            rooms.delete(roomId);
            roomCleanupTimers.delete(roomId);
            console.log(`Room ${roomId} deleted after 5 minutes of being empty.`);
          }, 5 * 60 * 1000);
          roomCleanupTimers.set(roomId, timer);
          console.log(`Scheduled 5-minute cleanup timer for empty room ${roomId}`);
        } else if (allDisconnected && room.state.gameStarted) {
          // Case B: Game started and everyone disconnected. Delete after 1 hour.
          cancelCleanupTimer(roomId);
          const timer = setTimeout(() => {
            rooms.delete(roomId);
            roomCleanupTimers.delete(roomId);
            console.log(`Room ${roomId} deleted after 1 hour of all players being disconnected.`);
          }, 60 * 60 * 1000);
          roomCleanupTimers.set(roomId, timer);
          console.log(`Scheduled 1-hour cleanup timer for disconnected room ${roomId}`);
        } else {
          broadcastGameState(roomId);
        }
      }
      socketToPlayerMap.delete(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Least Count server is running on port ${PORT}`);
});

// Start the admin dashboard on a separate port
startDashboard(rooms, socketToPlayerMap, completedGames);
