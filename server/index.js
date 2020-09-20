const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 8000;

const router = require('./router')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connect', (socket) => {
    console.log('We have a new connection');

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if(error) return callback({error : 'error'});
    
        socket.join(user.room);
    
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
    
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    
        callback();
      });
    
      socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        console.log(user);

        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    
        callback();
      });

    socket.on('disconnect', () => {
        console.log('User has left');
    })
});

app.use(router)

server.listen(process.env.PORT || 8000, () => console.log(`Server has started on port ${PORT}`));
