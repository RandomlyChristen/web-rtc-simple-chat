import {useEffect, useState} from "react";
import {connectSignalling, disconnectSignalling, setRemoteChangeListener} from "../../client_services/socket_services";
import RemoteSingle from "../remote-single/RemoteSingle";
import './RemoteVideos.css';

const RemoteVideos = ({roomId}) => {
    const [remoteStreams, setRemoteStreams] = useState({});

    useEffect(() => {
        connectSignalling(roomId);
        setRemoteChangeListener((remoteStreamsById) => {
            setRemoteStreams({...remoteStreamsById});
        });
        return disconnectSignalling;
    }, [roomId]);

    return (
        <div className="RemoteVideos">
            {Object.keys(remoteStreams).map((remoteId) => {
                console.log(`${remoteId} : ${remoteStreams[remoteId]}`);
                return <RemoteSingle key={remoteId} remoteStream={remoteStreams[remoteId]} />;
            })}
        </div>
    );
};

export default RemoteVideos;