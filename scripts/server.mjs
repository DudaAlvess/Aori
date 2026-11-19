import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, hashPassword, verifyPassword, validCpf, newSession, digest, sessionAge } from './database.mjs';
import { stays } from '../public/stays.js';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const failure=(status,message)=>Object.assign(new Error(message),{status});
const clean=(value,max=200)=>typeof value==='string'?value.trim().slice(0,max+1):'';
const validEmail=email=>email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function validReservationDate(value) {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 9999) return false;

  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day;
}

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function json(response,status,data,extra={}) {
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});
  response.end(JSON.stringify(data));
}
async function readJson(request) {
  if(!(request.headers['content-type']||'').toLowerCase().startsWith('application/json')) throw failure(415,'Envie os dados em formato JSON.');
  let size=0;
  const chunks=[];
  for await(const chunk of request) {
    size+=chunk.length;
    if(size>16384) throw failure(413,'Os dados enviados excedem o limite permitido.');
    chunks.push(chunk);
  }
  try {
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
    if(!body || typeof body!=='object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw failure(400,'Os dados enviados não são válidos.'); }
}
export function createAoriServer({databasePath}={}) {
  const db=openDatabase(databasePath);
  const attempts=new Map();
  const cookieToken=request=>{
    const token=(request.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('aori_session='))?.slice(13);
    return /^[a-f0-9]{64}$/.test(token||'')?token:null;
  };
  const favoritesFor=id=>db.prepare('SELECT ID_Hospedagem FROM Favoritos WHERE ID_Cliente=? ORDER BY Criado_Em,ID_Hospedagem').all(id).map(row=>row.ID_Hospedagem);
  const sessionUser=request=>{
    const token=cookieToken(request);
    if(!token) return null;
    const user=db.prepare('SELECT c.ID AS id,c.Nome AS nome,c.Email AS email FROM Sessoes_Clientes s JOIN Clientes c ON c.ID=s.ID_Cliente WHERE s.Token_Hash=? AND s.Expira_Em>?').get(digest(token),Date.now());
    return user?{...user}:null;
  };
  const revoke=request=>{const token=cookieToken(request);if(token) db.prepare('DELETE FROM Sessoes_Clientes WHERE Token_Hash=?').run(digest(token));};
  const cookie=token=>`aori_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionAge/1000}`;
  const state=user=>({user,favorites:user?favoritesFor(user.id):[]});
  const rateCheck=request=>{
    const now=Date.now(),key=request.socket.remoteAddress;
    for(const [ip,item] of attempts) if(item.until<now) attempts.delete(ip);
    const item=attempts.get(key)||{count:0,until:now+15*60*1000};
    item.count++;attempts.set(key,item);
    if(item.count>30) throw failure(429,'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
  };
  const server=http.createServer(async(request,response)=>{
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Referrer-Policy','same-origin');
    response.setHeader('X-Frame-Options','DENY');
    try {
      const host=new URL(`http://${request.headers.host||''}`);
      if(!['localhost','127.0.0.1','[::1]'].includes(host.hostname)||Number(host.port||80)!==server.address()?.port) throw failure(403,'Origem não permitida.');
      const url=new URL(request.url,host);
      if(url.pathname.startsWith('/api/')) {
        if(!['GET','POST','PUT','DELETE'].includes(request.method)) throw failure(405,'Método não permitido.');
        if(request.headers['sec-fetch-site']==='cross-site'||(request.headers.origin&&request.headers.origin!==host.origin)) throw failure(403,'Origem não permitida.');
        const path=url.pathname;
        if(path==='/api/me'&&request.method==='GET') return json(response,200,state(sessionUser(request)));
        if((path==='/api/register'||path==='/api/login')&&request.method==='POST') {
          rateCheck(request);
          const body=await readJson(request);
          const email=clean(body.email,254).toLowerCase(),password=typeof body.senha==='string'?body.senha:'';
          if(!validEmail(email)||password.length<10||password.length>128) throw failure(400,'Informe um e-mail válido e uma senha de 10 a 128 caracteres.');
          let user;
          if(path==='/api/register') {
            const name=clean(body.nome,120),cpf=clean(body.cpf,20).replace(/[.\-\s]/g,''),phone=clean(body.telefone,30).replace(/[()\-+\s]/g,'');
            if(!name||name.length>120||!validCpf(cpf)||!/^\d{10,15}$/.test(phone)) throw failure(400,'Confira o nome, o CPF e o telefone com DDD.');
            const hash=await hashPassword(password);
            db.exec('BEGIN IMMEDIATE');
            try {
              const result=db.prepare('INSERT INTO Clientes (Nome,CPF,Telefone,Email) VALUES (?,?,?,?)').run(name,cpf,phone,email);
              const id=Number(result.lastInsertRowid);
              db.prepare('INSERT INTO Contas_Clientes (ID_Cliente,Login,Senha) VALUES (?,?,?)').run(id,email,hash);
              db.exec('COMMIT'); user={id,nome:name,email};
            } catch(error) {
              db.exec('ROLLBACK');
              if(/UNIQUE constraint failed/.test(error.message)) throw failure(409,'Já existe um cadastro com esse e-mail ou CPF.');
              throw error;
            }
          } else {
            const row=db.prepare('SELECT c.ID AS id,c.Nome AS nome,c.Email AS email,a.Senha AS hash FROM Contas_Clientes a JOIN Clientes c ON c.ID=a.ID_Cliente WHERE a.Login=? COLLATE NOCASE').get(email);
            if(!await verifyPassword(password,row?.hash)) throw failure(401,'E-mail ou senha incorretos.');
            user={id:row.id,nome:row.nome,email:row.email};
          }
          revoke(request);
          const token=newSession(db,user.id);
          return json(response,path==='/api/register'?201:200,state(user),{'Set-Cookie':cookie(token)});
        }
        if(path==='/api/logout'&&request.method==='POST') {
          await readJson(request);revoke(request);
          return json(response,200,state(null),{'Set-Cookie':'aori_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});
        }


        if (path === '/api/reservations' &&
            request.method === 'GET') {
          const user = sessionUser(request);

          if (!user) {
            throw failure(401, 'Entre na sua conta para consultar suas reservas.');
          }

          const reservations = db.prepare(`
            SELECT
              r.ID AS id,
              r.ID_Hospedagem AS stayId,
              h.Nome AS stayName,
              r.Data_Entrada AS checkin,
              r.Data_Saida AS checkout,
              r.Hospedes AS guests,
              r.Criado_Em AS createdAt
            FROM Reservas r
            JOIN Hospedagens h ON h.ID = r.ID_Hospedagem
            WHERE r.ID_Cliente = ?
            ORDER BY r.Criado_Em DESC, r.ID DESC
          `).all(user.id);

          return json(response, 200, { reservations });
        }

        if (path === '/api/reservations' &&
            request.method === 'POST') {
          const user = sessionUser(request);

          if (!user) {
            throw failure(401, 'Entre na sua conta para reservar uma estadia.');
          }

          const body = await readJson(request);
          const { stayId, checkin, checkout, guests } = body;

          const stay = stays.find(item => item.id === stayId);

          if (!stay) {
            throw failure(404, 'Essa estadia não foi encontrada.');
          }

          if (!validReservationDate(checkin) ||
              !validReservationDate(checkout) ||
              checkin < todayLocal() ||
              checkout <= checkin) {
            throw failure(400, 'Informe um período de estadia válido.');
          }

          if (!Number.isInteger(guests) ||
              guests < 1 ||
              guests > stay.guests) {
            throw failure(400, 'Quantidade de hóspedes inválida.');
          }

          db.exec('BEGIN IMMEDIATE');

          try {
            const conflict = db.prepare(`
              SELECT ID
              FROM Reservas
              WHERE ID_Hospedagem = ?
                AND Data_Entrada < ?
                AND Data_Saida > ?
              LIMIT 1
            `).get(stayId, checkout, checkin);

            if (conflict) {
              throw failure(409, 'Essa hospedagem já está reservada nesse período.');
            }

            const result = db.prepare(`
              INSERT INTO Reservas (
                ID_Cliente,
                ID_Hospedagem,
                Data_Entrada,
                Data_Saida,
                Hospedes
              ) VALUES (?, ?, ?, ?, ?)
            `).run(user.id, stayId, checkin, checkout, guests);

            const reservation = db.prepare(`
              SELECT
                ID AS id,
                ID_Hospedagem AS stayId,
                Data_Entrada AS checkin,
                Data_Saida AS checkout,
                Hospedes AS guests,
                Criado_Em AS createdAt
              FROM Reservas
              WHERE ID = ?
            `).get(result.lastInsertRowid);

            db.exec('COMMIT');

            return json(response, 201, { reservation });
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
        }


        if(path==='/api/favorites'&&request.method==='GET') {
          const user=sessionUser(request);
          if(!user) throw failure(401,'Entre na sua conta para ver seus lugares salvos.');
          return json(response,200,{favorites:favoritesFor(user.id)});
        }
        const favorite=/^\/api\/favorites\/([^/]+)$/.exec(path);
        if(favorite&&['PUT','DELETE'].includes(request.method)) {
          const user=sessionUser(request);
          if(!user) throw failure(401,'Entre na sua conta para salvar seus lugares.');
          await readJson(request);
          const id=decodeURIComponent(favorite[1]);
          if(!db.prepare('SELECT ID FROM Hospedagens WHERE ID=?').get(id)) throw failure(404,'Essa estadia não foi encontrada.');
          if(request.method==='PUT') db.prepare('INSERT INTO Favoritos (ID_Cliente,ID_Hospedagem) VALUES (?,?) ON CONFLICT DO NOTHING').run(user.id,id);
          else db.prepare('DELETE FROM Favoritos WHERE ID_Cliente=? AND ID_Hospedagem=?').run(user.id,id);
          return json(response,200,{favorites:favoritesFor(user.id)});
        }
        throw failure(404,'Recurso não encontrado.');
      }
      if(!['GET','HEAD'].includes(request.method)) throw failure(405,'Método não permitido.');
      const pathname=decodeURIComponent(url.pathname);
      const file=resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
      const inside=relative(root,file);
      if(inside.startsWith('..')||isAbsolute(inside)) throw failure(404,'Página não encontrada.');
      const info=await stat(file);
      if(!info.isFile()) throw failure(404,'Página não encontrada.');
      const actual=relative(await realpath(root),await realpath(file));
      if(actual.startsWith('..')||isAbsolute(actual)) throw failure(404,'Página não encontrada.');
      const bytes=request.method==='HEAD'?null:await readFile(file);
      response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'});
      response.end(bytes);
    } catch(error) {
      const status=error.status||(['ENOENT','ENOTDIR'].includes(error.code)?404:error instanceof URIError?400:500);
      if(!response.headersSent) json(response,status,{error:status===500?'Não foi possível concluir agora. Tente novamente.':error.message});
      else response.end();
    }
  });
  server.on('close',()=>db.close());
  server.headersTimeout=15000;server.requestTimeout=30000;
  return server;
}
