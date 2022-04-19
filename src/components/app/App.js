import './App.css';
import {useEffect, useState} from "react";
import LocalVideo from "../local_video/LocalVideo";
import RemoteVideos from "../remote-videos/RemoteVideos";
import {MEDIA_STREAM_CONSTRAINTS} from "../../client_services/socket_services";

const App = () => {
    const [roomId, setRoomId] = useState("");
    const [localStream, setLocalStream] = useState(null);

    useEffect(() => {
        const newRoomId = prompt('Enter Room ID : ');
        setRoomId((roomId) =>
            (roomId !== newRoomId) ? newRoomId : roomId);
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia(MEDIA_STREAM_CONSTRAINTS).then((localStream) => {
            setLocalStream(localStream);
        });
    }, []);

    return (
        <div className="App">
            <LocalVideo localStream={localStream}/>
            {roomId === '' || <RemoteVideos roomId={roomId}/>}
        </div>
    );
}

export default App;
