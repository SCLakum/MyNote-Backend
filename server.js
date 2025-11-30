const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Database Connection
let isDbConnected = false;
const MONGO_URI = 'mongodb+srv://SCL:Administrator123@mydb.csyono0.mongodb.net/MyDB?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        isDbConnected = true;
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');

// Middleware to check DB connection
app.use((req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({
            message: 'Database not connected. Please check your MONGO_URI in backend/.env',
            error: 'Service Unavailable'
        });
    }
    next();
});

app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => {
    res.send('Task Management API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
