import React from 'react';

const EmptyState = () => {
  return (
    <div className="text-center py-12 text-gray-400">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
      <p>No duty hours recorded for the selected date range</p>
    </div>
  );
};

export default EmptyState;