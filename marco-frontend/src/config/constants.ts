// Application constants
// Nota: per permettere l'accesso da altri dispositivi nella stessa LAN,
// puntiamo il backend all'host che sta servendo la pagina.
// Esempi:
// - Se apri da questo PC: https://localhost:8080 -> API_BASE = https://localhost:3000
// - Se apri da un altro device: https://192.168.1.50:8080 -> API_BASE = https://192.168.1.50:3000
export const API_BASE = `https://${window.location.hostname}:3000`;

export const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds