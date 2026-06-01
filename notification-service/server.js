const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS from frontend (5174/5173) and backend (8081)
app.use(cors({
    // origin: ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:8081'],
    origin: '*',
    methods: ['GET', 'POST']
}));
app.use(express.json());

const io = new Server(server, {
    cors: {
        // origin: ['http://localhost:5174', 'http://localhost:5173'],
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Store connected users for targeted notifications
// Map structure: { "MENTOR_1": socketId, "LEARNER_5": socketId }
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Client emits "register" on connect with their role and id
    socket.on('register', ({ role, id }) => {
        if (role && id) {
            const userKey = `${role}_${id}`;
            connectedUsers.set(userKey, socket.id);
            console.log(`Registered user: ${userKey} at ${socket.id}`);
            
            // Send welcome notification
            const welcomeMsg = role === 'MENTOR' 
                ? "Mentor portals and Assessment logging APIs active and bound to database."
                : "Welcome back! Your notification feed is live.";
                
            socket.emit('notification', {
                title: 'System Ready',
                description: welcomeMsg,
                time: 'Just now',
                badge: 'badge-green',
                status: 'Online'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Remove from connected users
        for (const [key, value] of connectedUsers.entries()) {
            if (value === socket.id) {
                connectedUsers.delete(key);
                break;
            }
        }
    });
});

// REST endpoint for backend to trigger notifications
app.post('/api/notify', (req, res) => {
    const { role, id, title, description, badge, status } = req.body;
    
    if (!role || !title || !description) {
        return res.status(400).json({ error: "Missing required fields (role, title, description)" });
    }

    const notification = {
        title,
        description,
        time: 'Just now',
        badge: badge || 'badge-green',
        status: status || 'New'
    };

    if (id) {
        // Targeted notification to specific user
        const userKey = `${role}_${id}`;
        const socketId = connectedUsers.get(userKey);
        
        if (socketId) {
            io.to(socketId).emit('notification', notification);
            console.log(`Sent notification to ${userKey}`);
        } else {
            console.log(`User ${userKey} not connected. Notification dropped.`);
        }
    } else {
        // Broadcast to all users of a specific role
        // This is less targeted, usually we want targeted
        console.log(`Broadcasting to all ${role}s - (Not fully implemented, needs room logic)`);
        // For simple role broadcast, we can just iterate map
        for (const [key, socketId] of connectedUsers.entries()) {
            if (key.startsWith(`${role}_`)) {
                io.to(socketId).emit('notification', notification);
            }
        }
    }

    res.status(200).json({ message: "Notification sent successfully", notification });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Notification Service running on http://localhost:${PORT}`);
});
