import React from 'react';

const InfoPanel = () => {
  return (
    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-blue-400 text-lg">💡</div>
        <div>
          <h4 className="font-semibold text-blue-300 mb-1">Automatic Break Detection</h4>
          <p className="text-blue-400/80 text-sm">
            Breaks are automatically calculated between your work sessions. 
            Any gap between ending one work session and starting another is counted as a break.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;