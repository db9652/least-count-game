import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import type { ClientGameState } from '../../server/src/types';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Scoreboard } from './components/Scoreboard';
import { LogIn, PlusCircle, AlertTriangle, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from './utils/soundManager';
import './App.css';

export default function App() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  const toggleMute = () => {
    const nextMuted = !soundManager.isMuted();
    soundManager.setMuted(nextMuted);
    setIsMuted(nextMuted);
    soundManager.play('join'); // Play quick confirm tone
  };

  // Load saved session on mount
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      setError(null);

      const savedRoomId = localStorage.getItem('least_count_room_id');
      const savedPlayerId = localStorage.getItem('least_count_player_id');

      if (savedRoomId && savedPlayerId) {
        socket.emit('syncState', { roomId: savedRoomId, playerId: savedPlayerId }, (response: any) => {
          if (response.error) {
            console.warn('Could not sync previous state:', response.error);
            // Clear stale session
            localStorage.removeItem('least_count_room_id');
            localStorage.removeItem('least_count_player_id');
          }
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('gameStateUpdate', (newState: ClientGameState) => {
      setGameState(prev => {
        if (prev && !prev.gameStarted && !newState.gameStarted) {
          if (newState.players.length > prev.players.length) {
            soundManager.play('join');
          }
        }
        return newState;
      });
      setError(null);
      // Persist session
      localStorage.setItem('least_count_room_id', newState.roomId);
      localStorage.setItem('least_count_player_id', newState.myId);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameStateUpdate');
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');

    socket.emit('createRoom', { name: name.trim() }, (response: any) => {
      if (response.error) {
        setError(response.error);
      } else {
        localStorage.setItem('least_count_player_name', name.trim());
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    if (!joinCode.trim()) return setError('Room code is required');

    socket.emit('joinRoom', { roomId: joinCode.trim(), name: name.trim() }, (response: any) => {
      if (response.error) {
        setError(response.error);
      } else {
        localStorage.setItem('least_count_player_name', name.trim());
      }
    });
  };

  const handleStartGame = () => {
    if (!gameState) return;
    socket.emit('startGame', { roomId: gameState.roomId, playerId: gameState.myId }, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleDiscard = (cardIds: string[]) => {
    if (!gameState) return;
    socket.emit('discard', { roomId: gameState.roomId, playerId: gameState.myId, cardIds }, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleDraw = (source: 'drawPile' | 'discardPile') => {
    if (!gameState) return;
    socket.emit('draw', { roomId: gameState.roomId, playerId: gameState.myId, source }, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleDeclareShow = () => {
    if (!gameState) return;
    socket.emit('declareShow', { roomId: gameState.roomId, playerId: gameState.myId }, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleSendMessage = (text: string) => {
    if (!gameState) return;
    socket.emit('sendChatMessage', { roomId: gameState.roomId, playerId: gameState.myId, text }, (response: any) => {
      if (response && response.error) {
        setError(response.error);
      }
    });
  };

  const handleNextRound = () => {
    if (!gameState) return;
    socket.emit('nextRound', { roomId: gameState.roomId, playerId: gameState.myId }, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('least_count_room_id');
    localStorage.removeItem('least_count_player_id');
    socket.disconnect();
    socket.connect(); // reconnect to reset clean socket state
    setGameState(null);
    setError(null);
  };

  const handleRestartGame = () => {
    handleStartGame(); // Restarting matches the Start Game logic
  };

  // Render Welcome/Login Screen
  if (!gameState) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-section">
            <h1>🃏 Least Count <span>Multiplayer</span></h1>
          </div>
          <div className="header-actions">
            <button 
              type="button"
              className={`sound-toggle-btn ${isMuted ? 'muted' : ''}`} 
              onClick={toggleMute}
              title={isMuted ? "Unmute Game Sounds" : "Mute Game Sounds"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot" />
              <span>{connected ? 'Server Connected' : 'Connecting to Server...'}</span>
            </div>
          </div>
        </header>

        <div className="welcome-screen">
          <div className="welcome-card glass-panel">
            <div className="welcome-title">
              <h2>Let's Play</h2>
              <p>Discard fast, count points, draw matching cards to skip!</p>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.5rem', color: '#ef4444', marginBottom: '1.5rem', fontSize: '0.9rem', alignItems: 'center' }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                Create Room
              </button>
              <button
                className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
                onClick={() => setActiveTab('join')}
              >
                Join Room
              </button>
            </div>

            <form onSubmit={activeTab === 'create' ? handleCreateRoom : handleJoinRoom}>
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                  required
                />
              </div>

              {activeTab === 'join' && (
                <div className="form-group">
                  <label>Room Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ABCD"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={4}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                disabled={!connected}
              >
                {activeTab === 'create' ? (
                  <>
                    <PlusCircle size={18} />
                    Create New Room
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Join Existing Room
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                📖 How to Play Least Count
              </h3>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem', fontSize: '0.82rem', lineHeight: '1.5', color: 'var(--text-secondary)' }} className="history-log">
                <section style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.15rem', fontWeight: 600 }}>🎯 Objective</h4>
                  <p style={{ margin: 0 }}>
                    End each round with the <strong>lowest card points</strong> in your hand. Players accumulate scores across rounds; crossing <strong>200 points</strong> eliminates you.
                  </p>
                </section>

                <section style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.15rem', fontWeight: 600 }}>🃏 Card Values</h4>
                  <ul style={{ paddingLeft: '1.1rem', margin: 0, listStyleType: 'disc' }}>
                    <li><strong>Joker:</strong> 0 points</li>
                    <li><strong>Ace (A):</strong> 1 point</li>
                    <li><strong>2 to 9:</strong> Face value</li>
                    <li><strong>10, J, Q, K:</strong> 10 points each</li>
                  </ul>
                </section>

                <section style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.15rem', fontWeight: 600 }}>🔄 Turn Flow</h4>
                  <p style={{ margin: 0 }}>
                    You must <strong>Discard First</strong> (one card, or multiple of the same rank) and then <strong>Draw Next</strong> (from Closed Deck or Discard Pile).
                  </p>
                </section>

                <section style={{ marginBottom: '0.75rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.15rem', fontWeight: 600 }}>⚡ Skip Draw Rule</h4>
                  <p style={{ margin: 0 }}>
                    If you discard cards matching the rank of the top card of the Discard Pile at the start of your turn, you skip drawing, reducing your hand size!
                  </p>
                </section>

                <section style={{ marginBottom: '0.2rem' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: '0.15rem', fontWeight: 600 }}>📢 Declaring "Show"</h4>
                  <p style={{ margin: 0 }}>
                    If your hand is <strong>10 points or less</strong>, you can declare "Show" at the start of your turn.
                  </p>
                  <ul style={{ paddingLeft: '1.1rem', margin: '0.2rem 0 0 0', listStyleType: 'circle' }}>
                    <li><strong>Success (You have strictly the lowest hand):</strong> You get <code>0 points</code>. All other players get their hand's points (capped at a maximum of <code>25 points</code>).</li>
                    <li><strong>Wrong Show (Someone has lower or equal hand):</strong> You get a <strong>+25 penalty</strong>. The player(s) with the actual lowest hand get <code>0 points</code>. All other players get their hand's points (capped at <code>25 points</code>).</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Lobby Screen
  if (!gameState.gameStarted) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="logo-section">
            <h1>🃏 Least Count <span>Lobby</span></h1>
          </div>
          <div className="header-actions">
            <button 
              type="button"
              className={`sound-toggle-btn ${isMuted ? 'muted' : ''}`} 
              onClick={toggleMute}
              title={isMuted ? "Unmute Game Sounds" : "Mute Game Sounds"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="status-indicator connected">
              <div className="status-dot" />
              <span>Room {gameState.roomId}</span>
            </div>
          </div>
        </header>

        {error && (
          <div style={{ position: 'fixed', top: '5rem', right: '2rem', display: 'flex', gap: '0.5rem', background: '#ef4444', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.9rem', alignItems: 'center', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
          </div>
        )}

        <Lobby
          roomId={gameState.roomId}
          myId={gameState.myId}
          players={gameState.players}
          onStartGame={handleStartGame}
          rules={gameState.rules}
        />
      </div>
    );
  }

  // Render Game Board Screen
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>🃏 Least Count <span>Active Table</span></h1>
        </div>
        <div className="header-actions">
          <button 
            type="button"
            className={`sound-toggle-btn ${isMuted ? 'muted' : ''}`} 
            onClick={toggleMute}
            title={isMuted ? "Unmute Game Sounds" : "Mute Game Sounds"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="status-indicator connected" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            <ShieldCheck size={14} />
            <span>Secure Table</span>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ position: 'fixed', top: '5rem', right: '2rem', display: 'flex', gap: '0.5rem', background: '#ef4444', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', color: '#fff', fontSize: '0.9rem', alignItems: 'center', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>
      )}

      <GameBoard
        gameState={gameState}
        onDiscard={handleDiscard}
        onDraw={handleDraw}
        onDeclareShow={handleDeclareShow}
        onLeave={handleLeaveRoom}
        onSendMessage={handleSendMessage}
      />

      {/* Scoreboard Overlay Modal */}
      {(gameState.turnPhase === 'ROUND_END' || gameState.isGameOver) && (
        <Scoreboard
          players={gameState.players}
          myId={gameState.myId}
          isGameOver={gameState.isGameOver}
          winnerId={gameState.winnerId}
          onRestart={handleRestartGame}
          onLeave={handleLeaveRoom}
          onNextRound={handleNextRound}
          rules={gameState.rules}
        />
      )}
    </div>
  );
}
