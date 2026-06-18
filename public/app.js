(function() {
  'use strict';

  var statusEl = document.getElementById('status');
  var statusText = document.getElementById('status-text');

  // Create terminal
  var term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    lineHeight: 1.3,
    theme: {
      background: '#0d0d0d',
      foreground: '#e0e0e0',
      cursor: '#c850c0',
      cursorAccent: '#0d0d0d',
      selectionBackground: 'rgba(200, 80, 192, 0.3)',
      black: '#1a1a2e',
      red: '#ff6b6b',
      green: '#4ecdc4',
      yellow: '#ffd93d',
      blue: '#6c63ff',
      magenta: '#c850c0',
      cyan: '#45b7d1',
      white: '#e0e0e0',
      brightBlack: '#5a6380',
      brightRed: '#ff8787',
      brightGreen: '#69f0ae',
      brightYellow: '#fff176',
      brightBlue: '#8c9eff',
      brightMagenta: '#ea80fc',
      brightCyan: '#80deea',
      brightWhite: '#ffffff'
    },
    scrollback: 5000
  });

  var fitAddon = new FitAddon.FitAddon();
  var webLinksAddon = new WebLinksAddon.WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  var container = document.getElementById('terminal-container');
  term.open(container);
  fitAddon.fit();

  // WebSocket connection
  var ws;
  var reconnectAttempts = 0;
  var maxReconnect = 5;

  function setStatus(state, text) {
    statusEl.className = 'status ' + state;
    statusText.textContent = text;
  }

  function connect() {
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var url = proto + '//' + location.host + '/ws';

    setStatus('connecting', 'Connecting...');
    ws = new WebSocket(url);

    ws.onopen = function() {
      setStatus('connected', 'Connected');
      reconnectAttempts = 0;
      // Send initial size
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      term.focus();
    };

    ws.onmessage = function(e) {
      term.write(e.data);
    };

    ws.onclose = function() {
      setStatus('disconnected', 'Disconnected');
      if (reconnectAttempts < maxReconnect) {
        reconnectAttempts++;
        setTimeout(connect, 2000);
      }
    };

    ws.onerror = function() {
      setStatus('disconnected', 'Error');
    };
  }

  // Send input to server
  term.onData(function(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data: data }));
    }
  });

  // Handle resize
  term.onResize(function(size) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
    }
  });

  window.addEventListener('resize', function() {
    fitAddon.fit();
  });

  // Start connection
  connect();
})();
