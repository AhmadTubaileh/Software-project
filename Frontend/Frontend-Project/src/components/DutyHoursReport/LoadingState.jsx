import React from 'react';

const LoadingState = () => {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-400">Loading duty hours...</p>
    </div>
  );
};

export default LoadingState;