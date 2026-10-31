const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp', '.ico':'image/x-icon' };

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' });
  res.end(body);
}
function allowedRatingsUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Adresse URL invalide.'); }
  if (url.protocol !== 'https:' || !/(^|\.)2kratings\.com$/i.test(url.hostname)) throw new Error('Seules les adresses HTTPS de 2KRatings sont autorisées.');
  return url;
}
async function upstream(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
    headers: {
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      'Accept':'text/html,application/xhtml+xml,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language':'en-US,en;q=0.9',
      'Referer':'https://www.2kratings.com/'
    }
  });
  if (!response.ok) throw new Error('2KRatings a répondu HTTP ' + response.status + '.');
  return response;
}
async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  const parsed = new URL(req.url, 'http://' + req.headers.host);
  if (parsed.pathname === '/api/health') return send(res, 200, JSON.stringify({ ok:true, service:'2KRatings proxy' }));
  if (req.method === 'GET' && parsed.pathname === '/api/ratings') {
    try {
      const slug = (parsed.searchParams.get('slug') || '').trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return send(res, 400, JSON.stringify({ error:'Nom de joueur invalide.' }));
      const target = allowedRatingsUrl('https://www.2kratings.com/' + slug);
      const response = await upstream(target);
      const html = await response.text();
      if (html.length > 8 * 1024 * 1024) return send(res, 502, JSON.stringify({ error:'La page reçue est trop volumineuse.' }));
      return send(res, 200, html, 'text/html; charset=utf-8');
    } catch (error) { return send(res, 502, JSON.stringify({ error:error.message || 'Impossible de récupérer la page 2KRatings.' })); }
  }
  if (req.method === 'POST' && parsed.pathname === '/api/save-image') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16 * 1024 * 1024) return send(res, 413, JSON.stringify({ error:'Image trop volumineuse.' }));
      }
      const payload = JSON.parse(body || '{}');
      const filename = String(payload.filename || '').toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(filename)) return send(res, 400, JSON.stringify({ error:'Nom de fichier PNG invalide.' }));
      const match = String(payload.dataUrl || '').match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return send(res, 415, JSON.stringify({ error:'Seules les images PNG sont acceptées.' }));
      const bytes = Buffer.from(match[1], 'base64');
      if (!bytes.length || bytes.length > 12 * 1024 * 1024) return send(res, 413, JSON.stringify({ error:'Image PNG vide ou trop volumineuse.' }));
      const imageDir = path.join(ROOT, 'Images');
      await fs.promises.mkdir(imageDir, { recursive:true });
      await fs.promises.writeFile(path.join(imageDir, filename), bytes);
      return send(res, 200, JSON.stringify({ ok:true, image:'/Images/' + filename, replaced:true }));
    } catch (error) { return send(res, 400, JSON.stringify({ error:error.message || 'Impossible d’enregistrer la photo.' })); }
  }
  if (req.method === 'GET' && parsed.pathname === '/api/image') {
    try {
      const target = allowedRatingsUrl(parsed.searchParams.get('url') || '');
      const response = await upstream(target);
      const type = response.headers.get('content-type') || 'application/octet-stream';
      if (!type.startsWith('image/')) return send(res, 415, JSON.stringify({ error:'La ressource demandée n’est pas une image.' }));
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 12 * 1024 * 1024) return send(res, 413, JSON.stringify({ error:'Image trop volumineuse.' }));
      res.writeHead(200, { 'Content-Type':type, 'Content-Length':bytes.length, 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'*' });
      return res.end(bytes);
    } catch (error) { return send(res, 502, JSON.stringify({ error:error.message || 'Impossible de récupérer la photo.' })); }
  }

  // Le serveur Node peut aussi servir directement le jeu : http://127.0.0.1:3001
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, JSON.stringify({ error:'Méthode non autorisée.' }));
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(ROOT, '.' + pathname);
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) return send(res, 403, JSON.stringify({ error:'Accès refusé.' }));
  fs.readFile(file, (error, data) => {
    if (error) return send(res, 404, 'Fichier introuvable.', 'text/plain; charset=utf-8');
    res.writeHead(200, { 'Content-Type':MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-cache' });
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  });
}
http.createServer((req,res) => { handle(req,res).catch(error => send(res,500,JSON.stringify({error:error.message}))); })
  .listen(PORT, HOST, () => console.log('Simulation Basketball disponible sur http://' + HOST + ':' + PORT));
