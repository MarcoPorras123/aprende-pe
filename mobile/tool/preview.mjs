// Local visual preview of the same Flutter widgets used by Android and iOS.
import {createServer, request as proxyRequest} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../build/web/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.otf':'font/otf','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 let path;
 try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(path.startsWith('/api/v3/')){
  const proxy=proxyRequest({hostname:'127.0.0.1',port:4174,path:req.url,method:req.method,headers:req.headers},upstream=>{res.writeHead(upstream.statusCode,upstream.headers);upstream.pipe(res);});
  proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'El servidor de aprendizaje no está disponible. Ejecuta npm start en la raíz del repositorio (puerto 4174).'}));});
  req.pipe(proxy);return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 try{
  let file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end('No encontrado');}
});
server.listen(4175,'127.0.0.1',()=>console.log('Aprende Pe! · Flutter → http://127.0.0.1:4175/'));
