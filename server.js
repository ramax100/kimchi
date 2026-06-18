const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const path = require('path');

const app = express();
expressWs(app);

app.use(express.static(path.join(__dirname, 'public')));

app.ws('/ws', (ws, req) => {
  const shell = process.env.SHELL || '/bin/bash';
  const term = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || '/root',
    env: Object.assign({}, process.env, {
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      PATH: [
        process.env.HOME + '/.local/bin',
        process.env.HOME + '/.kimchi/bin',
        '/usr/local/bin',
        __dirname,
        process.env.PATH
      ].join(':')
    })
  });

  // Send welcome guide
  const welcome = [
    '\r\n',
    '\x1b[1;35m  ╔══════════════════════════════════════════════════════════╗\x1b[0m\r\n',
    '\x1b[1;35m  ║\x1b[0m  \x1b[1;36m🥬 KIMCHI TERMINAL - Siap Digunakan!\x1b[0m                   \x1b[1;35m║\x1b[0m\r\n',
    '\x1b[1;35m  ╚══════════════════════════════════════════════════════════╝\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━ LANGKAH CEPAT (Tap tombol di bawah layar) ━━━━━━━━━━━\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  Step 1:\x1b[0m Tap tombol \x1b[1;32m⬇️ Install Kimchi\x1b[0m (tunggu selesai)\r\n',
    '\x1b[1;37m  Step 2:\x1b[0m Tap tombol \x1b[1;32m🔑 Set API Key\x1b[0m (paste key)\r\n',
    '\x1b[1;37m  Step 3:\x1b[0m Tap tombol \x1b[1;32m🥬 Run Kimchi\x1b[0m\r\n',
    '\r\n',
    '\x1b[0;90m  Belum punya API Key?\x1b[0m\r\n',
    '\x1b[0;90m  → Daftar di https://app.kimchi.dev\x1b[0m\r\n',
    '\x1b[0;90m  → Buka Settings → API Keys → Create\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━ ATAU KETIK MANUAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;32m  $ curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash\x1b[0m\r\n',
    '\x1b[1;32m  $ export KIMCHI_API_KEY="paste-api-key-kamu"\x1b[0m\r\n',
    '\x1b[1;32m  $ kimchi\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\x1b[0;90m  Ketik \x1b[1;32mhelp-kimchi.sh\x1b[0;90m untuk panduan lengkap\x1b[0m\r\n',
    '\r\n',
  ].join('');

  setTimeout(() => {
    try { ws.send(welcome); } catch (e) {}
  }, 500);

  term.onData((data) => {
    try { ws.send(data); } catch (e) {}
  });

  term.onExit(() => {
    try { ws.close(); } catch (e) {}
  });

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.type === 'resize') {
        term.resize(parsed.cols, parsed.rows);
      } else if (parsed.type === 'input') {
        term.write(parsed.data);
      }
    } catch (e) {
      term.write(msg);
    }
  });

  ws.on('close', () => {
    term.kill();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kimchi Terminal running on http://localhost:${PORT}`);
});
