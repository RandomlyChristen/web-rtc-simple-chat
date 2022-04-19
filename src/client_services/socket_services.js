import io from "socket.io-client";

const PORT = process.env.REACT_APP_SIGNALING_PORT || 30001
const HOST = process.env.REACT_APP_SIGNALING_HOSTNAME || 'http://localhost'

const MEDIA_STREAM_CONSTRAINTS = {
    video: {
        width: 240,
        height: 240
    },
    audio: true
};

const PEER_CONN_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // {}
    ],
};

let socket;

const remoteStreamById = {};
const peerConnById = {};
let _onRemoteChanged = () => {};
let _onRoomFull = () => {
    // alert('This room is currently full');
    // window.location.reload();
};

const setRemoteChangeListener = (onRemoteChanged) => {
    _onRemoteChanged = onRemoteChanged;
};

const setRoomFullListener = (onRoomFull) => {
    _onRoomFull = onRoomFull;
}

const sendOffer = async (remoteId, peerConn) => {
    try {
        const localSdp = await peerConn.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });

        await peerConn.setLocalDescription(new RTCSessionDescription(localSdp));

        socket.emit('offer', {
            sdp: localSdp,
            offerSendId: socket.id,
            offerReceiveId: remoteId
        });

    } catch (e) {
        console.error(e);
    }
};

const sendAnswer = async (remoteId, peerConn, remoteSdp) => {
    try {
        await peerConn.setRemoteDescription(new RTCSessionDescription(remoteSdp));

        const localSdp = await peerConn.createAnswer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true,
        });

        await peerConn.setLocalDescription(new RTCSessionDescription(localSdp));

        socket.emit('answer', {
            sdp: localSdp,
            answerSendId: socket.id,
            answerReceiveId: remoteId
        });

    } catch (e) {
        console.error(e);
    }
}

const sendCandidate = (candidate, remoteId) => {
    socket.emit('candidate', {
        candidate: candidate,
        candidateSendId: socket.id,
        candidateReceiveId: remoteId
    });
};

const createPeerConnection = async (remoteId) => {
    try {
        const pc = peerConnById[remoteId] = new RTCPeerConnection(PEER_CONN_CONFIG);

        pc.onicecandidate = (iceEvent) => {
            if (!iceEvent.candidate) {
                console.log('ICE Candidate is Empty');
                return;
            }

            console.log('sendCandidate');
            sendCandidate(iceEvent.candidate, remoteId);
        };

        pc.oniceconnectionstatechange = (ev) => {
            console.log(ev);
        };

        pc.ontrack = (trackEvent) => {
            remoteStreamById[remoteId] = trackEvent.streams[0];
            _onRemoteChanged(remoteStreamById);
        };

        const localStream = await navigator.mediaDevices.getUserMedia(MEDIA_STREAM_CONSTRAINTS);
        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });

        return pc;

    } catch (e) {
        console.error(e);
    }
};

const onGetOtherUsers = (users) => {
    users.forEach(async (remoteId) => {
        const peerConn = peerConnById[remoteId] = await createPeerConnection(remoteId);
        await sendOffer(remoteId, peerConn);
    });
    _onRemoteChanged(remoteStreamById);
};

const onGetOffer = async (remoteSdp, remoteId) => {
    const peerConn = peerConnById[remoteId] = await createPeerConnection(remoteId);
    await sendAnswer(remoteId, peerConn, remoteSdp);
}

const onGetCandidate = async (candidate, remoteId) => {
    const peerConn = peerConnById[remoteId];
    if (!peerConn) {
        console.log('Peer Connection is not Initialized');
        return;
    }

    try {
        await peerConn.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
        console.error(e);
    }
}

const onGetAnswer = async (remoteSdp, remoteId) => {
    const peerConn = peerConnById[remoteId];
    if (!peerConn) {
        console.log('Peer Connection is not Initialized');
        return;
    }

    try {
        await peerConn.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    } catch (e) {
        console.error(e);
    }
};

const onUserExited = (remoteId) => {
    if (peerConnById[remoteId]) {
        peerConnById[remoteId].close();
        delete peerConnById[remoteId];
    }

    if (remoteStreamById[remoteId]) {
        delete remoteStreamById[remoteId];
    }

    console.log('onUserExited');
    _onRemoteChanged(remoteStreamById);
};


const connectSignalling = (roomId) => {
    const uri = HOST + ':' + PORT;
    socket = io.connect(uri);

    console.log(`Signaling Socket on ${uri}`);

    socket.on('getOtherUsers', (users) => {
        if (!users || !users.length) return;
        onGetOtherUsers(users);
    });
    socket.on('getOffer', async ({sdp, offerSendId}) => {
        await onGetOffer(sdp, offerSendId);
    });
    socket.on('getAnswer', async ({sdp, answerSendId}) => {
        await onGetAnswer(sdp, answerSendId);
    });
    socket.on('getCandidate', async ({candidate, candidateSendId}) => {
        await onGetCandidate(candidate, candidateSendId);
    });
    socket.on('userExited', ({userId}) => {
        onUserExited(userId);
    });
    // TODO : Do for this.
    // socket.on('full', () => {
    //     _onRoomFull();
    // });
    socket.emit('join', {
        roomId: roomId
    });
};

const disconnectSignalling = () => {
    setRemoteChangeListener(() => {});
    socket.off('getOtherUsers');
    socket.off('getOffer');
    socket.off('getAnswer');
    socket.off('getCandidate');
    socket.off('userExited');
    Object.keys(remoteStreamById).forEach((remoteId) => {
        if (peerConnById[remoteId]) {
            peerConnById[remoteId].close();
            delete peerConnById[remoteId];
        }
        if (remoteStreamById[remoteId]) {
            delete remoteStreamById[remoteId];
        }
    });
    if (socket) socket.disconnect();
};

export {connectSignalling, disconnectSignalling, setRemoteChangeListener, setRoomFullListener, MEDIA_STREAM_CONSTRAINTS};
