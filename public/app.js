(function(){
var chat = document.getElementById('chat');
var input = document.getElementById('input');
var btnSend = document.getElementById('btn-send');
var btnClear = document.getElementById('btn-clear');
var apiKeyInput = document.getElementById('api-key');
var messages = [];

var savedKey = localStorage.getItem('kimchi_key') || '';
if (savedKey) apiKeyInput.value = savedKey;

apiKeyInput.addEventListener('change', function() {
  localStorage.setItem('kimchi_key', apiKeyInput.value.trim());
});

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
  div.innerHTML = role === 'ai' ? fmt(text) : esc(text);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function fmt(text) {
  var s = esc(text);
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  return s;
}

async function send() {
  var text = input.value.trim();
  if (!text) return;
  var key = apiKeyInput.value.trim();
  if (!key) { addMsg('error', 'Masukkan API Key dulu!'); apiKeyInput.focus(); return; }
  localStorage.setItem('kimchi_key', key);

  addMsg('user', text);
  messages.push({ role: 'user', content: text });
  input.value = ''; input.style.height = 'auto';
  btnSend.disabled = true;

  var typing = document.createElement('div');
  typing.className = 'typing'; typing.id = 'typing';
  typing.innerHTML = '<span>●</span><span>●</span><span>●</span> Thinking...';
  chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;

  try {
    var res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, apiKey: key })
    });
    var t = document.getElementById('typing'); if (t) t.remove();

    if (!res.ok) {
      var err = await res.json().catch(function(){ return {error:'Error '+res.status}; });
      addMsg('error', err.error || 'Request failed');
      btnSend.disabled = false; return;
    }

    var data = await res.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (reply) { messages.push({role:'assistant',content:reply}); addMsg('ai', reply); }
    else addMsg('error', 'Empty response');
  } catch(e) {
    var t2 = document.getElementById('typing'); if (t2) t2.remove();
    addMsg('error', e.message);
  }
  btnSend.disabled = false; input.focus();
}
})();
