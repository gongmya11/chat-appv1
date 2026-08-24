const SidebarSkeleton = () => {
  return (
    <div className="sidebar-skeleton">
      {Array(6)
        .fill(null)
        .map((_, i) => (
          <div key={i} className="skeleton-user-item">
            <div className="skeleton-avatar skeleton-shimmer"></div>
            <div className="skeleton-user-info">
              <div className="skeleton-name skeleton-shimmer"></div>
              <div className="skeleton-status skeleton-shimmer"></div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default SidebarSkeleton;
