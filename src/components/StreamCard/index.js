import "./styles.scss";

export const StreamCard = (props) => {
  const { clientId, playStream, isAudioEnabled, isVideoEnabled, streamId } =
    props;
  return <div className="streamCard" id={streamId}></div>;
};
