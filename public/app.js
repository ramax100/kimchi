(function(){
var dot = document.getElementById('dot');
var term = new Terminal({
  cursorBlink:true, cursorStyle:'bar', fontSize:14,
  fontFamily:"'Menlo','Courier New',monospace",
  lineHeight:1.3,
  theme:{background:'#0c0c14',foreground:'#ddd',cursor:'#c850c0',
    green:'#4ecdc4',yellow:'#ffd93d',blue:'#7c8cff',magenta:'#c850c0',cyan:'#45b7d1',
    red:'#ff6b6b',white:'#ddd',brightBlack:'#666'},
  scrollback:10000
});
var fit = new FitAddon.FitAddon();
term.loadAddon(fit);
term.open(document.getElementById('term'));
fit.fit();

var ws, ok=false;
function connect(){
  var url=(location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws';
  ws=new WebSocket(url);
  ws.onopen=function(){ok=true;dot.classList.add('on');
    ws.send(JSON.stringify({type:'resize',cols:term.cols,rows:term.rows}));
    term.focus();};
  ws.onmessage=function(e){term.write(e.data);};
  ws.onclose=function(){ok=false;dot.classList.remove('on');setTimeout(connect,3000);};
  ws.onerror=function(){};
}

term.onData(function(d){if(ok)ws.send(JSON.stringify({type:'input',data:d}));});
term.onResize(function(s){if(ok)ws.send(JSON.stringify({type:'resize',cols:s.cols,rows:s.rows}));});
window.addEventListener('resize',function(){fit.fit();});
if(window.ResizeObserver){new ResizeObserver(function(){fit.fit();}).observe(document.getElementById('term'));}

function send(text){if(ok)ws.send(JSON.stringify({type:'input',data:text+'\r'}));term.focus();}

document.getElementById('btns').addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b)return;
  var c=b.getAttribute('data-c');
  switch(c){
    case 'run':
      send('source ~/.kimchi_env 2>/dev/null; kimchi');break;
    case 'yes': send('yes');break;
    case 'no': send('no');break;
    case '1': send('1');break;
    case '2': send('2');break;
    case 'task':
      var t=prompt('Ketik perintah untuk Kimchi:');
      if(t&&t.trim())send(t.trim());break;
    case 'ferment':
      var f=prompt('Deskripsikan tugas untuk Ferment:');
      if(f&&f.trim())send('/ferment '+f.trim());break;
    case 'install':
      send('curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash');break;
    case 'key':
      var k=prompt('Paste API Key dari app.kimchi.dev:');
      if(k&&k.trim())send('export KIMCHI_API_KEY="'+k.trim()+'" && echo KIMCHI_API_KEY='+k.trim()+' > ~/.kimchi_env && echo OK');break;
    case 'clear': term.clear();term.focus();break;
  }
});

document.getElementById('term').addEventListener('click',function(){term.focus();});
connect();
})();
