import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import chat from '../api/chat.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/chat'){
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>40000){res.writeHead(413);res.end();return;}}
      try{req.body=JSON.parse(body||'{}');}catch{res.writeHead(400);res.end();return;}
      res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};await chat(req,res);return;
    }
    let pathname=decodeURIComponent(url.pathname);
    if(!/^\/(assets\/|images\/|blog\/|products\/|stores\/|index\.html$|shipping-return(?:\.html)?$|sitemap\.xml$|robots\.txt$|404\.html$|$)/.test(pathname))throw new Error('not-found');
    const relative=path.normalize(pathname).replace(/^[/\\]+/,'');let file=path.resolve(root,relative);
    if((file!==path.resolve(root)&&!file.startsWith(root))||relative.includes('..'))throw new Error('not-found');
    let info=await stat(file).catch(()=>null);
    if(info?.isDirectory()){file=path.join(file,'index.html');info=await stat(file).catch(()=>null);}
    else if(path.extname(file)===''){file+='.html';info=await stat(file).catch(()=>null);}
    if(!info?.isFile())throw new Error('not-found');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(root,'404.html')));}
});
server.listen(4317,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4317'));
