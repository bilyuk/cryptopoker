const STORAGE_KEY = "cryptopoker.mvp.client.v1";
const MAX_LOG_ENTRIES = 80;
const MAX_RECONNECT_ATTEMPTS = 5;

const PHASE_BY_STATUS = {
  idle: "waiting",
  joining: "connecting",
  connecting: "connecting",
  connected: "in_hand",
  reconnecting: "paused",
  disconnected: "disconnected",
  error: "paused",
};

const dom = {
  displayNameInput: document.getElementById("display-name-input"),
  roomNameInput: document.getElementById("room-name-input"),
  joinButton: document.getElementById("join-btn"),
  disconnectButton: document.getElementById("disconnect-btn"),
  reconnectButton: document.getElementById("reconnect-btn"),
  clearLogButton: document.getElementById("clear-log-btn"),
  sendChatButton: document.getElementById("send-chat-btn"),
  invalidJsonButton: document.getElementById("send-invalid-json-btn"),
  invalidMessageButton: document.getElementById("send-invalid-message-btn"),
  chatInput: document.getElementById("chat-input"),
  statusBanner: document.getElementById("status-banner"),
  roomIdLabel: document.getElementById("room-id-label"),
  phaseLabel: document.getElementById("phase-label"),
  connectionLabel: document.getElementById("connection-label"),
  playerCountLabel: document.getElementById("player-count-label"),
  heroSeat: document.getElementById("hero-seat"),
  villainSeat: document.getElementById("villain-seat"),
  heroName: document.getElementById("hero-name"),
  villainName: document.getElementById("villain-name"),
  eventLog: document.getElementById("event-log"),
};

let state = loadState();
let socket = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let reconnectEnabled = false;
let manualClose = false;

bindEvents();
render();

if (state.session?.roomId && state.session?.player?.id) {
  reconnectEnabled = true;
  connectSocket({ reconnect: true, reason: "restoring previous session" });
}

function bindEvents() {
  dom.joinButton.addEventListener("click", joinRoom);
  dom.disconnectButton.addEventListener("click", disconnectSocket);
  dom.reconnectButton.addEventListener("click", reconnectSocket);
  dom.clearLogButton.addEventListener("click", clearLog);
  dom.sendChatButton.addEventListener("click", sendChatMessage);
  dom.invalidJsonButton.addEventListener("click", sendInvalidJson);
  dom.invalidMessageButton.addEventListener("click", sendInvalidMessage);

  dom.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendChatMessage();
    }
  });
}

function loadState() {
  const defaults = {
    displayName: "",
    roomName: "Velvet",
    status: "idle",
    statusDetail: "Not connected",
    protocolError: null,
    session: null,
    room: null,
    messages: [],
    logs: ["Client initialized"],
    updatedAt: Date.now(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      updatedAt: Date.now(),
    };
  } catch {
    return defaults;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = {
    ...state,
    ...patch,
    updatedAt: Date.now(),
  };
  persist();
  render();
}

function appendLog(message) {
  const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const logs = [...state.logs, `[${stamp}] ${message}`].slice(-MAX_LOG_ENTRIES);
  setState({ logs });
}

async function joinRoom() {
  const displayName = dom.displayNameInput.value.trim();
  const roomName = dom.roomNameInput.value.trim() || "Velvet";

  if (displayName.length < 2) {
    setState({ protocolError: "Display name must be at least 2 characters" });
    return;
  }

  setState({
    displayName,
    roomName,
    status: "joining",
    statusDetail: "Requesting seat",
    protocolError: null,
  });

  try {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, roomName }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "join_failed");
    }

    reconnectEnabled = true;
    reconnectAttempt = 0;

    setState({
      session: payload,
      room: {
        roomId: payload.roomId,
        roomName: payload.roomName,
        players: [payload.player],
      },
      status: "connecting",
      statusDetail: "Opening websocket",
      protocolError: null,
      messages: [],
    });

    appendLog(`Joined room ${payload.roomName} as ${payload.player.displayName} (${payload.player.seat})`);
    connectSocket({ reconnect: false, reason: "joined room" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "join_failed";
    setState({
      status: "error",
      statusDetail: "Join failed",
      protocolError: reason,
    });
    appendLog(`Join failed: ${reason}`);
  }
}

function resolveSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function connectSocket({ reconnect, reason }) {
  if (!state.session?.roomId || !state.session?.player?.id) {
    appendLog("Cannot connect websocket without room session");
    return;
  }

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  manualClose = false;
  const status = reconnect ? "reconnecting" : "connecting";
  setState({ status, statusDetail: reason, protocolError: null });

  const url = new URL(resolveSocketUrl());
  url.searchParams.set("roomId", state.session.roomId);
  url.searchParams.set("playerId", state.session.player.id);

  socket = new WebSocket(url.toString());

  socket.addEventListener("open", () => {
    reconnectAttempt = 0;
    setState({ status: "connected", statusDetail: "Live websocket connected" });
    appendLog("Websocket connected");
  });

  socket.addEventListener("message", (event) => {
    handleSocketMessage(String(event.data));
  });

  socket.addEventListener("close", (event) => {
    const closeReason = event.reason || "no_reason";
    socket = null;
    setState({
      status: "disconnected",
      statusDetail: `Socket closed (${event.code})`,
    });
    appendLog(`Socket closed (${event.code}, ${closeReason})`);

    if (manualClose || !reconnectEnabled) {
      return;
    }

    scheduleReconnect(closeReason);
  });

  socket.addEventListener("error", () => {
    appendLog("Socket transport error observed");
  });
}

function handleSocketMessage(rawPayload) {
  let payload;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    setState({ protocolError: "Received invalid JSON from server" });
    appendLog("Protocol error: invalid server JSON payload");
    return;
  }

  if (!payload?.type) {
    setState({ protocolError: "Received unknown message type" });
    appendLog("Protocol error: missing message type");
    return;
  }

  if (payload.type === "room:welcome") {
    setState({
      room: payload.room,
      session: { ...state.session, roomId: payload.room.roomId, roomName: payload.room.roomName, player: payload.player },
      status: "connected",
      statusDetail: "Handshake complete",
    });
    appendLog(`Welcome received for room ${payload.room.roomName}`);
    return;
  }

  if (payload.type === "room:presence") {
    setState({
      room: payload.room,
      status: "connected",
      statusDetail: "Presence synchronized",
    });
    const connected = payload.room.players.filter((player) => player.connected).length;
    appendLog(`Presence update: ${connected}/${payload.room.players.length} connected`);
    return;
  }

  if (payload.type === "chat:message") {
    const messages = [...state.messages, payload].slice(-MAX_LOG_ENTRIES);
    setState({ messages });
    appendLog(`Chat from ${payload.from}: ${payload.text}`);
    return;
  }

  if (payload.type === "error") {
    setState({
      protocolError: payload.code,
      statusDetail: "Server protocol error",
    });
    appendLog(`Server protocol error: ${payload.code}`);
    return;
  }

  setState({ protocolError: `Unknown message type: ${payload.type}` });
  appendLog(`Unknown message type: ${payload.type}`);
}

function scheduleReconnect(reason) {
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    setState({
      status: "error",
      statusDetail: "Reconnect limit reached",
      protocolError: `Unable to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts (${reason})`,
    });
    appendLog("Reconnect exhausted");
    return;
  }

  reconnectAttempt += 1;
  const waitMs = Math.min(1000 * 2 ** (reconnectAttempt - 1), 8000);
  setState({
    status: "reconnecting",
    statusDetail: `Reconnect attempt ${reconnectAttempt}/${MAX_RECONNECT_ATTEMPTS} in ${Math.ceil(waitMs / 1000)}s`,
  });
  appendLog(`Scheduling reconnect attempt ${reconnectAttempt} (${reason})`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSocket({ reconnect: true, reason: `attempt ${reconnectAttempt}` });
  }, waitMs);
}

function disconnectSocket() {
  reconnectEnabled = false;
  reconnectAttempt = 0;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    manualClose = true;
    socket.close(1000, "manual_disconnect");
  }

  if (!socket) {
    setState({ status: "disconnected", statusDetail: "Socket already closed" });
  }

  appendLog("Manual disconnect requested");
}

function reconnectSocket() {
  if (!state.session?.roomId || !state.session?.player?.id) {
    setState({ protocolError: "Join a room before reconnecting" });
    return;
  }

  reconnectEnabled = true;
  reconnectAttempt = 0;

  if (socket && socket.readyState === WebSocket.OPEN) {
    manualClose = true;
    socket.close(1000, "manual_reconnect");
  }

  appendLog("Manual reconnect requested");
  connectSocket({ reconnect: true, reason: "manual reconnect" });
}

