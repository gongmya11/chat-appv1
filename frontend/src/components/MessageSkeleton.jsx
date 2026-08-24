const MessageSkeleton = () => {
  // Varied bubble widths to simulate real chat content density
  const skeletonMessages = [
    { isSent: false, width: "140px" },
    { isSent: true, width: "240px" },
    { isSent: false, width: "180px" },
    { isSent: true, width: "120px" },
    { isSent: false, width: "210px" },
    { isSent: true, width: "150px" },
  ];

  return (
    <div className="message-skeleton">
      {skeletonMessages.map((msg, i) => (
        <div key={i} className={`skeleton-message-row ${msg.isSent ? "sent" : "received"}`}>
          {!msg.isSent && <div className="skeleton-message-avatar skeleton-shimmer"></div>}
          <div className="skeleton-message-bubble-wrapper">
            <div 
              className="skeleton-message-bubble skeleton-shimmer" 
              style={{ width: msg.width }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
