const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||9000;
const MIME={'.html':'text/html','.js':'application/javascript','.css':'text/css'};
http.createServer((req,res)=>{
let f=path.join(__dirname,req.url==='/'?'index.html':req.url);
fs.readFile(f,(e,c)=>{if(e){res.writeHead(404);res.end('Not Found');return;}
res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});res.end(c);});
}).listen(PORT,'0.0.0.0',()=>console.log(`http://localhost:${PORT}`));