function sendChatMessage() {
  const text = dom.chatInput.value.trim();
  if (!text) {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setState({ protocolError: "Socket is not connected" });
    return;
  }

  socket.send(JSON.stringify({ type: "chat:send", text }));
  dom.chatInput.value = "";
}

function sendInvalidJson() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setState({ protocolError: "Socket is not connected" });
    return;
  }
  socket.send("{bad-json");
  appendLog("Sent invalid JSON payload for QA error-path validation");
}

function sendInvalidMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setState({ protocolError: "Socket is not connected" });
    return;
  }
  socket.send(JSON.stringify({ type: "chat:send", text: "" }));
  appendLog("Sent invalid message payload for QA error-path validation");
}

function clearLog() {
  setState({ logs: ["Log cleared"], messages: [] });
}

function render() {
  dom.displayNameInput.value = state.displayName;
  dom.roomNameInput.value = state.roomName;

  renderMeta();
  renderSeats();
  renderBanner();
  renderLogs();
  renderControls();
}

function renderMeta() {
  const roomId = state.room?.roomId || state.session?.roomId || "-";
  const players = state.room?.players || [];
  const connectedCount = players.filter((player) => player.connected).length;
  const phase = PHASE_BY_STATUS[state.status] || "waiting";

  dom.roomIdLabel.textContent = roomId;
  dom.phaseLabel.textContent = phase;
  dom.connectionLabel.textContent = state.status;
  dom.playerCountLabel.textContent = `${connectedCount}/${Math.max(players.length, 1)}`;
}

function renderSeats() {
  const roomPlayers = state.room?.players || [];
  const heroId = state.session?.player?.id;
  const hero = roomPlayers.find((player) => player.id === heroId) || state.session?.player || null;
  const opponent = roomPlayers.find((player) => player.id !== heroId) || null;

  dom.heroName.textContent = hero ? `${hero.displayName} (You)` : "You";
  applySeat(dom.heroSeat, {
    stack: hero ? `${hero.chips}` : "-",
    contrib: hero ? `Seat: ${hero.seat}` : "Seat: -",
    state: hero ? (hero.connected ? "Connected" : "Disconnected") : "Not seated",
    acting: Boolean(hero?.connected),
  });

  dom.villainName.textContent = opponent ? opponent.displayName : "Waiting for opponent";
  applySeat(dom.villainSeat, {
    stack: opponent ? `${opponent.chips}` : "-",
    contrib: opponent ? `Seat: ${opponent.seat}` : "Seat: -",
    state: opponent ? (opponent.connected ? "Connected" : "Disconnected") : "Waiting",
    acting: Boolean(opponent?.connected),
  });
}

function applySeat(element, payload) {
  element.querySelector('[data-role="stack"]').textContent = payload.stack;
  element.querySelector('[data-role="contrib"]').textContent = payload.contrib;
  element.querySelector('[data-role="state"]').textContent = payload.state;
  element.classList.toggle("acting", payload.acting);
}

function renderBanner() {
  const banner = dom.statusBanner;
  banner.className = "status-banner hidden";

  if (state.status === "joining" || state.status === "connecting") {
    banner.className = "status-banner warning";
    banner.textContent = `Connecting: ${state.statusDetail}`;
    return;
  }

  if (state.status === "reconnecting") {
    banner.className = "status-banner warning";
    banner.textContent = state.statusDetail;
    return;
  }

  if (state.protocolError) {
    banner.className = "status-banner danger";
    banner.textContent = `Error: ${state.protocolError}`;
    return;
  }

  if (state.status === "connected") {
    banner.className = "status-banner success";
    banner.textContent = "Realtime websocket session healthy";
    return;
  }

  if (state.status === "disconnected") {
    banner.className = "status-banner danger";
    banner.textContent = "Disconnected. Use reconnect to restore socket session.";
  }
}

function renderLogs() {
  dom.eventLog.innerHTML = "";
  const combined = [...state.logs].reverse();
  combined.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    dom.eventLog.appendChild(item);
  });
}

function renderControls() {
  const connected = socket && socket.readyState === WebSocket.OPEN;
  const hasSession = Boolean(state.session?.roomId && state.session?.player?.id);

  dom.joinButton.disabled = state.status === "joining";
  dom.disconnectButton.disabled = !connected;
  dom.reconnectButton.disabled = !hasSession;

  dom.sendChatButton.disabled = !connected;
  dom.invalidJsonButton.disabled = !connected;
  dom.invalidMessageButton.disabled = !connected;
}
