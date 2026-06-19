(function(){
var chat = document.getElementById('chat');
var input = document.getElementById('input');
var btnSend = document.getElementById('btn-send');
var btnClear = document.getElementById('btn-clear');
var btnConnect = document.getElementById('btn-connect');
var apiKeyInput = document.getElementById('api-key');
var providerSelect = document.getElementById('provider');
var customUrl = document.getElementById('custom-url');
var notif = document.getElementById('notif');
var messages = [];
var connected = false;

var PROVIDERS = {
  kimchi: { url: 'https://api.kimchi.dev/v1', model: 'kimchi-coder-v2' },
  openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  openrouter: { url: 'https://openrouter.ai/api/v1', model: 'moonshotai/kimi-dev-72b:free' },
  custom: { url: '', model: 'gpt-4o-mini' }
};

// Load saved settings
var saved = JSON.parse(localStorage.getItem('kimchi_settings') || '{}');
if (saved.provider) providerSelect.value = saved.provider;
if (saved.key) apiKeyInput.value = saved.key;
if (saved.customUrl) customUrl.value = saved.customUrl;
toggleCustom();

providerSelect.addEventListener('change', toggleCustom);
function toggleCustom() {
  customUrl.style.display = providerSelect.value === 'custom' ? '' : 'none';
}

btnConnect.addEventListener('click', testConnection);

async function testConnection() {
  var key = apiKeyInput.value.trim();
  if (!key) { showNotif('fail', '❌ Masukkan API Key!'); return; }

  var prov = providerSelect.value;
  var baseUrl = prov === 'custom' ? customUrl.value.trim() : PROVIDERS[prov].url;
  var model = PROVIDERS[prov].model;

  if (!baseUrl) { showNotif('fail', '❌ Masukkan Base URL!'); return; }

  btnConnect.disabled = true;
  btnConnect.textContent = 'Testing...';

  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
        apiKey: key,
        baseUrl: baseUrl,
        model: model
      })
    });

    if (res.ok) {
      connected = true;
      localStorage.setItem('kimchi_settings', JSON.stringify({
        provider: prov, key: key, customUrl: customUrl.value.trim()
      }));
      showNotif('success', '✅ Berhasil terkoneksi! Provider: ' + prov);
      btnConnect.textContent = '✓ OK';
    } else {
      connected = false;
      var err = await res.json().catch(function(){ return {error:'Error'}; });
      showNotif('fail', '❌ Gagal: ' + (err.error || '').slice(0, 100));
      btnConnect.textContent = 'Koneksi';
    }
  } catch(e) {
    connected = false;
    showNotif('fail', '❌ Error: ' + e.message);
    btnConnect.textContent = 'Koneksi';
  }
  btnConnect.disabled = false;
}

function showNotif(type, msg) {
  notif.className = 'notif ' + type;
  notif.textContent = msg;
  setTimeout(function() { notif.className = 'notif'; }, 6000);
}

input.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});
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
  if (role === 'ai') div.innerHTML = fmt(text);
  else div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function fmt(text) {
  var s = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return s;
}

async function send() {
  var text = input.value.trim();
  if (!text) return;
  if (!connected) { showNotif('fail', '❌ Tekan Koneksi dulu!'); return; }

  var prov = providerSelect.value;
  var key = apiKeyInput.value.trim();
  var baseUrl = prov === 'custom' ? customUrl.value.trim() : PROVIDERS[prov].url;
  var model = PROVIDERS[prov].model;

  addMsg('user', text);
  messages.push({ role: 'user', content: text });
  input.value = ''; input.style.height = 'auto';
  btnSend.disabled = true;

  var typing = document.createElement('div');
  typing.className = 'typing'; typing.id = 'typing';
  typing.innerHTML = '<span>●</span><span>●</span><span>●</span>';
  chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;

  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, apiKey: key, baseUrl: baseUrl, model: model })
    });
    var t = document.getElementById('typing'); if (t) t.remove();

    if (!res.ok) {
      var errData = await res.json().catch(function(){ return {error:'Error'}; });
      addMsg('error', '⚠️ ' + (errData.error || '').slice(0, 200));
      btnSend.disabled = false; return;
    }

    var data = await res.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (reply) { messages.push({ role: 'assistant', content: reply }); addMsg('ai', reply); }
    else addMsg('error', '⚠️ No response');
  } catch(e) {
    var t2 = document.getElementById('typing'); if (t2) t2.remove();
    addMsg('error', '⚠️ ' + e.message);
  }
  btnSend.disabled = false; input.focus();
}
})();
