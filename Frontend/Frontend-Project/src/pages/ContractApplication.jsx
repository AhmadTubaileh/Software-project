import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import IdVerificationStep from '../components/ContractSteps/IdVerificationStep';
import CustomerInfoStep from '../components/ContractSteps/CustomerInfoStep';
import SponsorsStep from '../components/ContractSteps/SponsorsStep';
import ContractItemsStep from '../components/ContractSteps/ContractItemsStep';
import AdminSidebar from '../components/AdminSidebar';
import { useLocalSession } from '../hooks/useLocalSession';

const ContractApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useLocalSession();
  
  // Check user permissions at the very beginning
  const userType = currentUser?.user_type ?? 5; // Default to trainee
  
  // Only Admin (0), Senior Manager (1), Manager (2), Supervisor (3), and Employee (4) can access
  // Trainee (5) cannot access
  const allowedRoles = [0, 1, 2, 3, 4];
  
  if (!allowedRoles.includes(userType)) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white">
        <AdminSidebar />
        <div className="ml-64 min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-red-500/30 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-4">
                Your account ({getRoleName(userType)}) does not have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This page is only accessible to Administrators, Managers, Supervisors, and Employees.
                Trainees cannot create new contracts.
              </p>
              <a
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Original component code continues here...
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isReapplication, setIsReapplication] = useState(false);
  const [originalContractId, setOriginalContractId] = useState(null);
  
  // Main form state - UPDATED FOR MULTIPLE ITEMS WITH QUANTITY
  const [formData, setFormData] = useState({
    // Step 1: ID Verification
    idCardNumber: '',
    existingCustomer: null,
    
    // Step 2: Customer Information
    customer: {
      full_name: '',
      phone: '',
      id_card_number: '',
      address: '',
      email: '',
      id_card_image: null
    },
    
    // Step 3: Sponsors
    sponsors: [],
    
    // Step 4: Contract Items - ARRAY FOR MULTIPLE ITEMS WITH QUANTITY
    contractItems: []
  });

  // Load reapplication data from location state or sessionStorage
  useEffect(() => {
    if (location.state?.prefillData) {
      // From navigation state
      const prefillData = location.state.prefillData;
      setIsReapplication(location.state.isReapplication || false);
      setOriginalContractId(prefillData.original_contract_id || null);
      
      setFormData(prev => ({
        ...prev,
        customer: prefillData.customer,
        sponsors: prefillData.sponsors,
        contractItems: prefillData.contractItems
      }));
      
      // Set ID card number from customer data
      if (prefillData.customer.id_card_number) {
        setFormData(prev => ({
          ...prev,
          idCardNumber: prefillData.customer.id_card_number,
          existingCustomer: {
            full_name: prefillData.customer.full_name,
            phone: prefillData.customer.phone,
            address: prefillData.customer.address,
            email: prefillData.customer.email,
            id_card_image: prefillData.customer.id_card_image,
            source_table: 'contract_customers',
            type: 'contract_customer'
          }
        }));
      }
      
      toast.success('Contract data loaded for editing. Make your changes and resubmit.', {
        duration: 4000
      });
    } else {
      // Check sessionStorage for reapplication data
      const savedData = sessionStorage.getItem('reapplyContractData');
      if (savedData) {
        try {
          const prefillData = JSON.parse(savedData);
          setIsReapplication(true);
          setOriginalContractId(prefillData.original_contract_id || null);
          
          setFormData(prev => ({
            ...prev,
            customer: prefillData.customer,
            sponsors: prefillData.sponsors,
            contractItems: prefillData.contractItems
          }));
          
          // Set ID card number from customer data
          if (prefillData.customer.id_card_number) {
            setFormData(prev => ({
              ...prev,
              idCardNumber: prefillData.customer.id_card_number,
              existingCustomer: {
                full_name: prefillData.customer.full_name,
                phone: prefillData.customer.phone,
                address: prefillData.customer.address,
                email: prefillData.customer.email,
                id_card_image: prefillData.customer.id_card_image,
                source_table: 'contract_customers',
                type: 'contract_customer'
              }
            }));
          }
          
          toast.success('Contract data loaded for editing. Make your changes and resubmit.', {
            duration: 4000
          });
          // Clear sessionStorage after loading
          sessionStorage.removeItem('reapplyContractData');
        } catch (error) {
          console.error('Error loading reapplication data:', error);
        }
      }
    }
  }, [location.state]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Function to reset form and clear reapplication data
  const handleCancelEdit = () => {
    // Clear all form data
    setFormData({
      idCardNumber: '',
      existingCustomer: null,
      customer: {
        full_name: '',
        phone: '',
        id_card_number: '',
        address: '',
        email: '',
        id_card_image: null
      },
      sponsors: [],
      contractItems: []
    });
    
    // Reset state
    setIsReapplication(false);
    setOriginalContractId(null);
    setCurrentStep(1);
    
    // Clear any stored data
    sessionStorage.removeItem('reapplyContractData');
    
    toast.success('Edit cancelled. Form cleared for new contract application.', {
      duration: 4000
    });
  };

  const handleSubmit = async () => {
    if (formData.contractItems.length === 0) {
      toast.error('Please add at least one item to the contract');
      return;
    }

    // Calculate total number of contracts (considering quantity)
    const totalContracts = formData.contractItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (totalContracts === 0) {
      toast.error('Please add at least one item to the contract');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for batch submission
      const submitData = new FormData();
      
      // Append customer data
      submitData.append('customer_data', JSON.stringify(formData.customer));
      
      // Append sponsors data
      submitData.append('sponsors_data', JSON.stringify(formData.sponsors));
      
      // Append all contract items with quantity - INCLUDING ORIGINAL CONTRACT ID
      const contractsData = [];
      
      formData.contractItems.forEach(item => {
        // For each quantity unit, create a separate contract entry
        for (let i = 0; i < item.quantity; i++) {
          contractsData.push({
            item_id: item.item_id,
            item_name: item.item_name,
            item_description: item.item_description,
            price_id: item.price_id,
            total_price: item.total_price,
            down_payment: item.down_payment,
            months: item.months,
            monthly_payment: item.monthly_payment,
            installment_last_payment: item.installment_last_payment,
            start_date: item.start_date,
            worker_id: currentUser.id,
            quantity: 1, // Each entry is for 1 item
            contract_number: i + 1, // Which copy this is (1st, 2nd, etc.)
            original_quantity: item.quantity, // Keep original for reference
            original_contract_id: isReapplication ? originalContractId : null // Track if reapplication
          });
        }
      });
      
      submitData.append('contracts_data', JSON.stringify(contractsData));

      // Append customer ID card image if exists
      if (formData.customer.id_card_image && formData.customer.id_card_image instanceof File) {
        submitData.append('customer_id_card_image', formData.customer.id_card_image);
      }

      // Append sponsor ID card images
      formData.sponsors.forEach((sponsor, index) => {
        if (sponsor.id_card_image && sponsor.id_card_image instanceof File) {
          submitData.append(`sponsor_${index}_id_card_image`, sponsor.id_card_image);
        }
      });

      // Show loading message with details
      toast.loading(`${isReapplication ? 'Resubmitting' : 'Submitting'} ${totalContracts} contract(s)...`, {
        id: 'contract-submission'
      });

      const response = await fetch('http://localhost:5000/api/contracts/apply-multiple', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contracts');
      }

      // Dismiss loading toast
      toast.dismiss('contract-submission');

      if (data.failed > 0) {
        if (data.successful > 0) {
          toast.success(`${data.successful} contract(s) ${isReapplication ? 'resubmitted' : 'submitted'} successfully!`);
          
          // Show details of failed contracts
          if (data.errors && data.errors.length > 0) {
            const failedItems = data.errors.map(err => err.item_name).join(', ');
            toast.error(`${data.failed} contract(s) failed: ${failedItems}`);
            
            // Log detailed errors for debugging
            console.error('Failed contracts details:', data.errors);
          }
        } else {
          throw new Error('All contracts failed: ' + (data.errors?.map(e => e.error).join(', ') || 'Unknown error'));
        }
      } else {
        const successMessage = isReapplication 
          ? `${data.successful} contract(s) resubmitted successfully! Original contract marked as deleted.`
          : `${data.successful} contract(s) submitted successfully!`;
        
        toast.success(successMessage);
      }

      // Show summary
      if (data.results && data.results.length > 0) {
        const uniqueItems = [...new Set(data.results.map(r => r.item_name))];
        toast.success(`Created contracts for: ${uniqueItems.join(', ')}`);
        
        // If this was a reapplication, show relationship info
        if (isReapplication) {
          const newContractIds = data.results.map(r => r.contractId).join(', ');
          toast.success(`New contract(s) #${newContractIds} created from original #${originalContractId}`);
        }
      }

      // Redirect to contract management page after delay
      setTimeout(() => {
        navigate('/contract-management');
      }, 3000);
      
    } catch (error) {
      console.error('Contract submission error:', error);
      toast.dismiss('contract-submission');
      toast.error(error.message || 'Failed to submit contract applications');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total contracts (considering quantity)
  const calculateTotalContracts = () => {
    return formData.contractItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IdVerificationStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            isReapplication={isReapplication}
          />
        );
      case 2:
        return (
          <CustomerInfoStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            isReapplication={isReapplication}
          />
        );
      case 3:
        return (
          <SponsorsStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            isReapplication={isReapplication}
          />
        );
      case 4:
        return (
          <ContractItemsStep
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
            isReapplication={isReapplication}
            originalContractId={originalContractId}
            onCancelEdit={handleCancelEdit}
          />
        );
      default:
        return null;
    }
  };

  // Remove the old access control that was checking role field
  // We already checked user_type at the beginning

  // Calculate progress based on steps completed
  const totalContracts = calculateTotalContracts();

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {/* Header with Cancel Button */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {isReapplication ? 'Edit & Resubmit Contract' : 'New Installment Contract'}
              </h1>
              <p className="text-gray-400 mt-2">
                {isReapplication 
                  ? 'Edit contract details and resubmit for approval'
                  : 'Apply for new installment purchase contract(s)'}
              </p>
              {isReapplication && originalContractId && (
                <div className="mt-4 bg-yellow-900/20 border border-yellow-500 p-3 rounded-lg inline-block">
                  <p className="text-yellow-300">
                    Editing contract #{originalContractId}. After resubmission, the original will be marked as deleted.
                  </p>
                </div>
              )}
              {currentStep === 4 && totalContracts > 0 && (
                <div className="mt-4 bg-blue-900/20 border border-blue-500 p-3 rounded-lg inline-block">
                  <p className="text-blue-300">
                    <span className="font-bold">{totalContracts}</span> contract{totalContracts !== 1 ? 's' : ''} will be created
                    {isReapplication && originalContractId && (
                      <span className="block text-yellow-300 text-sm mt-1">
                        Original contract #{originalContractId} will be marked as deleted
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            
            {/* Cancel Edit Button - Only show when in reapplication mode */}
            {isReapplication && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <span>❌</span>
                Cancel Edit
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : step < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 4 && (
                  <div className={`w-20 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-8 px-4">
            {['ID Verification', 'Customer Info', 'Sponsors', 'Contract Items'].map((label, index) => (
              <div
                key={label}
                className={`text-sm font-medium ${
                  index + 1 === currentStep ? 'text-blue-400' : 
                  index + 1 < currentStep ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            {renderStep()}
          </div>

          {/* Quick Stats Footer */}
          {currentStep === 4 && formData.contractItems.length > 0 && (
            <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{formData.contractItems.length}</span> unique product{formData.contractItems.length !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-white font-semibold">{totalContracts}</span> total contract{totalContracts !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-400">
                  Customer: <span className="text-white font-semibold">{formData.customer.full_name || 'Not set'}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Sponsors: <span className="text-white font-semibold">{formData.sponsors.length}</span>
                </div>
              </div>
              {isReapplication && originalContractId && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ After successful submission: Original contract #{originalContractId} will be marked as deleted
                  </p>
                  <p className="text-red-400 text-xs mt-1">
                    💡 Click "Cancel Edit" above to clear form and start fresh
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper function to get role name
function getRoleName(userType) {
  switch(userType) {
    case 0: return 'Administrator';
    case 1: return 'Senior Manager';
    case 2: return 'Manager';
    case 3: return 'Supervisor';
    case 4: return 'Employee';
    case 5: return 'Trainee';
    default: return 'User';
  }
}

export default ContractApplication;