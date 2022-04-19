# WebRTC Simple Multi-user P2P Vid Chat

이 레포지토리는 [WebRTC Codelab](https://codelabs.developers.google.com/codelabs/webrtc-web)
과 [@millo-L](https://millo-l.github.io/)
의 아티클을 참고하여 작성되었음을 알립니다.

<img src="https://img.shields.io/badge/WebRTC-333333?style=flat-square&logo=WebRTC&logoColor=white"/>
<img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=React&logoColor=black"/>
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=Node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=Socket.io&logoColor=white"/>

---

## Localhost에서 실행방법

### `npm run start`
React front-end app 을 호스팅합니다.

### `npm run server`
Socket.io Signaling server 를 호스팅합니다.

---

### `SignalingServer.js`
Socket.io의 Room 관리를 이용해 특정 RoomID 가 클라이언트로부터 들어오면
해당 Room 의 기존 사용자를 송신한다.

WebRTC Peer Connection 을 지원하기 위해
각 피어간의 `Offer-Answer(SDP 교환)` 및 `ICE Candidate 교환`을 중재한다.

---

### `socket_services.js`

WebRTC 의 Peer Connection 과정에서 발생하는 이벤트 를 추상화하는 함수를 구현하고 있으며
결과적으로 `RTCPeerConnection`에서 remote media track 을 수신하는 것을 목표로 한다.

```jsx
const createPeerConnection = async (remoteId) => {
    try {
        const pc = peerConnById[remoteId] = new RTCPeerConnection(PEER_CONN_CONFIG);
        /*...*/
        pc.ontrack = (trackEvent) => {
            remoteStreamById[remoteId] = trackEvent.streams[0];
            _onRemoteChanged(remoteStreamById);
        };
        /*...*/
        return pc;

    } catch (e) {
        console.error(e);
    }
};
```

몇가지의 함수는 `onRemoteChanged`를 실행시키며
`setRemoteChangeListener`를 통해 재정의된 해당 리스너는 React component 에서 연결되며
`State` 를 제어하여 View 를 생성한다.

```jsx
const [remoteStreams, setRemoteStreams] = useState({});

useEffect(() => {
    connectSignalling(roomId);
    setRemoteChangeListener((remoteStreamsById) => {
        setRemoteStreams({...remoteStreamsById});
    });
    return disconnectSignalling;
}, [roomId]);
```