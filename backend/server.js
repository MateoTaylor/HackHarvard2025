// server.js — Duo Universal Prompt integration demo
require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const {
  PORT = 3000,
  DUO_CLIENT_ID,
  DUO_CLIENT_SECRET,
  DUO_API_HOSTNAME,
  DUO_REDIRECT_URI,
} = process.env;

if (!DUO_CLIENT_ID || !DUO_CLIENT_SECRET || !DUO_API_HOSTNAME) {
  console.error('❌ Missing Duo env vars. Check .env file.');
  process.exit(1);
}

const app = express();
app.use(express.json());

const txStore = {};

// Duo OAuth endpoints
const DUO_AUTHORIZE_URL = `https://${DUO_API_HOSTNAME}/oauth/v1/authorize`;
const DUO_TOKEN_URL = `https://${DUO_API_HOSTNAME}/oauth/v1/token`;

app.get('/', (req, res) => {
  res.send(`
    <h2>✅ Duo MFA Connected Demo</h2>
    <p>POST /mfa/start {"email","amount"} → starts Duo Push</p>
    <p>Duo will redirect to /mfa/callback after approval.</p>
    <p>GET /mfa/status/:txid → check status.</p>
  `);
});

// 1️⃣ Start MFA — create tx + return Duo auth URL
// 1️⃣ Start MFA — create tx + return Duo auth URL (with signed request)
app.post('/mfa/start', async (req, res) => {
    const { email, amount } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });
    
    // Extract username from email if it's a full email address
    // For Duo, use just the username part (before @), and remove numbers if needed
    let username = email.includes('@') ? email.split('@')[0] : email;
    
    // If username ends with numbers, try without them (common pattern)
    // e.g., "sushmit787" -> "sushmit"
    if (/\d+$/.test(username)) {
      username = username.replace(/\d+$/, '');
    }
  
    const txid  = uuidv4();
    const state = uuidv4();
    const nonce = uuidv4(); // for OIDC replay protection
    txStore[txid] = { email, amount, state, nonce, status: 'pending', createdAt: Date.now() };
  
    // Build a JWT for the request parameter as required by Duo
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(process.env.DUO_CLIENT_SECRET);
    const now = Math.floor(Date.now() / 1000);
  
    // JWT payload for Duo Universal Prompt
    const requestPayload = {
      response_type: 'code',
      client_id: process.env.DUO_CLIENT_ID,
      redirect_uri: process.env.DUO_REDIRECT_URI,
      scope: 'openid',
      state,
      exp: now + 300,  // 5 minutes expiration
      duo_uname: username,  // Duo expects duo_uname, not login_hint
    };
  
    const requestJwt = await new SignJWT(requestPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secret);
  
    // Build Duo URL with required parameters including the JWT request
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.DUO_CLIENT_ID,
      redirect_uri: process.env.DUO_REDIRECT_URI,
      request: requestJwt,
    });

    const duoUrl = `${DUO_AUTHORIZE_URL}?${params.toString()}`;
    console.log('➡️ Duo URL:', duoUrl);
    console.log('➡️ state:', state, 'txid:', txid);
    return res.json({ duoUrl, txid, status: 'pending' });
  });
  
// 2️⃣ Callback — Duo redirects here after approval
app.get('/mfa/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  // Handle Duo errors
  if (error) {
    console.error('❌ Duo error:', error);
    console.error('❌ Duo error description:', error_description);
    return res.status(400).send(`
      <h3>❌ Duo MFA Failed</h3>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>Description:</strong> ${error_description || 'No description provided'}</p>
      <p>Please check your Duo configuration and try again.</p>
    `);
  }
  
  if (!code || !state) {
    console.error('❌ Missing code/state in callback');
    console.error('❌ Query params:', req.query);
    return res.status(400).send('Missing code/state');
  }

  const txid = Object.keys(txStore).find((id) => txStore[id].state === state);
  if (!txid) return res.status(400).send('Invalid state');

  // Exchange authorization code for token
  console.log('🔁 Token POST to:', DUO_TOKEN_URL);
  console.log('🔁 Using redirect_uri:', process.env.DUO_REDIRECT_URI);
  console.log('🔁 Code received:', code);
  console.log('🔁 State received:', state);
  
  // Create client assertion JWT for token exchange
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(process.env.DUO_CLIENT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  
  const clientAssertion = await new SignJWT({
    iss: DUO_CLIENT_ID,
    sub: DUO_CLIENT_ID,
    aud: DUO_TOKEN_URL,
    jti: uuidv4(),
    iat: now,
    exp: now + 300, // 5 minutes
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: DUO_REDIRECT_URI,
    client_assertion: clientAssertion,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  });
  
  console.log('🔁 Token request body:', body.toString());

  const tokenResp = await fetch(DUO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    console.error('❌ Token exchange failed:', errText);
    txStore[txid].status = 'denied';
    return res.status(400).send('<h3>❌ Duo MFA Failed</h3>');
  }

  const tokenData = await tokenResp.json();
  console.log('✅ Duo token response:', tokenData);
  txStore[txid].status = 'approved';

  return res.send('<h3>✅ MFA Approved — you can close this tab.</h3>');
});

// 3️⃣ Status endpoint
app.get('/mfa/status/:txid', (req, res) => {
  const tx = txStore[req.params.txid];
  if (!tx) return res.status(404).json({ error: 'not_found' });
  res.json(tx);
});

app.listen(PORT, () => console.log(`🚀 Duo MFA Server running on port ${PORT}`));
