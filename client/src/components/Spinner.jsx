import React from 'react';

const Spinner = ({ text = 'Loading...' }) => (
  <div className="loading-screen">
    <div className="techiz-spinner" />
    <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{text}</p>
  </div>
);

export default Spinner;
