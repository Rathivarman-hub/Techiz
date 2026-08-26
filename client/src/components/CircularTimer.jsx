import React from 'react';

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CircularTimer = ({ seconds, totalSeconds, isUrgent }) => {
  const progress = seconds / totalSeconds;
  const offset = CIRCUMFERENCE * (1 - progress);
  const color = isUrgent ? '#ef476f' : seconds <= 10 ? '#ffd166' : '#6c63ff';

  return (
    <div className="timer-wrapper">
      <div className="circular-timer">
        <svg viewBox="0 0 80 80">
          <circle className="timer-bg" cx="40" cy="40" r={RADIUS} />
          <circle
            className="timer-progress"
            cx="40"
            cy="40"
            r={RADIUS}
            style={{
              stroke: color,
              strokeDasharray: CIRCUMFERENCE,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className={`timer-text ${isUrgent ? 'urgent' : ''}`}>{seconds}</div>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>SECS</span>
    </div>
  );
};

export default CircularTimer;
