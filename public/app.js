(function(){
var dot=document.getElementById('dot');
var term=new Terminal({cursorBlink:true,cursorStyle:'bar',fontSize:14,
  fontFamily:"'Menlo','Courier New',monospace",lineHeight:1.3,
  theme:{background:'#0c0c14',foreground:'#ddd',cursor:'#c850c0'},scrollback:10000});
var fit=new FitAddon.FitAddon();
term.loadAddon(fit);
term.open(document.getElementById('term'));
fit.fit();

var ws,ok=false;
function connect(){
  var url=(location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws';
  ws=new WebSocket(url);
  ws.onopen=function(){ok=true;dot.classList.add('on');
    ws.send(JSON.stringify({type:'resize',cols:term.cols,rows:term.rows}));term.focus();};
  ws.onmessage=function(e){term.write(e.data);};
  ws.onclose=function(){ok=false;dot.classList.remove('on');setTimeout(connect,3000);};
}
term.onData(function(d){if(ok)ws.send(JSON.stringify({type:'input',data:d}));});
term.onResize(function(s){if(ok)ws.send(JSON.stringify({type:'resize',cols:s.cols,rows:s.rows}));});
window.addEventListener('resize',function(){fit.fit();});
if(window.ResizeObserver)new ResizeObserver(function(){fit.fit();}).observe(document.getElementById('term'));
document.getElementById('term').addEventListener('click',function(){term.focus();});

function send(t){if(ok)ws.send(JSON.stringify({type:'input',data:t}));term.focus();}

document.getElementById('btns').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  var c=b.getAttribute('data-c');
  switch(c){
    case'kimchi':send('kimchi\r');break;
    case'y':send('y\r');break;
    case'n':send('n\r');break;
    case'1':send('1\r');break;
    case'2':send('2\r');break;
    case'task':var t=prompt('Perintah:');if(t)send(t+'\r');break;
    case'ferment':var f=prompt('Tugas:');if(f)send('/ferment '+f+'\r');break;
    case'key':var k=prompt('API Key:');if(k)send('export KIMCHI_API_KEY="'+k.trim()+'"\r');break;
    case'install':send('curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash\r');break;
    case'clear':term.clear();break;
  }
});
connect();
})();
