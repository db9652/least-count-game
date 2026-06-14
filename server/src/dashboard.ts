import express from 'express';
import { GameRoom } from './game';

export function startDashboard(
    rooms: Map<string, GameRoom>,
    socketToPlayerMap: Map<string, { roomId: string; playerId: string }>,
    completedGames: any[]
) {
    const app = express();
    const PORT = process.env.DASHBOARD_PORT || 4000;

    // Basic Auth Middleware
    app.use((req, res, next) => {
        const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
        const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

        const expectedUser = process.env.DASHBOARD_USER || 'admin';
        const expectedPass = process.env.DASHBOARD_PASSWORD || 'admin';

        if (login && password && login === expectedUser && password === expectedPass) {
            return next();
        }

        res.set('WWW-Authenticate', 'Basic realm="Least Count Dashboard"');
        res.status(401).send('Authentication required.');
    });

    app.get('/api/stats', (req, res) => {
        const activeRooms = Array.from(rooms.entries()).map(([id, room]) => ({
            id,
            playersCount: room.state.players.length,
            gameStarted: room.state.gameStarted,
            roundNumber: room.state.roundNumber,
            players: room.state.players.map(p => ({ name: p.name, score: p.score, isHost: p.isHost }))
        }));

        res.json({
            roomsCount: rooms.size,
            playersCount: socketToPlayerMap.size,
            completedGamesCount: completedGames.length,
            activeRooms,
            completedGames
        });
    });

    app.get('/', (req, res) => {
        res.send(getDashboardHtml());
    });

    app.listen(PORT, () => {
        console.log(`Least Count Dashboard is running on port ${PORT}`);
    });
}

