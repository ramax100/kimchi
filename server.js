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
      BROWSER: 'none',
      CI: 'true',
      KIMCHI_NON_INTERACTIVE: '1',
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
    '\x1b[1;35m  ╔═══════════════════════════════════════════════════════════╗\x1b[0m\r\n',
    '\x1b[1;35m  ║\x1b[0m  \x1b[1;36m🥬 KIMCHI TERMINAL\x1b[0m                                      \x1b[1;35m║\x1b[0m\r\n',
    '\x1b[1;35m  ╚═══════════════════════════════════════════════════════════╝\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━ CARA PAKAI (Tap tombol di bawah) ━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  Step 1:\x1b[0m Tap \x1b[1;32m⬇️ Install Kimchi\x1b[0m → tunggu selesai\r\n',
    '\x1b[1;37m  Step 2:\x1b[0m Tap \x1b[1;32m🔑 Set API Key\x1b[0m  → paste key\r\n',
    '\x1b[1;37m  Step 3:\x1b[0m Tap \x1b[1;32m🥬 Run Kimchi\x1b[0m   → agent mulai!\r\n',
    '\r\n',
    '\x1b[0;90m  Catatan:\x1b[0m\r\n',
    '\x1b[0;90m  • Buat akun & API Key di: https://app.kimchi.dev\x1b[0m\r\n',
    '\x1b[0;90m  • Jika Kimchi minta pilihan, ketik angka lalu Enter\x1b[0m\r\n',
    '\x1b[0;90m  • Ketik help-kimchi.sh untuk panduan lengkap\x1b[0m\r\n',
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
