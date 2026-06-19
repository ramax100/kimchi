const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const path = require('path');
const os = require('os');

const app = express();
expressWs(app);
app.use(express.static(path.join(__dirname, 'public')));

const HOME = os.homedir();

app.ws('/ws', (ws) => {
  const shell = process.env.SHELL || '/bin/bash';

  const term = pty.spawn(shell, ['--login'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: HOME,
    env: Object.assign({}, process.env, {
      TERM: 'xterm-256color',
      HOME: HOME,
      BROWSER: 'none',
      PATH: HOME + '/.local/bin:' + HOME + '/.kimchi/bin:' + HOME + '/.kimchi:/usr/local/bin:/usr/bin:/bin:' + (process.env.PATH || '')
    })
  });

  term.onData(d => { try { ws.send(d); } catch(e){} });
  term.onExit(() => { try { ws.close(); } catch(e){} });

  ws.on('message', msg => {
    try {
      const m = JSON.parse(msg);
      if (m.type === 'resize') term.resize(m.cols, m.rows);
      else if (m.type === 'input') term.write(m.data);
    } catch(e) { term.write(msg); }
  });

  ws.on('close', () => term.kill());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT));
