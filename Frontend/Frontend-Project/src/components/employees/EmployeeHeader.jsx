import React from 'react';

function EmployeeHeader({ 
  searchQuery, 
  onSearchChange, 
  onAddEmployee, 
  levelFilter, 
  onLevelFilterChange,
  branchFilter,
  onBranchFilterChange,
  allBranches,
  currentUser 
}) {
  
  // Get available user types for filter based on current user
  const getAvailableLevels = () => {
    const levels = [
      { value: 'all', label: 'All Levels' },
      { value: '0', label: 'Level 0 - Admin' },
      { value: '1', label: 'Level 1 - Senior Manager' },
      { value: '2', label: 'Level 2 - Manager' },
      { value: '3', label: 'Level 3 - Supervisor' },
      { value: '4', label: 'Level 4 - Team Lead' },
      { value: '5', label: 'Level 5 - Employee' },
      { value: '6', label: 'Level 6 - Junior Employee' },
      { value: '7', label: 'Level 7 - Trainee' },
      { value: '8', label: 'Level 8 - Intern' },
      { value: '9', label: 'Level 9 - Contractor' },
      { value: '10', label: 'Level 10 - Customer' }
    ];

    // Non-admin users can't filter by higher levels
    if (currentUser.user_type === 1) { // Senior Manager
      return levels.filter(level => level.value === 'all' || parseInt(level.value) >= 2);
    }
    
    if (currentUser.user_type === 2) { // Manager
      return levels.filter(level => level.value === 'all' || parseInt(level.value) >= 3);
    }
    
    return levels;
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Employee Management</h1>
          <p className="text-gray-400 mt-2">Manage your team members and their access levels</p>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: <span className="text-blue-400">{getRoleName(currentUser.user_type)}</span>
            {currentUser.user_type !== 0 && ' - Can assign levels ' + (currentUser.user_type === 1 ? '2-10' : '3-10')}
          </p>
        </div>
        <button
          onClick={onAddEmployee}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span> Add Employee
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={onLevelFilterChange}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            {getAvailableLevels().map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={onBranchFilterChange}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500 min-w-[150px]"
          >
            <option value="all">All Branches</option>
            {allBranches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

// Helper function to get role name
function getRoleName(userType) {
  switch(userType) {
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
    default: return 'User';
  }
}

export default EmployeeHeader;