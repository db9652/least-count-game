import React, { useState } from 'react';
import { Copy, Users, Play } from 'lucide-react';
import { socket } from '../socket';

interface LobbyProps {
  roomId: string;
  myId: string;
  players: {
    id: string;
    name: string;
    isHost: boolean;
    isReady: boolean;
  }[];
  onStartGame: () => void;
  rules: {
    eliminationScore: number;
    cardsPerPlayer: number;
    showThreshold: number;
    penaltyScore: number;
  };
}

export const Lobby: React.FC<LobbyProps> = ({
  roomId,
  myId,
  players,
  onStartGame,
  rules
}) => {
  const [copied, setCopied] = useState(false);
  const [showModify, setShowModify] = useState(false);
  
  // Local state for editing inputs
  const [localEliminationScore, setLocalEliminationScore] = useState<string>('');
  const [localCardsPerPlayer, setLocalCardsPerPlayer] = useState<string>('');
  const [localShowThreshold, setLocalShowThreshold] = useState<string>('');
  const [localPenaltyScore, setLocalPenaltyScore] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const me = players.find(p => p.id === myId);
  const isHost = me?.isHost || false;
  const canStart = players.length >= 2;

  // Sync inputs with global rules when closed
  React.useEffect(() => {
    if (!showModify) {
      setLocalEliminationScore(rules.eliminationScore.toString());
      setLocalCardsPerPlayer(rules.cardsPerPlayer.toString());
      setLocalShowThreshold(rules.showThreshold.toString());
      setLocalPenaltyScore(rules.penaltyScore.toString());
    }
  }, [rules, showModify]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleModify = () => {
    if (!showModify) {
      setLocalEliminationScore(rules.eliminationScore.toString());
      setLocalCardsPerPlayer(rules.cardsPerPlayer.toString());
      setLocalShowThreshold(rules.showThreshold.toString());
      setLocalPenaltyScore(rules.penaltyScore.toString());
      setErrorMsg(null);
    }
    setShowModify(!showModify);
  };

  const handleSaveRules = () => {
    const elim = parseInt(localEliminationScore, 10);
    const cards = parseInt(localCardsPerPlayer, 10);
    const show = parseInt(localShowThreshold, 10);
    const penalty = parseInt(localPenaltyScore, 10);

    if (isNaN(elim) || elim < 50 || elim > 500) {
      setErrorMsg("Elimination Score Limit must be between 50 and 500.");
      return;
    }
    if (isNaN(cards) || cards < 3 || cards > 10) {
      setErrorMsg("Cards Dealt per Player must be between 3 and 10.");
      return;
    }
    if (isNaN(show) || show < 1 || show > 20) {
      setErrorMsg("Max Score to Show must be between 1 and 20.");
      return;
    }
    if (isNaN(penalty) || penalty < 5 || penalty > 50) {
      setErrorMsg("Wrong Show Penalty / Cap must be between 5 and 50.");
      return;
    }

    setErrorMsg(null);
    socket.emit('updateRules', {
      roomId,
      playerId: myId,
      rules: {
        eliminationScore: elim,
        cardsPerPlayer: cards,
        showThreshold: show,
        penaltyScore: penalty
      }
    }, (response: any) => {
      if (response?.error) {
        setErrorMsg(response.error);
      } else {
        setShowModify(false);
      }
    });
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-card glass-panel">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399' }}>Game Lobby</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Waiting for players to join...</p>
        </div>

        <div className="room-info-badge">
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Room Code
            </span>
            <div className="room-code-display">
              <h3>{roomId}</h3>
              <button 
                className="btn btn-secondary" 
                onClick={copyRoomCode}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                title="Copy Room Code"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Players
            </span>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
              <Users size={18} />
              {players.length} / 6
            </h3>
          </div>
        </div>

        {/* Gameplay Rules Section */}
        <div style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isHost ? 'pointer' : 'default' }} onClick={() => isHost && handleToggleModify()}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#f59e0b', margin: 0 }}>
              ⚙️ Gameplay Rules Settings {isHost && (showModify ? '▲' : '▼')}
            </h4>
            {isHost && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                {showModify ? 'Hide settings' : 'Modify Gameplay'}
              </span>
            )}
          </div>

          {isHost && showModify ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {errorMsg && (
                <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.4rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 500 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏆 Elimination Score Limit:</label>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', display: 'block' }}>Range: 50 - 500</span>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={localEliminationScore} 
                  onChange={(e) => setLocalEliminationScore(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎴 Cards Dealt per Player:</label>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', display: 'block' }}>Range: 3 - 10</span>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={localCardsPerPlayer} 
                  onChange={(e) => setLocalCardsPerPlayer(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🎯 Max Score to Show:</label>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', display: 'block' }}>Range: 1 - 20</span>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={localShowThreshold} 
                  onChange={(e) => setLocalShowThreshold(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⚠️ Wrong Show Penalty / Cap:</label>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', display: 'block' }}>Range: 5 - 50</span>
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                  value={localPenaltyScore} 
                  onChange={(e) => setLocalPenaltyScore(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={handleSaveRules}
                >
                  Save Rules
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={() => setShowModify(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>🏆 Elimination Limit: <strong style={{ color: 'var(--text-primary)' }}>{rules.eliminationScore} pts</strong></div>
              <div>🎴 Starting Cards: <strong style={{ color: 'var(--text-primary)' }}>{rules.cardsPerPlayer} cards</strong></div>
              <div>🎯 Max Score to Show: <strong style={{ color: 'var(--text-primary)' }}>{rules.showThreshold} pts</strong></div>
              <div>⚠️ Wrong Show Penalty / Cap: <strong style={{ color: 'var(--text-primary)' }}>{rules.penaltyScore} pts</strong></div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Player List
          </h4>
          <div className="player-list">
            {players.map((p) => (
              <div key={p.id} className="player-item">
                <div className="player-name-wrapper">
                  <span style={{ fontWeight: p.id === myId ? 600 : 400 }}>
                    {p.name} {p.id === myId && '(You)'}
                  </span>
                  {p.isHost && <span className="host-tag">Host</span>}
                </div>
                <div className="player-status-badge">
                  <div className="status-dot" style={{ backgroundColor: 'var(--primary)' }} />
                  In Lobby
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onStartGame}
              disabled={!canStart}
            >
              <Play size={16} />
              Start Match
            </button>
            {!canStart && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                Need at least 2 players to start the game!
              </p>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Only the host can start the game.
            </p>
          </div>
        )}

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.5rem' }}>
            Rule Reminders:
          </h4>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.5' }}>
            <li>You start with {rules.cardsPerPlayer} cards.</li>
            <li>You must **Discard First** and then **Draw Next**.</li>
            <li>Discard multiple cards only if they are the exact same rank.</li>
            <li>**Skip Draw Rule:** If you discard cards matching the rank of the top card of the Discard Pile, you do not draw!</li>
            <li>Show threshold: **{rules.showThreshold} points or less**. Wrong show penalty: **+{rules.penaltyScore} points** (round scores are capped at this amount).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
