(function(){
var chat = document.getElementById('chat');
var input = document.getElementById('input');
var btnSend = document.getElementById('btn-send');
var btnClear = document.getElementById('btn-clear');
var btnConnect = document.getElementById('btn-connect');
var apiKeyInput = document.getElementById('api-key');
var notif = document.getElementById('notif');
var messages = [];
var connected = false;

// Load saved key
var savedKey = localStorage.getItem('kimchi_api_key') || '';
if (savedKey) {
  apiKeyInput.value = savedKey;
  testConnection(savedKey, true);
}

// Connect button
btnConnect.addEventListener('click', function() {
  var key = apiKeyInput.value.trim();
  if (!key) { showNotif('fail', '❌ Masukkan API Key dulu!'); return; }
  testConnection(key, false);
});

// Test connection
async function testConnection(key, silent) {
  btnConnect.disabled = true;
  btnConnect.textContent = '...';
  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], apiKey: key })
    });
    if (res.ok) {
      connected = true;
      localStorage.setItem('kimchi_api_key', key);
      showNotif('success', '✅ Berhasil terkoneksi ke Kimchi AI!');
      btnConnect.textContent = '✓ OK';
    } else {
      connected = false;
      var err = await res.text();
      if (!silent) showNotif('fail', '❌ Gagal koneksi: API Key tidak valid atau server error');
      btnConnect.textContent = 'Koneksi';
    }
  } catch(e) {
    connected = false;
    if (!silent) showNotif('fail', '❌ Gagal koneksi: ' + e.message);
    btnConnect.textContent = 'Koneksi';
  }
  btnConnect.disabled = false;
}

function showNotif(type, msg) {
  notif.className = 'notif ' + type;
  notif.textContent = msg;
  setTimeout(function() { notif.className = 'notif'; }, 5000);
}

// Auto-resize textarea
input.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Enter to send
input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});

btnSend.addEventListener('click', send);
btnClear.addEventListener('click', function() {
  messages = [];
  chat.innerHTML = '<div class="msg system">Chat cleared.</div>';
});

function addMsg(role, text) {
  var div = document.createElement('div');
  div.className = 'msg ' + role;
  if (role === 'ai') div.innerHTML = formatCode(text);
  else if (role === 'error') div.textContent = text;
  else div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function formatCode(text) {
  var s = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return s;
}

async function send() {
  var text = input.value.trim();
  if (!text) return;

  var key = apiKeyInput.value.trim();
  if (!key) { showNotif('fail', '❌ Masukkan API Key dan tekan Koneksi dulu!'); return; }
  if (!connected) { showNotif('fail', '❌ Tekan tombol Koneksi dulu!'); return; }

  addMsg('user', text);
  messages.push({ role: 'user', content: text });
  input.value = ''; input.style.height = 'auto';
  btnSend.disabled = true;

  // Typing indicator
  var typing = document.createElement('div');
  typing.className = 'typing'; typing.id = 'typing';
  typing.innerHTML = '<span>●</span><span>●</span><span>●</span>';
  chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;

  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, apiKey: key })
    });
    var t = document.getElementById('typing'); if (t) t.remove();

    if (!res.ok) {
      var errData = await res.json().catch(function(){ return {error:'Error '+res.status}; });
      addMsg('error', '⚠️ ' + (errData.error || 'Request failed'));
      btnSend.disabled = false; return;
    }

    var data = await res.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (reply) {
      messages.push({ role: 'assistant', content: reply });
      addMsg('ai', reply);
    } else {
      addMsg('error', '⚠️ Empty response');
    }
  } catch(e) {
    var t2 = document.getElementById('typing'); if (t2) t2.remove();
    addMsg('error', '⚠️ ' + e.message);
  }
  btnSend.disabled = false;
  input.focus();
}
})();
