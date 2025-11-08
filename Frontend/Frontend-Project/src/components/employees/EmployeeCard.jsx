import React from 'react';

function EmployeeCard({ employee, onEdit, onDelete, onViewImage }) {
  
  // Helper function to get image source
  const getImageSrc = () => {
    if (employee.card_image) {
      return `data:image/jpeg;base64,${employee.card_image}`;
    }
    return null;
  };

  const handleImageClick = () => {
    if (employee.card_image) {
      onViewImage(employee);
    }
  };

  const imageSrc = getImageSrc();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200 hover:scale-105 transform-gpu">
      <div className="flex items-center gap-4 mb-4">
        {imageSrc ? (
          <div 
            className="relative cursor-pointer group"
            onClick={handleImageClick}
          >
            <img
              src={imageSrc}
              alt={employee.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-500 transition-colors duration-200"
            />
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                👁️ View ID
              </span>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
            👨‍💼
          </div>
        )}
        <div>
          <h3 className="font-semibold text-lg">{employee.username}</h3>
          <p className="text-gray-400 text-sm">{employee.email}</p>
          {/* FIXED: Handle undefined id_card */}
          <p className="text-gray-400 text-sm">
            ID: {employee.id_card || 'Not provided'}
          </p>
          {imageSrc && (
            <button
              onClick={handleImageClick}
              className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors duration-200"
            >
              View ID Card
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Phone:</span>
          <span>{employee.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">User Type:</span>
          <span className="bg-blue-600 px-2 py-1 rounded text-xs">
            Level {employee.user_type}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Joined:</span>
          <span>{new Date(employee.date_joined).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => onEdit(employee)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition-colors duration-200 transform hover:scale-105"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(employee.id)}
          className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded text-sm transition-colors duration-200 transform hover:scale-105"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default EmployeeCard;