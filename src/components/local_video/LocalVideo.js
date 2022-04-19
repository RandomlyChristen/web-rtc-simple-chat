import {useEffect, useRef} from "react";
import './LocalVideo.css'

const LocalVideo = ({localStream}) => {
    const localVideoRef = useRef(null);

    useEffect(() => {
        if (!localVideoRef || !localStream) return;
        localVideoRef.current.srcObject = localStream;
    }, [localStream, localVideoRef]);

    return (
        <div className="LocalVideo">
            <video ref={localVideoRef} autoPlay muted />
        </div>
    )
};

export default LocalVideo;