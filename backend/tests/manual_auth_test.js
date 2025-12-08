// manual_auth_test.js
// Simple script to exercise register/login/refresh/logout endpoints.
// Usage: run server (npm run dev) and then: node backend/tests/manual_auth_test.js

const axios = require('axios').default;
const qs = require('querystring');
const base = process.env.BASE_URL || 'http://localhost:3000';

async function run() {
  try {
    const email = `testuser+${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log('Registering', email);
    const reg = await axios.post(`${base}/api/auth/register`, { nombre: 'Test', email, password });
    console.log('Register response:', reg.data);

    console.log('Logging in');
    // enable cookie jar via axios: simple manual handling of set-cookie
    const loginRes = await axios.post(`${base}/api/auth/login`, { email, password }, { withCredentials: true });
    console.log('Login response:', loginRes.data);
    const setCookie = loginRes.headers['set-cookie'];
    console.log('Set-Cookie header:', setCookie);

    if (!setCookie) {
      console.warn('No refresh cookie returned; refresh test may fail');
    }

    const cookieHeader = setCookie ? setCookie.join(';') : '';

    console.log('Refreshing token');
    const refreshRes = await axios.post(`${base}/api/auth/refresh`, {}, { headers: { Cookie: cookieHeader }, withCredentials: true });
    console.log('Refresh response:', refreshRes.data);

    console.log('Logging out');
    const logoutRes = await axios.post(`${base}/api/auth/logout`, {}, { headers: { Cookie: cookieHeader }, withCredentials: true });
    console.log('Logout response:', logoutRes.data);

    console.log('Manual auth flow completed');
  } catch (err) {
    if (err.response) console.error('Error status', err.response.status, err.response.data);
    else console.error(err);
    process.exit(1);
  }
}

run();
