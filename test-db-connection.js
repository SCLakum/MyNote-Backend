const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

console.log('Testing MongoDB Connection...');
console.log('Connection String:', MONGO_URI.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ SUCCESS! MongoDB Connected');
        console.log('Database Name:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        process.exit(0);
    })
    .catch(err => {
        console.log('❌ FAILED! MongoDB Connection Error');
        console.error('Error:', err.message);
        console.error('Error Code:', err.code);
        process.exit(1);
    });

// Timeout after 10 seconds
setTimeout(() => {
    console.log('❌ Connection timeout after 10 seconds');
    process.exit(1);
}, 10000);
