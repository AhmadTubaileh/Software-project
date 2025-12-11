import React from 'react';

function EmployeeCard({ employee, onEdit, onDelete, onViewImage, currentUserType }) {
  
  // Check if current user can edit/delete this employee
  const canEditDelete = () => {
    // Admin can edit/delete anyone
    if (currentUserType === 0) return true;
    
    // Users can only edit/delete employees at lower levels (higher number)
    // Also cannot edit/delete themselves
    const isSelf = employee.id === currentUserType?.id;
    if (isSelf) return false;
    
    return employee.user_type > currentUserType;
  };

  // Helper function to get image source
  const getImageSrc = () => {
    if (employee.card_image) {
      // Check if it's already a data URL or needs conversion
      if (employee.card_image.startsWith('data:image')) {
        return employee.card_image;
      }
      return `data:image/jpeg;base64,${employee.card_image}`;
    }
    return null;
  };

  const handleImageClick = () => {
    if (employee.card_image) {
      onViewImage(employee);
    }
  };

  const handleEditClick = () => {
    if (canEditDelete()) {
      onEdit(employee);
    }
  };

  const handleDeleteClick = () => {
    if (canEditDelete()) {
      onDelete(employee.id);
    }
  };

  const imageSrc = getImageSrc();

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get user type badge color
  const getUserTypeBadgeColor = (userType) => {
    switch(parseInt(userType)) {
      case 0: return 'bg-red-600'; // Admin
      case 1: return 'bg-purple-600'; // Senior Manager
      case 2: return 'bg-blue-600'; // Manager
      case 3: return 'bg-green-600'; // Supervisor
      case 4: return 'bg-teal-600'; // Team Lead
      case 5: return 'bg-indigo-600'; // Employee
      case 6: return 'bg-gray-600'; // Junior Employee
      case 7: return 'bg-yellow-600'; // Trainee
      case 8: return 'bg-orange-600'; // Intern
      case 9: return 'bg-pink-600'; // Contractor
      case 10: return 'bg-gray-400'; // Customer
      default: return 'bg-gray-600';
    }
  };

  // Check if this is the current user
  const isCurrentUser = employee.id === currentUserType?.id;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border transition-all duration-200 hover:scale-[1.02] transform-gpu relative ${
      isCurrentUser 
        ? 'border-blue-500 border-2' 
        : canEditDelete() 
          ? 'border-gray-700 hover:border-gray-600' 
          : 'border-gray-800'
    }`}>
      
      {/* Current User Indicator */}
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
          You
        </div>
      )}
      
      {/* Cannot Edit Indicator */}
      {!canEditDelete() && !isCurrentUser && (
        <div className="absolute -top-2 -right-2 bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
          Read Only
        </div>
      )}

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
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl border-2 border-gray-600">
                    👨‍💼
                  </div>
                `;
              }}
            />
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                👁️ View ID
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl border-2 border-gray-600 cursor-default"
            onClick={() => {
              if (!employee.card_image) {
                // Show tooltip or message that no ID card is available
                console.log('No ID card available for this employee');
              }
            }}
          >
            👨‍💼
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-white truncate">{employee.username}</h3>
          <p className="text-gray-400 text-sm truncate" title={employee.email}>
            {employee.email}
          </p>
          <p className="text-gray-400 text-sm">
            ID: <span className="text-gray-300">{employee.id_card || 'Not provided'}</span>
          </p>
          {employee.primary_branch_name && (
            <p className="text-gray-400 text-sm truncate">
              Branch: <span className="text-gray-300">{employee.primary_branch_name}</span>
            </p>
          )}
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
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Phone:</span>
          <span className="text-white font-medium">{employee.phone || 'Not provided'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">User Type:</span>
          <span className={`${getUserTypeBadgeColor(employee.user_type)} px-3 py-1 rounded-full text-xs text-white font-medium`}>
            Level {employee.user_type} ({getRoleName(employee.user_type)})
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Joined:</span>
          <span className="text-white font-medium">{formatDate(employee.date_joined)}</span>
        </div>
        
        {employee.accessible_branches && employee.accessible_branches.length > 0 && (
          <div className="flex justify-between items-start">
            <span className="text-gray-400">Accessible Branches:</span>
            <div className="text-right">
              <span className="text-white text-xs bg-gray-700 px-2 py-1 rounded">
                {employee.accessible_branches.length} branch{employee.accessible_branches.length !== 1 ? 'es' : ''}
              </span>
              {employee.accessible_branches.length > 0 && (
                <div className="mt-1 text-xs text-gray-400">
                  {employee.primary_branch_id && (
                    <span className="block">Primary: {
                      employee.primary_branch_name || `Branch ${employee.primary_branch_id}`
                    }</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Employee Status */}
        {employee.user_type >= 7 && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
            <span className="text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              employee.user_type === 7 ? 'bg-yellow-600 text-white' :
              employee.user_type === 8 ? 'bg-orange-600 text-white' :
              employee.user_type === 9 ? 'bg-pink-600 text-white' :
              'bg-gray-600 text-gray-300'
            }`}>
              {employee.user_type === 7 ? 'Trainee' :
               employee.user_type === 8 ? 'Intern' :
               employee.user_type === 9 ? 'Contractor' :
               'Special Status'}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={handleEditClick}
          disabled={!canEditDelete()}
          className={`flex-1 py-2 rounded text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
            canEditDelete() 
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={!canEditDelete() ? 
            (isCurrentUser ? "You cannot edit your own profile here" : 
             "You can only edit employees at lower levels") : 
            "Edit employee"}
        >
          {isCurrentUser ? 'Your Profile' : 'Edit'}
        </button>
        
        <button
          onClick={handleDeleteClick}
          disabled={!canEditDelete() || isCurrentUser}
          className={`flex-1 py-2 rounded text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
            canEditDelete() && !isCurrentUser
              ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={!canEditDelete() || isCurrentUser ? 
            (isCurrentUser ? "You cannot delete your own account" : 
             "You can only delete employees at lower levels") : 
            "Delete employee"}
        >
          Delete
        </button>
      </div>

      {/* Additional Info Tooltip for non-editable cards */}
      {!canEditDelete() && !isCurrentUser && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          <i>You can only manage employees at lower levels</i>
        </div>
      )}
    </div>
  );
}

// Helper function to get role name
function getRoleName(userType) {
  const userTypeNum = parseInt(userType);
  switch(userTypeNum) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Team Lead';
    case 5: return 'Employee';
    case 6: return 'Junior Employee';
    case 7: return 'Trainee';
    case 8: return 'Intern';
    case 9: return 'Contractor';
    case 10: return 'Customer';
    default: 
      if (userTypeNum > 10) return 'Level ' + userTypeNum;
      return 'User';
  }
}

export default EmployeeCard;