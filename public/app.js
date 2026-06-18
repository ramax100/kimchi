(function() {
  'use strict';

  var statusEl = document.getElementById('status');
  var statusText = document.getElementById('status-text');
  var tapHint = document.getElementById('tap-hint');
  var quickCmds = document.getElementById('quick-cmds');

  // Create terminal with comfortable settings
  var term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorWidth: 2,
    fontSize: 15,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Menlo', 'Courier New', monospace",
    fontWeight: '400',
    fontWeightBold: '600',
    lineHeight: 1.4,
    letterSpacing: 0.5,
    allowTransparency: true,
    theme: {
      background: '#0a0a0f',
      foreground: '#d4d4dc',
      cursor: '#c850c0',
      cursorAccent: '#0a0a0f',
      selectionBackground: 'rgba(200, 80, 192, 0.25)',
      selectionForeground: '#ffffff',
      black: '#1e1e2e',
      red: '#ff6b6b',
      green: '#4ecdc4',
      yellow: '#ffd93d',
      blue: '#7c8cff',
      magenta: '#c850c0',
      cyan: '#45b7d1',
      white: '#d4d4dc',
      brightBlack: '#6a6a8a',
      brightRed: '#ff8787',
      brightGreen: '#69f0ae',
      brightYellow: '#fff176',
      brightBlue: '#a5b4fc',
      brightMagenta: '#ea80fc',
      brightCyan: '#80deea',
      brightWhite: '#ffffff'
    },
    scrollback: 10000,
    convertEol: true
  });

  var fitAddon = new FitAddon.FitAddon();
  var webLinksAddon = new WebLinksAddon.WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  var container = document.getElementById('terminal-container');
  term.open(container);
  fitAddon.fit();

  // Refit when visual viewport changes (mobile keyboard open/close)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function() {
      fitAddon.fit();
    });
  }

  // ResizeObserver for container size changes
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function() {
      fitAddon.fit();
    });
    ro.observe(container);
  }

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
    
    // Special handling for API key button
    if (cmd === 'set-key') {
      var key = prompt('Paste API Key dari app.kimchi.dev/settings :');
      if (key && key.trim()) {
        var commands = 'export KIMCHI_API_KEY="' + key.trim() + '" && echo "KIMCHI_API_KEY=' + key.trim() + '" > ~/.kimchi_env && echo "✅ API Key saved!"';
        ws.send(JSON.stringify({ type: 'input', data: commands + '\r' }));
      }
      term.focus();
      return;
    }
    
    // Special handling for Run Kimchi - load env first
    if (cmd === 'run-kimchi') {
      var runCmd = 'source ~/.kimchi_env 2>/dev/null; export BROWSER=none; export CI=true; export KIMCHI_NON_INTERACTIVE=1; kimchi';
      ws.send(JSON.stringify({ type: 'input', data: runCmd + '\r' }));
      term.focus();
      return;
    }
    
    // Special handling for prompt/task button
    if (cmd === 'prompt-task') {
      var task = prompt('Ketik perintah untuk Kimchi agent:');
      if (task && task.trim()) {
        ws.send(JSON.stringify({ type: 'input', data: task.trim() + '\r' }));
      }
      term.focus();
      return;
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
