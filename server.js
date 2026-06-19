const express = require('express');
const expressWs = require('express-ws');
const pty = require('node-pty');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
expressWs(app);
app.use(express.static(path.join(__dirname, 'public')));

const HOME = os.homedir();
const BIN_DIR = HOME + '/.local/bin';
const KIMCHI_BIN = BIN_DIR + '/kimchi';
const FULL_PATH = BIN_DIR + ':' + HOME + '/.kimchi/bin:' + HOME + '/.kimchi:/usr/local/bin:/usr/bin:/bin:' + (process.env.PATH || '');

// Install Kimchi binary directly
function installKimchi() {
  // Skip if already exists
  if (fs.existsSync(KIMCHI_BIN)) {
    console.log('Kimchi found at ' + KIMCHI_BIN);
    return;
  }

  console.log('Installing Kimchi...');
  try {
    // Create bin directory
    execSync('mkdir -p ' + BIN_DIR);

    // Download via GitHub releases install script
    execSync(
      'curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | HOME=' + HOME + ' bash',
      { env: { ...process.env, HOME, PATH: FULL_PATH }, stdio: 'inherit', timeout: 120000 }
    );
  } catch(e) {
    console.log('Install script failed, trying direct download...');
    try {
      // Fallback: download tar.gz from SourceForge mirror
      execSync([
        'mkdir -p /tmp/kimchi-dl',
        'curl -fsSL -o /tmp/kimchi-dl/kimchi.tar.gz "https://github.com/getkimchi/kimchi/releases/latest/download/kimchi_linux_amd64.tar.gz"',
        'tar -xzf /tmp/kimchi-dl/kimchi.tar.gz -C /tmp/kimchi-dl/',
        'find /tmp/kimchi-dl -name "kimchi" -type f -exec cp {} ' + KIMCHI_BIN + ' \\;',
        'chmod +x ' + KIMCHI_BIN
      ].join(' && '), { stdio: 'inherit', timeout: 120000 });
    } catch(e2) {
      console.log('Direct download also failed:', e2.message);
      console.log('User will need to install manually in terminal');
    }
  }

  // Verify
  try {
    const version = execSync(KIMCHI_BIN + ' --version', { env: { PATH: FULL_PATH } }).toString().trim();
    console.log('Kimchi ready: ' + version);
  } catch(e) {
    console.log('Kimchi binary not verified');
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
