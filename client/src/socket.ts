import { io, Socket } from 'socket.io-client';

const protocol = window.location.protocol;
const hostname = window.location.hostname;
const port = window.location.port;

// If running in local dev (port 517x or localhost), connect to port 3000.
// If running behind a Cloudflare Tunnel/subdomain (port 80/443), connect to the same host.
const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1' || port.startsWith('517');
const SOCKET_URL = isLocalDev
  ? `${protocol}//${hostname}:3000`
  : `${protocol}//${hostname}${port ? `:${port}` : ''}`;

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
