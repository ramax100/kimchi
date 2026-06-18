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
      COLORTERM: 'truecolor'
    })
  });

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
