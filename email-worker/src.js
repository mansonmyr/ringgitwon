// Workers Free + D1 + Brevo Free. Private data never enters the shared room tree.
const MINUTE = 60000, DAY = 86400000;
class Problem extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const sql = (env, query, ...args) => env.DB.prepare(query).bind(...args);
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2,'0')).join('');
const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
async function upstream(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) }); }
  catch { throw new Problem('A required service could not be reached. Please try again later.', 503); }
  if (!response.ok) throw new Problem('A required service rejected the request. Please try again later.', 503);
  return response.json();
}
function configured(env) {
  return env.DB && env.FIREBASE_API_KEY && env.BREVO_API_KEY && env.TWELVE_DATA_API_KEY
    && env.SENDER_EMAIL && !env.SENDER_EMAIL.includes('REPLACE_') && /^https:\/\//.test(env.PUBLIC_URL) && !env.PUBLIC_URL.includes('REPLACE_');
}
async function auth(request, env) {
  const bearer = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer || bearer.length > 5000) throw new Problem('Join the room again to continue.', 401);
  const body = await upstream(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({idToken:bearer}) });
  const uid=body.users?.[0]?.localId; if (!uid) throw new Problem('Sign-in expired.',401);
  return {uid,bearer};
}
async function roomData(env, code, bearer) {
  if (!/^\d{6}$/.test(code ?? '')) throw new Problem('Enter a valid room number.');
  return upstream(`${env.FIREBASE_DATABASE_URL.replace(/\/$/,'')}/rooms/${code}.json?auth=${encodeURIComponent(bearer)}`);
}
async function limit(env, key, max, duration) {
  const now=Date.now();
  const row=await sql(env, `INSERT INTO counters(key,value,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET value=CASE WHEN expires<=? THEN 1 ELSE value+1 END, expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING value`,key,now+duration,now,now).first();
  if(row.value>max) throw new Problem('Email limit reached. Please try again later.',429);
}
async function send(env, email, subject, text, key) {
  // Claim before sending: ambiguous timeouts are not retried automatically (avoid duplicates).
  const claimed=await sql(env,'INSERT OR IGNORE INTO deliveries(key,created,status) VALUES(?,?,?)',key,Date.now(),'attempted').run();
  if(!claimed.meta.changes) return false;
  try {
    await limit(env,`daily:${Math.floor(Date.now()/DAY)}`,90,2*DAY);
    await upstream('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'Won(da) Won',email:env.SENDER_EMAIL},to:[{email}],subject,textContent:text})});
    await sql(env,'UPDATE deliveries SET status=? WHERE key=?','accepted',key).run();
    return true;
  } catch(e) { await sql(env,'UPDATE deliveries SET status=? WHERE key=?','failed-or-unknown',key).run(); throw e; }
}
async function notify(env, code, room, kind, event, message) {
  const {results}=await sql(env,'SELECT * FROM subscriptions WHERE room=? AND confirmed=1 AND room_epoch=?',code,room.createdAt).all();
  let count=0;
  for(const sub of results) {
    if(!room.members?.[sub.uid] || !(kind==='test'?sub.tests:sub.targets))continue;
    // Recheck subscription immediately before sending; unsubscribe wins queued work.
    if(!await sql(env,'SELECT id FROM subscriptions WHERE id=? AND confirmed=1',sub.id).first())continue;
    const accepted=await send(env,sub.email,`Won(da) Won · ${kind==='test'?'test alert':'target reached'}`,`${message}\n\nRoom ${code}. This is an indicative market rate, not a cash-exchange offer.\n\nStop these emails: ${env.PUBLIC_URL}/unsubscribe?token=${sub.unsubscribe_token}`,`${event}:${sub.id}`);
    if(accepted)count++;
  }
  return count;
}
async function publicLink(request, env, url) {
  const isConfirm=url.pathname==='/confirm';
  const value=request.method==='POST'?(await request.formData()).get('token'):url.searchParams.get('token');
  if(typeof value!=='string'||! /^[a-f0-9]{64}$/.test(value))throw new Problem('This email link is invalid.');
  const field=isConfirm?'confirm_hash':'unsubscribe_token'; const lookup=isConfirm?await hash(value):value;
  const sub=await sql(env,`SELECT * FROM subscriptions WHERE ${field}=?`,lookup).first();
  if(!sub || (isConfirm && sub.expires<Date.now()))throw new Problem('This link expired or was already used. Request a new email in Signal Room.');
  if(request.method==='POST') {
    if(isConfirm) {
      const bearer=await monitorToken(env); const room=await roomData(env,sub.room,bearer);
      if(!room?.members?.[sub.uid] || room.createdAt!==sub.room_epoch) {await sql(env,'DELETE FROM subscriptions WHERE id=?',sub.id).run();throw new Problem('This room or membership is no longer available.');}
      const changed=await sql(env,'UPDATE subscriptions SET confirmed=1,confirm_hash=NULL WHERE id=? AND confirm_hash=?',sub.id,lookup).run();
      if(!changed.meta.changes)throw new Problem('This link was replaced or already used.');
    } else await sql(env,'DELETE FROM subscriptions WHERE id=?',sub.id).run();
    return new Response(isConfirm?'Email verified. Return to Signal Room and choose Check status.':'Email notifications stopped and your subscription deleted.',{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  }
  // GET renders a confirmation form; mail scanners cannot activate/remove subscriptions.
  return new Response(`<!doctype html><html><meta name="viewport" content="width=device-width"><title>Won(da) Won email</title><body><h1>${isConfirm?'Confirm email alerts':'Stop email alerts'}</h1><p>${isConfirm?'Confirm that you requested Signal Room emails.':'This will remove your email subscription for this room.'}</p><form method="POST"><input type="hidden" name="token" value="${value}"><button>${isConfirm?'Confirm subscription':'Unsubscribe'}</button></form></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'"}});
}
async function api(request, env, url) {
  if(!configured(env))throw new Problem('Email delivery has not been connected yet.',503);
  if(['/confirm','/unsubscribe'].includes(url.pathname)) {
    if(!['GET','POST'].includes(request.method))throw new Problem('Method not allowed.',405);
    return publicLink(request,env,url);
  }
  if(request.method!=='POST')throw new Problem('Method not allowed.',405);
  if(Number(request.headers.get('Content-Length'))>4096)throw new Problem('Request too large.',413);
  const raw=await request.text();if(raw.length>4096)throw new Problem('Request too large.',413);
  let data;try{data=JSON.parse(raw);}catch{throw new Problem('Invalid request.');}
  const {uid,bearer}=await auth(request,env);const code=data.room;
  if(!/^\d{6}$/.test(code ?? ''))throw new Problem('Invalid room number.');
  if(url.pathname==='/disable') {await sql(env,'DELETE FROM subscriptions WHERE room=? AND uid=?',code,uid).run();return json({message:'Email notifications stopped.'});}
  const room=await roomData(env,code,bearer);
  if(!room?.members?.[uid])throw new Problem('Join this room before enabling emails.',403);
  if(url.pathname==='/status') {
    const sub=await sql(env,'SELECT * FROM subscriptions WHERE room=? AND uid=? AND room_epoch=?',code,uid,room.createdAt).first();
    return json({status:sub?(sub.confirmed?'verified':sub.expires<Date.now()?'expired':'pending'):'off',email:sub?sub.email.replace(/^(.).*(@.*)$/,'$1•••$2'):null});
  }
  if(url.pathname==='/subscribe') {
    const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
    if(typeof data.targets!=='boolean'||typeof data.tests!=='boolean'||email.length>254||! /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||data.consent!==true||(!data.targets&&!data.tests))throw new Problem('Enter an email and choose the alerts you agree to receive.');
    await limit(env,`signup:${uid}`,1,10*MINUTE);
    await limit(env,`address:${await hash(email)}`,3,DAY);
    const existing=await sql(env,'SELECT id FROM subscriptions WHERE room=? AND uid=?',code,uid).first();
    const total=await sql(env,'SELECT COUNT(*) AS n FROM subscriptions').first();
    if(!existing && total.n>=10)throw new Problem('The free demo currently supports ten email subscriptions.',429);
    const id=crypto.randomUUID(), confirmation=token(), unsubscribe=token();
    // Replacing email/preferences always requires a fresh confirmation.
    await sql(env,`INSERT INTO subscriptions(id,room,uid,room_epoch,email,targets,tests,confirm_hash,expires,unsubscribe_token,created) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(room,uid) DO UPDATE SET id=excluded.id,room_epoch=excluded.room_epoch,email=excluded.email,targets=excluded.targets,tests=excluded.tests,confirm_hash=excluded.confirm_hash,expires=excluded.expires,unsubscribe_token=excluded.unsubscribe_token,created=excluded.created,confirmed=0`,id,code,uid,room.createdAt,email,Number(data.targets===true),Number(data.tests===true),await hash(confirmation),Date.now()+DAY,unsubscribe,Date.now()).run();
    await send(env,email,'Confirm your Won(da) Won email alerts',`You requested emails for Signal Room ${code}.\n\nConfirm within 24 hours: ${env.PUBLIC_URL}/confirm?token=${confirmation}\n\nAlerts selected: ${data.targets?'target reached ':''}${data.tests?'room test alerts':''}.\nIf this was not you, ignore this email or remove the request: ${env.PUBLIC_URL}/unsubscribe?token=${unsubscribe}`,`verify:${id}`);
    return json({message:'Confirmation email accepted by the email service. Check your inbox and spam folder; then choose Check status.'});
  }
  if(url.pathname==='/test') {
    if(room.alert?.kind!=='test'||room.alert.id!==data.event||Math.abs(Date.now()-room.alert.createdAt)>2*MINUTE)throw new Problem('Send a new room test alert first.');
    await limit(env,`test:${code}:${room.createdAt}`,1,10*MINUTE);
    const count=await notify(env,code,room,'test',`test:${code}:${room.createdAt}:${room.alert.id}`,'A traveler sent a Signal Room test alert. This is not a target-reaching alert.');
    return json({message:`Email service accepted ${count} test notification(s) for verified subscribers who opted in.`});
  }
  throw new Problem('Not found.',404);
}
// A single dedicated anonymous Firebase identity reads known rooms using existing rules.
// Persist its refresh token in private D1; no service-account/admin credential is needed.
async function monitorToken(env) {
  const current=await sql(env,"SELECT value FROM settings WHERE key='firebase-refresh'").first();
  if(current) {
    const body=await upstream(`https://securetoken.googleapis.com/v1/token?key=${env.FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:current.value})});
    if(!body.id_token||!body.refresh_token)throw new Problem('Monitor sign-in failed.',503);
    await sql(env,"UPDATE settings SET value=? WHERE key='firebase-refresh'",body.refresh_token).run();return body.id_token;
  }
  const body=await upstream(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${env.FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});
  if(!body.idToken||!body.refreshToken)throw new Problem('Monitor sign-in failed.',503);
  await sql(env,"INSERT OR IGNORE INTO settings(key,value) VALUES('firebase-refresh',?)",body.refreshToken).run();return body.idToken;
}
async function scheduled(env) {
  if(!configured(env))return;
  const now=Date.now();
  const lock=await sql(env,"INSERT INTO locks(key,until_ms) VALUES('monitor',?) ON CONFLICT(key) DO UPDATE SET until_ms=excluded.until_ms WHERE until_ms<? RETURNING key",now+5*MINUTE,now).first();
  if(!lock)return;
  try {
    await sql(env,'DELETE FROM subscriptions WHERE confirmed=0 AND expires<?',now).run();
    await sql(env,'DELETE FROM counters WHERE expires<?',now).run();
    await sql(env,'DELETE FROM deliveries WHERE created<?',now-7*DAY).run();
    await sql(env,'DELETE FROM monitor WHERE room NOT IN (SELECT room FROM subscriptions)').run();
    const {results:codes}=await sql(env,'SELECT DISTINCT room FROM subscriptions LIMIT 10').all();
    if(!codes.length)return;
    const bearer=await monitorToken(env), rooms=[];
    // Clean up dismissed rooms before any market request, even if the rate feed fails.
    for(const {room:code} of codes) {
      const room=await roomData(env,code,bearer);
      const {results:subs}=await sql(env,'SELECT id,uid,room_epoch FROM subscriptions WHERE room=?',code).all();
      for(const sub of subs)if(!room?.members?.[sub.uid]||room.createdAt!==sub.room_epoch)await sql(env,'DELETE FROM subscriptions WHERE id=?',sub.id).run();
      if(room)rooms.push({code,room});else await sql(env,'DELETE FROM monitor WHERE room=?',code).run();
    }
    const quote=await upstream('https://api.twelvedata.com/exchange_rate?symbol=MYR%2FKRW',{headers:{Authorization:`apikey ${env.TWELVE_DATA_API_KEY}`}});
    const observed=quote.timestamp*1000;
    if(quote.symbol!=='MYR/KRW'||!Number.isFinite(quote.rate)||quote.rate<=0||!Number.isFinite(observed)||observed>now+2*MINUTE||now-observed>60*MINUTE)return;
    for(const {code,room} of rooms) {
      const target=room.sharedTarget;if(!Number.isFinite(target)||target<=0)continue;
      const previous=await sql(env,'SELECT * FROM monitor WHERE room=?',code).first();
      if(previous && observed<=previous.observed)continue;
      await sql(env,'INSERT INTO monitor(room,epoch,target,rate,observed) VALUES(?,?,?,?,?) ON CONFLICT(room) DO UPDATE SET epoch=excluded.epoch,target=excluded.target,rate=excluded.rate,observed=excluded.observed',code,room.createdAt,target,quote.rate,observed).run();
      if(previous?.epoch===room.createdAt && previous.target===target && observed-previous.observed<=60*MINUTE && previous.rate<target && quote.rate>=target) {
        // Read again to avoid dispatching for a dismissed room or changed target.
        const current=await roomData(env,code,bearer);
        if(current?.createdAt===room.createdAt && current.sharedTarget===target)await notify(env,code,current,'rate',`rate:${code}:${room.createdAt}:${target}:${observed}`,`MYR/KRW reached ${quote.rate.toFixed(3)} KRW per RM1, above your shared target of ${target}.\nSource: Twelve Data (https://twelvedata.com). Quote recorded ${new Date(observed).toISOString()}.`);
      }
    }
  } finally {await sql(env,"DELETE FROM locks WHERE key='monitor' AND until_ms=?",now+5*MINUTE).run();}
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url),origin=request.headers.get('Origin');
    const publicRoute=['/confirm','/unsubscribe'].includes(url.pathname);
    const allowed=(env.APP_ORIGINS??'').split(',').map(s=>s.trim()).includes(origin);
    if(!publicRoute && !allowed)return json({error:'Origin not allowed.'},403);
    let response;
    try {response=request.method==='OPTIONS'?new Response(null,{status:204}):await api(request,env,url);}
    catch(e){response=json({error:e instanceof Problem?e.message:'Email service unavailable. Please try again later.'},e instanceof Problem?e.status:503);}
    const headers=new Headers(response.headers);
    if(allowed){headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Headers','Authorization, Content-Type');headers.set('Access-Control-Allow-Methods','POST, OPTIONS');}
    return new Response(response.body,{status:response.status,headers});
  },
  async scheduled(_event,env,ctx){ctx.waitUntil(scheduled(env));}
};
