const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = {}; // Track users with their online status

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // Handle new user connection with username
        if (data.username) {
            ws.username = data.username;
            users[data.username] = true; // Mark user as online
            broadcastUserList();
        }

        // Handle chat message
        if (data.chatMessage) {
            const chatMessage = { username: ws.username, message: data.chatMessage };
            broadcast(chatMessage, 'chat');
        }
    });

    ws.on('close', () => {
        if (ws.username) {
            delete users[ws.username]; // Remove user from list on disconnect
            broadcastUserList();
        }
    });

    const broadcastUserList = () => {
        const data = {
            type: 'userList',
            users: Object.entries(users).map(([username, isOnline]) => ({ username, isOnline }))
        };
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    };

    const broadcast = (message, type) => {
        const data = { type, ...message };
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    };
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
