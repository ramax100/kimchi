(function() {
  'use strict';

  var statusEl = document.getElementById('status');
  var statusText = document.getElementById('status-text');
  var tapHint = document.getElementById('tap-hint');
  var quickCmds = document.getElementById('quick-cmds');

  // Create terminal with mobile-friendly settings
  var term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    lineHeight: 1.3,
    allowTransparency: true,
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
    scrollback: 5000,
    convertEol: true
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
  var maxReconnect = 10;
  var connected = false;

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
      connected = true;
      tapHint.classList.remove('show');
      // Send initial size
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      // Focus terminal
      setTimeout(function() { term.focus(); }, 200);
    };

    ws.onmessage = function(e) {
      term.write(e.data);
    };

    ws.onclose = function() {
      connected = false;
      setStatus('disconnected', 'Disconnected - reconnecting...');
      if (reconnectAttempts < maxReconnect) {
        reconnectAttempts++;
        setTimeout(connect, 2000);
      } else {
        setStatus('disconnected', 'Disconnected');
      }
    };

    ws.onerror = function() {
      connected = false;
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

  // Responsive resize
  window.addEventListener('resize', function() {
    fitAddon.fit();
  });

  // Focus on any click/tap on terminal area
  container.addEventListener('click', function() {
    term.focus();
    tapHint.classList.remove('show');
  });

  container.addEventListener('touchstart', function() {
    term.focus();
    tapHint.classList.remove('show');
  });

  // Quick command buttons
  quickCmds.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var cmd = btn.getAttribute('data-cmd');
    if (!cmd) return;
    
    // Special handling for API key button - prompt user
    if (cmd.indexOf('KIMCHI_API_KEY') !== -1) {
      var key = prompt('Paste API Key dari app.kimchi.dev/settings:');
      if (key && key.trim()) {
        cmd = 'export KIMCHI_API_KEY="' + key.trim() + '"';
      } else {
        return;
      }
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data: cmd + '\r' }));
      term.focus();
    }
  });

  // Show tap hint after a delay if not focused
  setTimeout(function() {
    if (connected && document.activeElement !== term.textarea) {
      tapHint.classList.add('show');
    }
  }, 3000);

  // Start connection
  connect();
})();
