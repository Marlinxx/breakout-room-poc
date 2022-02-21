import "./styles.scss";

export const StreamCard = (props) => {
  const { streamId } = props;
  return <div className="streamCard" id={streamId}></div>;
};
