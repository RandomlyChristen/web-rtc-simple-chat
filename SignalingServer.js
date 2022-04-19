'use strict';

const PORT = process.env.REACT_APP_SIGNALING_PORT || 30001
const HOST = process.env.REACT_APP_SIGNALING_HOSTNAME || 'http://localhost'
const MAX_ROOM_CAP = process.env.MAXIMUM_ROOM_CAP || 4

const app = require('express')();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io').listen(server);

const options = {
    hostname: HOST,
    port: Number(PORT),
};

server.listen(options, () => {
    console.log(options);
    console.log(`WebRTC Signaling on port: ${PORT}`);
});

const usersByRoomId = {};
const roomBySocketId = {};

io.on('connection', (socket) => {
    socket.on('join', ({roomId}) => {
        const users = usersByRoomId[roomId] || (usersByRoomId[roomId] = []);

        if (users.length >= MAX_ROOM_CAP) {
            socket.to(socket.id).emit('full');
            return;
        }

        users.push(socket.id);

        roomBySocketId[socket.id] = roomId;
        socket.join(roomId);
        console.log(`${roomBySocketId[socket.id]}: ${socket.id} joined`);

        const otherUsersInRoom = users.filter((userId) => userId !== socket.id);
        console.log(`\t${otherUsersInRoom} were presented`);
        io.sockets.to(socket.id).emit('getOtherUsers', otherUsersInRoom);
    });

    socket.on('offer', ({sdp, offerSendId, offerReceiveId}) => {
        console.log(`${offerSendId}: sent offer to ${offerReceiveId}`);
        console.log(`\t${sdp}`);
        socket.to(offerReceiveId).emit('getOffer', {
            sdp: sdp,
            offerSendId: offerSendId
        });
    });

    socket.on('answer', ({sdp, answerSendId, answerReceiveId}) => {
        console.log(`${answerSendId}: sent answer to ${answerReceiveId}`);
        console.log(`\t${sdp}`);
        socket.to(answerReceiveId).emit('getAnswer', {
            sdp: sdp,
            answerSendId: answerSendId
        });
    });

    socket.on('candidate', ({candidate, candidateSendId, candidateReceiveId}) => {
        console.log(`${candidateSendId}: Attempt to share ICE candidate with ${candidateReceiveId}`);
        console.log(`\t${candidate}`);
        socket.to(candidateReceiveId).emit('getCandidate', {
            candidate: candidate,
            candidateSendId: candidateSendId
        });
    });

    socket.on('disconnect', () => {
        const roomId = roomBySocketId[socket.id];
        const users = usersByRoomId[roomId];
        if (!users) return;

        usersByRoomId[roomId] = users.filter((userId) => userId !== socket.id);
        if (usersByRoomId[roomId].length <= 0) {
            delete usersByRoomId[roomId];
        }

        socket.to(roomId).emit('userExited', {
            userId: socket.id
        });

        console.log(`${socket.id}: disconnected from room ${roomId}`);
        console.log(`\t${usersByRoomId[roomId]} now presenting`);
    });
});