// start_server.js
// Simple server starter for debugging

console.log('Starting server...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING');
console.log('JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? 'set' : 'MISSING');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'set' : 'MISSING');

try {
    const app = require('./backend/app.js');
    console.log('App loaded successfully');
} catch (err) {
    console.error('Error loading app:', err.message);
    console.error(err.stack);
    process.exit(1);
}

// Keep process alive
setInterval(() => {
    console.log('Server still running...');
}, 10000);
