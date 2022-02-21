import { useEffect, useRef, useState } from "react";
import { StreamCard } from "../../components/StreamCard";
import RTCInterface from "../../interfaces/AgoraRTC";
import "./styles.scss";

export const Inclass = () => {
  const [remoteStreams, setRemoteStreams] = useState({});
  const RTCClient = useRef();
  const localStream = useRef();
  const [clientId, setClientId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const channelId = "121212";
  const appId = "dd1bdd5406a642fea84499861dcef2e3";

  const createClient = async () => {
    try {
      RTCClient.current = new RTCInterface(appId, channelId, null, clientId, {
        needDualStream: true,
      });
      const { audio, video } = await RTCClient.current.initialise();
      if (video.isSuccess) {
        RTCClient.current.playVideo(localStream.current);
      }
      subscribeToEvents();
      setIsAudioEnabled(audio.isSuccess);
      setIsVideoEnabled(video.isSuccess);
    } catch (err) {
      console.error(err);
    }
  };

  const subscribeToEvents = () => {
    RTCClient.current.on("user-joined", onUserJoined);
    RTCClient.current.on("user-left", onUserLeft);
    RTCClient.current.on("user-published", onUserPublished);
    RTCClient.current.on("user-unpublished", onUserUnpublished);
  };

  const onUserJoined = (user) => {
    const { uid: clientId } = user;
    setRemoteStreams((remoteStreams) => ({
      ...remoteStreams,
      [clientId]: { audio: false, video: false },
    }));
  };

  const onUserLeft = (user) => {
    console.warn("user left", user);
    const { uid: clientId } = user;
    setRemoteStreams((remoteStreams) => {
      delete remoteStreams[clientId];
      return remoteStreams;
    });
  };

  const onUserPublished = (user, mediaType) => {
    subscribeToUser(user, mediaType);
  };

  const subscribeToUser = async (user, mediaType) => {
    await RTCClient.current.subscribe(user, mediaType);
    const { uid, audioTrack, videoTrack } = user;

    if (mediaType === "video") {
      user.videoTrack?.play(uid);
    } else if (mediaType === "audio") {
      user.audioTrack?.play();
    }
    setRemoteStreams((remoteStreams) => ({
      ...remoteStreams,
      [uid]: {
        ...remoteStreams[uid],
        [mediaType]: true,
        videoTrack,
        audioTrack,
      },
    }));
  };

  const onUserUnpublished = (user, mediaType) => {
    const { uid: clientId } = user;
    console.warn("user unpublished", user, mediaType);
    if (remoteStreams[clientId]) {
      setRemoteStreams({
        ...remoteStreams,
        [clientId]: {
          ...remoteStreams[clientId],
          [mediaType]: false,
        },
      });
    }
  };

  const handleInputChange = (event) => {
    setClientId(event.target.value);
  };

  const joinChannel = async () => {
    try {
      createClient();
      var res = await RTCClient.current.startStreaming(true, true);
      if (res.isSuccess) {
        setIsJoined(true);
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    console.warn(remoteStreams);
  }, [remoteStreams]);

  return (
    <div className="inclass">
      <div className="inclass__streamCard">
        <div ref={localStream} className="inclass__localStream"></div>
      </div>
      {Object.entries(remoteStreams).map(([key, value]) => {
        const { audio, video } = value;
        return (
          <div className="inclass__streamCard" key={key}>
            <StreamCard
              streamId={key}
              isAudioEnabled={audio}
              isVideoEnabled={video}
            />
          </div>
        );
      })}

      {!isJoined && (
        <>
          <div className="inclass__input">
            <input
              type="text"
              placeholder="Enter your name"
              onChange={handleInputChange}
              value={clientId}
            />
          </div>
          <div className="inclass__submit">
            <button onClick={joinChannel}>Join</button>
          </div>
        </>
      )}
    </div>
  );
};
