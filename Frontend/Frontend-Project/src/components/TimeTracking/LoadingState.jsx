import React from 'react';

const LoadingState = () => {
  return (
    <div className="text-center py-8 text-gray-400">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p>Loading time tracking data...</p>
    </div>
  );
};

export default LoadingState;