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
      PATH: process.env.PATH + ':' + __dirname
    })
  });

  // Send welcome guide
  const welcome = [
    '\r\n',
    '\x1b[1;35m  ╔══════════════════════════════════════════════════════════╗\x1b[0m\r\n',
    '\x1b[1;35m  ║\x1b[0m  \x1b[1;36m🥬 KIMCHI TERMINAL\x1b[0m                                     \x1b[1;35m║\x1b[0m\r\n',
    '\x1b[1;35m  ╚══════════════════════════════════════════════════════════╝\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━ CARA INSTALL KIMCHI CODING ━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  1.\x1b[0m Buat akun di \x1b[1;36mhttps://app.kimchi.dev\x1b[0m\r\n',
    '\x1b[1;37m  2.\x1b[0m Buka Settings → buat API Key → copy\r\n',
    '\x1b[1;37m  3.\x1b[0m Jalankan command di bawah:\r\n',
    '\r\n',
    '\x1b[1;32m  $ curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash\x1b[0m\r\n',
    '\x1b[1;32m  $ export KIMCHI_API_KEY="paste-api-key-kamu"\x1b[0m\r\n',
    '\x1b[1;32m  $ kimchi\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━ CARA MENGGUNAKAN AGENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  Mode Chat (ketik langsung):\x1b[0m\r\n',
    '\x1b[0;90m    > buatkan website landing page\x1b[0m\r\n',
    '\x1b[0;90m    > fix bug di file server.js\x1b[0m\r\n',
    '\x1b[0;90m    > jelaskan kode ini\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  Mode Ferment (agent otonom):\x1b[0m\r\n',
    '\x1b[0;90m    /ferment Buatkan REST API lengkap dengan Express.js\x1b[0m\r\n',
    '\r\n',
    '\x1b[1;37m  Slash Commands:\x1b[0m\r\n',
    '\x1b[0;36m    /help\x1b[0m        Lihat semua command\r\n',
    '\x1b[0;36m    /ferment\x1b[0m     Mulai mode otonom\r\n',
    '\x1b[0;36m    /login\x1b[0m       Login ulang\r\n',
    '\x1b[0;36m    /bug\x1b[0m         Laporkan bug\r\n',
    '\r\n',
    '\x1b[1;37m  CLI Options:\x1b[0m\r\n',
    '\x1b[0;36m    kimchi\x1b[0m              Mulai session\r\n',
    '\x1b[0;36m    kimchi --plan\x1b[0m       Mode rencana (read-only)\r\n',
    '\x1b[0;36m    kimchi setup\x1b[0m        Setup awal\r\n',
    '\x1b[0;36m    kimchi update\x1b[0m       Update versi\r\n',
    '\r\n',
    '\x1b[1;33m  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\r\n',
    '\x1b[0;90m  Ketik \x1b[1;32mhelp-kimchi\x1b[0;90m untuk tampilkan panduan ini lagi\x1b[0m\r\n',
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