function getDashboardHtml() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Least Count - Admin Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0f172a;
            --surface-color: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.5);
            --success: #10b981;
            --warning: #f59e0b;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.15), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.15), transparent 25%);
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        h1 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: -0.025em;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        h1::before {
            content: '';
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: var(--accent);
            border-radius: 50%;
            box-shadow: 0 0 10px var(--accent-glow);
        }

        .refresh-btn {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }

        .refresh-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
        }

        .refresh-btn:active {
            transform: translateY(1px);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .stat-card {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .stat-title {
            color: var(--text-muted);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
        }

        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
        }

        .sections-layout {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        @media (min-width: 900px) {
            .sections-layout {
                grid-template-columns: 1fr 1fr;
            }
        }

        .dashboard-section {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            align-self: start;
        }

        .section-header {
            margin-top: 0;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .room-list {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .room-card {
            background: rgba(0, 0, 0, 0.25);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.25rem;
            transition: border-color 0.2s ease;
        }

        .room-card:hover {
            border-color: var(--accent);
        }

        .room-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .room-id {
            font-family: monospace;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--accent);
        }

        .badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 999px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge.playing {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .badge.waiting {
            background-color: rgba(245, 158, 11, 0.2);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .room-host-info {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .room-details {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .player-list {
            margin: 0;
            padding: 0;
            list-style: none;
            font-size: 0.875rem;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .player-item {
            display: flex;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.03);
            padding: 0.4rem 0.75rem;
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .player-item.host-player {
            border-color: rgba(59, 130, 246, 0.3);
            background: rgba(59, 130, 246, 0.05);
        }

        .player-item.winner-player {
            border-color: rgba(16, 185, 129, 0.3);
            background: rgba(16, 185, 129, 0.05);
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-muted);
            font-style: italic;
        }

        .history-list {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        /* Loading animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 50%;
            border-top-color: var(--accent);
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Activity Dashboard</h1>
            <button class="refresh-btn" id="refreshBtn">Refresh Data</button>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">Active Rooms</div>
                <div class="stat-value" id="valRooms">-</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Connected Sockets</div>
                <div class="stat-value" id="valPlayers">-</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Ongoing Games</div>
                <div class="stat-value" id="valGames">-</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Completed Games</div>
                <div class="stat-value" id="valCompleted">-</div>
            </div>
        </div>

        <div class="sections-layout">
            <div class="dashboard-section">
                <h2 class="section-header">Active Rooms</h2>
                <div id="roomList" class="room-list">
                    <div class="empty-state"><div class="loading"></div> Loading data...</div>
                </div>
            </div>

            <div class="dashboard-section">
                <h2 class="section-header">Recent Completed Games</h2>
                <div id="historyList" class="history-list">
                    <div class="empty-state"><div class="loading"></div> Loading data...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function fetchStats() {
            const roomListEl = document.getElementById('roomList');
            const historyListEl = document.getElementById('historyList');
            const btn = document.getElementById('refreshBtn');
            btn.textContent = 'Refreshing...';
            
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                
                document.getElementById('valRooms').textContent = data.roomsCount;
                document.getElementById('valPlayers').textContent = data.playersCount;
                document.getElementById('valGames').textContent = data.activeRooms.filter(r => r.gameStarted).length;
                document.getElementById('valCompleted').textContent = data.completedGamesCount;

                // Render Active Rooms
                if (data.activeRooms.length === 0) {
                    roomListEl.innerHTML = '<div class="empty-state">No active rooms at the moment.</div>';
                } else {
                    roomListEl.innerHTML = data.activeRooms.map(room => {
                        const host = room.players.find(p => p.isHost);
                        return \`
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="room-id">#\${room.id}</span>
                                    <span class="badge \${room.gameStarted ? 'playing' : 'waiting'}">
                                        \${room.gameStarted ? 'Playing' : 'Waiting'}
                                    </span>
                                </div>
                                <div class="room-host-info">
                                    <span>👑 Started by: <strong>\${host ? host.name : 'Unknown'}</strong></span>
                                </div>
                                <div class="room-details">
                                    Players (\${room.playersCount} / 6) &nbsp;&bull;&nbsp; Round: \${room.roundNumber}
                                </div>
                                <ul class="player-list">
                                    \${room.players.map(p => \`
                                        <li class="player-item \${p.isHost ? 'host-player' : ''}">
                                            <span>\${p.name} \${p.isHost ? '👑' : ''}</span>
                                            <span>\${p.score} pts</span>
                                        </li>
                                    \`).join('')}
                                </ul>
                            </div>
                        \`;
                    }).join('');
                }

                // Render Completed Games
                if (data.completedGames.length === 0) {
                    historyListEl.innerHTML = '<div class="empty-state">No completed games yet.</div>';
                } else {
                    historyListEl.innerHTML = data.completedGames.map(game => {
                        const host = game.players.find(p => p.isHost);
                        return \`
                            <div class="room-card">
                                <div class="room-header">
                                    <span class="room-id">#\${game.roomId}</span>
                                    <span class="badge" style="background-color: rgba(16, 185, 129, 0.2); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3);">
                                        Winner: \${game.winnerName} 👑
                                    </span>
                                </div>
                                <div class="room-host-info">
                                    <span>👑 Started by: <strong>\${host ? host.name : 'Unknown'}</strong></span>
                                </div>
                                <div class="room-details" style="display:flex; justify-content:space-between; align-items:center;">
                                    <span>Rounds: \${game.roundNumber}</span>
                                    <span style="font-size:0.75rem; font-weight:normal;" class="history-time">\${game.completedAt}</span>
                                </div>
                                <ul class="player-list">
                                    \${game.players.map(p => \`
                                        <li class="player-item \${p.name === game.winnerName ? 'winner-player' : (p.isHost ? 'host-player' : '')}">
                                            <span>\${p.name} \${p.isHost ? '👑' : ''} \${p.name === game.winnerName ? '🎉' : ''}</span>
                                            <span>\${p.score} pts</span>
                                        </li>
                                    \`).join('')}
                                </ul>
                            </div>
                        \`;
                    }).join('');
                }
            } catch (err) {
                console.error(err);
                roomListEl.innerHTML = '<div class="empty-state" style="color: var(--warning)">Failed to load data. Is the server running?</div>';
                historyListEl.innerHTML = '<div class="empty-state" style="color: var(--warning)">Failed to load data.</div>';
            } finally {
                btn.textContent = 'Refresh Data';
            }
        }

        document.getElementById('refreshBtn').addEventListener('click', fetchStats);
        
        // Initial fetch
        fetchStats();
        
        // Auto refresh every 5 seconds
        setInterval(fetchStats, 10000);
    </script>
</body>
</html>
  `;
}
