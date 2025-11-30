const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://SCL:Administrator123@mydb.csyono0.mongodb.net/MyDB?retryWrites=true&w=majority';

// Connect to MongoDB with better error handling
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        // Don't exit in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to connect to MongoDB. Please check your connection string.');
        }
    });

// Routes
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => {
    res.json({
        message: 'Task Management API is running',
        status: 'ok',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Health check endpoint with detailed MongoDB info
app.get('/api/health', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        mongodb: {
            state: states[mongoose.connection.readyState],
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host || 'not connected',
            hasMongoUri: !!process.env.MONGO_URI,
            error: mongoose.connection.error?.message || null
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
