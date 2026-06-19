const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const app = express();
expressWs(app);
app.use(express.static(path.join(__dirname, 'public')));

const HOME = os.homedir();
const KIMCHI_PATHS = [
  HOME + '/.local/bin',
  HOME + '/.kimchi/bin',
  HOME + '/.kimchi',
  '/usr/local/bin'
];
const FULL_PATH = KIMCHI_PATHS.join(':') + ':/usr/bin:/bin:' + (process.env.PATH || '');

// Install Kimchi on server start
function installKimchi() {
  try {
    execSync('which kimchi', { env: { ...process.env, PATH: FULL_PATH } });
    console.log('Kimchi already installed');
  } catch {
    console.log('Installing Kimchi CLI...');
    try {
      execSync('curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash', {
        env: { ...process.env, PATH: FULL_PATH, HOME },
        stdio: 'inherit',
        timeout: 120000
      });
      console.log('Kimchi installed!');
    } catch (e) {
      console.log('Kimchi install failed:', e.message);
    }
  }
}

installKimchi();

app.ws('/ws', (ws) => {
  const shell = process.env.SHELL || '/bin/bash';

  const term = pty.spawn(shell, ['--login'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      HOME: HOME,
      BROWSER: 'none',
      PATH: FULL_PATH
    }
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
