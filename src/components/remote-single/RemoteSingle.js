import {useEffect, useRef} from "react";
import './RemoteSingle.css'

const RemoteSingle = ({remoteStream}) => {
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (!remoteVideoRef || !remoteStream) return;
        remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream, remoteVideoRef]);

    return (
        <div className="RemoteSingle">
            <video ref={remoteVideoRef} autoPlay />
        </div>
    )
};

export default RemoteSingle;