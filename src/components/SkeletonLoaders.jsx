export function QuestionListSkeleton() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-header">
        <div className="skeleton-box pulse" style={{ width: '240px', height: '24px' }} />
        <div className="skeleton-box pulse" style={{ width: '100px', height: '24px' }} />
      </div>
      <div className="skeleton-table">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-circle pulse" />
            <div className="skeleton-box pulse" style={{ width: `${40 + (i % 3) * 20}%`, height: '18px' }} />
            <div className="skeleton-box pulse" style={{ width: '60px', height: '18px' }} />
            <div className="skeleton-box pulse" style={{ width: '120px', height: '18px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuestionPageSkeleton() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-topbar">
        <div className="skeleton-box pulse" style={{ width: '120px', height: '32px' }} />
        <div className="skeleton-box pulse" style={{ width: '180px', height: '32px' }} />
        <div className="skeleton-box pulse" style={{ width: '140px', height: '32px' }} />
      </div>
      <div className="skeleton-box pulse" style={{ width: '60%', height: '36px', margin: '20px 0' }} />
      <div className="skeleton-box pulse" style={{ width: '100%', height: '220px', borderRadius: '12px', marginBottom: '20px' }} />
      <div className="skeleton-box pulse" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-row" style={{ gap: '24px', alignItems: 'center', marginBottom: '32px' }}>
        <div className="skeleton-circle pulse" style={{ width: '80px', height: '80px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-box pulse" style={{ width: '200px', height: '24px' }} />
          <div className="skeleton-box pulse" style={{ width: '300px', height: '16px' }} />
        </div>
      </div>
      <div className="skeleton-box pulse" style={{ width: '100%', height: '180px', borderRadius: '12px' }} />
    </div>
  );
}
