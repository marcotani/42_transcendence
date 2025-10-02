// Application constants
export const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'https://localhost:3000'
  : (window.location.hostname === 'host.docker.internal' || window.location.hostname === '0.0.0.0')
    ? 'https://host.docker.internal:3000'
    : 'https://backend:3000';

export const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds