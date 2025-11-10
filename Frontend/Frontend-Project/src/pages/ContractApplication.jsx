import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import IdVerificationStep from '../components/ContractSteps/IdVerificationStep';
import CustomerInfoStep from '../components/ContractSteps/CustomerInfoStep';
import SponsorsStep from '../components/ContractSteps/SponsorsStep';
import ContractDetailsStep from '../components/ContractSteps/ContractDetailsStep';
import AdminSidebar from '../components/AdminSidebar';
import { useLocalSession } from '../hooks/useLocalSession';

const ContractApplication = () => {
  const navigate = useNavigate();
  const { currentUser } = useLocalSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Main form state
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
    
    // Step 4: Contract Details
    contract: {
      item_id: '',
      total_price: 0,
      down_payment: 0,
      months: 12,
      monthly_payment: 0,
      start_date: new Date().toISOString().split('T')[0]
    }
  });

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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create FormData to handle file uploads
      const submitData = new FormData();
      
      // Append customer data
      submitData.append('customer_data', JSON.stringify(formData.customer));
      
      // Append sponsors data
      submitData.append('sponsors_data', JSON.stringify(formData.sponsors));
      
      // Append contract data
      submitData.append('contract_data', JSON.stringify({
        ...formData.contract,
        worker_id: currentUser.id
      }));

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

      const response = await fetch('http://localhost:5000/api/contracts/apply', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contract');
      }

      toast.success('Contract application submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Contract submission error:', error);
      toast.error(error.message || 'Failed to submit contract application');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <IdVerificationStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <CustomerInfoStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <SponsorsStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <ContractDetailsStep
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  // Access control
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'employee')) {
    return (
      <div className="min-h-screen bg-[#0e1830] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You need admin or employee privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e1830] text-white">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              New Installment Contract
            </h1>
            <p className="text-gray-400 mt-2">
              Apply for a new installment purchase contract
            </p>
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
            {['ID Verification', 'Customer Info', 'Sponsors', 'Contract Details'].map((label, index) => (
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
        </div>
      </main>
    </div>
  );
};

export default ContractApplication;