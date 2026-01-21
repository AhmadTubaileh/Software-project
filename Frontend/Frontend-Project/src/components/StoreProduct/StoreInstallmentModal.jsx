import React, { useState, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import StoreCustomerInfoStep from './StoreCustomerInfoStep';
import StoreSponsorsStep from './StoreSponsorsStep';
import StoreContractItemsStep from './StoreContractItemsStep';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/store.css';

const StoreInstallmentModal = ({ isOpen, onClose, product, quantity = 1 }) => {
  const { currentUser } = useLocalSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userBranchId, setUserBranchId] = useState(null);

  // Main form state
  const [formData, setFormData] = useState({
    // Step 1: Customer Information & ID Verification
    customer: {
      full_name: '',
      phone: '',
      id_card_number: '',
      address: '',
      email: '',
      id_card_image: null
    },
    
    // Step 2: Sponsors (REQUIRED - at least one)
    sponsors: [],
    
    // Step 3: Contract Items - Pre-filled with current product (only one item)
    contractItems: []
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && currentUser && product) {
      // Reset form when modal opens
      setFormData({
        customer: {
          full_name: '',
          phone: '',
          address: '',
          email: '',
          id_card_number: '',
          id_card_image: null
        },
        sponsors: []
      });

      // Get branch ID from localStorage (the branch user is currently browsing)
      const selectedBranchId = localStorage.getItem('selectedBranchId');
      if (selectedBranchId) {
        setUserBranchId(parseInt(selectedBranchId));
      } else if (currentUser.primary_branch_id) {
        // Fallback to user's primary branch
        setUserBranchId(currentUser.primary_branch_id);
      } else {
        // Last resort: default to branch 1
        setUserBranchId(1);
      }

      setCurrentStep(1);

      // Initialize contract items with product data
      const total_price = parseFloat(product.price_installment_total) || 0;
      const months = parseInt(product.installment_months) || 12;
      const down_payment = parseFloat(product.installment_first_payment) || 0;
      
      // Calculate payments
      const remaining = total_price - down_payment;
      const equal_months = Math.max(1, months - 1);
      const raw_monthly = remaining / equal_months;
      let monthly_payment = Math.floor(raw_monthly / 10) * 10;
      let last_payment = remaining - (monthly_payment * equal_months);
      
      if (last_payment === 0) {
        monthly_payment = monthly_payment - 10;
        last_payment = 10 * equal_months;
      } else if (last_payment < 0) {
        monthly_payment = Math.floor((remaining + 10) / equal_months / 10) * 10;
        last_payment = remaining - (monthly_payment * equal_months);
      }

      const qty = Math.max(1, quantity || 1);

      setFormData(prev => ({
        ...prev,
        contractItems: [{
          item_id: product.id,
          item_name: product.name,
          item_description: product.description || '',
          price_id: product.price_id || null,
          total_price: total_price,
          down_payment: down_payment,
          months: months,
          monthly_payment: monthly_payment,
          installment_last_payment: last_payment,
          start_date: new Date().toISOString().split('T')[0],
          quantity: qty
        }]
      }));
    }
  }, [isOpen, currentUser, product, quantity]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
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
    }
  }, [isOpen]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < 3) {
      // When moving to step 2 (Sponsors), ensure at least one sponsor exists
      if (currentStep === 1 && formData.sponsors.length === 0) {
        updateFormData({
          sponsors: [{
            full_name: '',
            phone: '',
            id_card_number: '',
            relationship: '',
            address: '',
            id_card_image: null,
            existingCustomer: null,
            searched: false,
            isDuplicate: false
          }]
        });
      }
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, formData.sponsors.length, updateFormData]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    // Validate sponsors (REQUIRED - at least one)
    if (!formData.sponsors || formData.sponsors.length === 0) {
      toast.error('At least one sponsor is required for installment contracts');
      return;
    }

    // Validate all sponsors are filled
    const invalidSponsors = formData.sponsors.some(sponsor => 
      !sponsor.full_name.trim() || 
      !sponsor.phone.trim() || 
      !sponsor.id_card_number.trim() || 
      !sponsor.address.trim() ||
      sponsor.isDuplicate
    );

    if (invalidSponsors) {
      toast.error('Please fill in all required sponsor information and fix any duplicate ID cards');
      return;
    }

    if (formData.contractItems.length === 0) {
      toast.error('No item selected');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for submission
      const submitData = new FormData();
      
      // Create clean data objects without image data
      const customerDataClean = { ...formData.customer };
      delete customerDataClean.id_card_image;

      const sponsorsDataClean = formData.sponsors.map(sponsor => {
        const { 
          id_card_image: _id_card_image, 
          existingCustomer: _existingCustomer, 
          searched: _searched, 
          isDuplicate: _isDuplicate, 
          ...sponsorWithoutImage 
        } = sponsor;
        return sponsorWithoutImage;
      });

      // Append customer data (without image)
      submitData.append('customer_data', JSON.stringify(customerDataClean));

      // Append sponsors data (without images)
      submitData.append('sponsors_data', JSON.stringify(sponsorsDataClean));
      
      // Append contract items (only one item, quantity = 1, down_payment = 0)
      const contractsData = formData.contractItems.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        item_description: item.item_description,
        price_id: item.price_id,
        total_price: item.total_price,
        down_payment: item.down_payment, // Use actual down payment
        months: item.months,
        monthly_payment: item.monthly_payment,
        installment_last_payment: item.installment_last_payment,
        start_date: item.start_date,
        user_id: currentUser.id, // CHANGE FROM worker_id to user_id
        branch_id: userBranchId || 1,
        quantity: 1, // Fixed to 1 as requested
        contract_number: 1,
        original_quantity: 1
      }));
      
      submitData.append('contracts_data', JSON.stringify(contractsData));

      // Append customer ID card image if exists
      if (formData.customer.id_card_image) {
        if (formData.customer.id_card_image instanceof File) {
          submitData.append('customer_id_card_image', formData.customer.id_card_image);
        } else if (typeof formData.customer.id_card_image === 'string') {
          try {
            if (formData.customer.id_card_image.startsWith('data:')) {
              const base64Data = formData.customer.id_card_image.split(',')[1];
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'image/jpeg' });
              submitData.append('customer_id_card_image', blob, 'customer_image.jpg');
            } else {
              const binaryString = atob(formData.customer.id_card_image);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'image/jpeg' });
              submitData.append('customer_id_card_image', blob, 'customer_image.jpg');
            }
          } catch (error) {
            console.warn('Failed to convert customer base64 image:', error);
          }
        }
      }

      // Append sponsor ID card images
      formData.sponsors.forEach((sponsor, index) => {
        if (sponsor.id_card_image) {
          if (sponsor.id_card_image instanceof File) {
            submitData.append(`sponsor_${index}_id_card_image`, sponsor.id_card_image);
          } else if (typeof sponsor.id_card_image === 'string') {
            try {
              if (sponsor.id_card_image.startsWith('data:')) {
                const base64Data = sponsor.id_card_image.split(',')[1];
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/jpeg' });
                submitData.append(`sponsor_${index}_id_card_image`, blob, `sponsor_${index}_image.jpg`);
              } else {
                const binaryString = atob(sponsor.id_card_image);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/jpeg' });
                submitData.append(`sponsor_${index}_id_card_image`, blob, `sponsor_${index}_image.jpg`);
              }
            } catch (error) {
              console.warn(`Failed to convert sponsor ${index} base64 image:`, error);
            }
          }
        }
      });

      toast.loading('Submitting installment application...', { id: 'contract-submission' });

      const response = await fetch('http://localhost:5000/api/contracts/apply-multiple', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contract application');
      }

      toast.dismiss('contract-submission');

      if (data.failed > 0) {
        if (data.successful > 0) {
          toast.success(`${data.successful} contract(s) submitted successfully!`);
          if (data.errors && data.errors.length > 0) {
            const failedItems = data.errors.map(err => err.item_name).join(', ');
            toast.error(`${data.failed} contract(s) failed: ${failedItems}`);
          }
        } else {
          throw new Error('All contracts failed: ' + (data.errors?.map(e => e.error).join(', ') || 'Unknown error'));
        }
      } else {
        toast.success(`${data.successful} contract(s) submitted successfully!`);
      }

      // Close modal and redirect to My Installments page
      setTimeout(() => {
        onClose();
        window.location.href = '/my-installments';
      }, 2000);
      
    } catch (error) {
      console.error('Contract submission error:', error);
      toast.dismiss('contract-submission');
      toast.error(error.message || 'Failed to submit installment application');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StoreCustomerInfoStep
            currentUser={currentUser}
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <StoreSponsorsStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <StoreContractItemsStep
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
            product={product}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      padding: '20px'
    }}>
      <Toaster position="top-center" />
      <div className="modal" style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '12px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 178, 0, 0.1)'
      }}>
        <div className="modal-header" style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: 'rgb(255, 178, 0)', 
            fontSize: '1.6rem',
            fontWeight: 600,
            textShadow: '0 0 10px rgba(255, 178, 0, 0.3)'
          }}>
            Apply for Installment
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 80, 80, 0.7)',
              borderRadius: '50%',
              color: 'rgb(255, 80, 80)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: 0,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 80, 80, 0.15)';
              e.target.style.boxShadow = '0 0 12px rgba(255, 80, 80, 0.4)';
              e.target.style.transform = 'translateY(-1px) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0) scale(1)';
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Progress Steps */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', gap: '10px' }}>
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid',
                  backgroundColor: step === currentStep
                    ? 'rgb(181,62,32)'
                    : step < currentStep
                    ? 'rgb(16, 185, 129)'
                    : 'rgba(255,255,255,0.1)',
                  borderColor: step === currentStep
                    ? 'rgb(181,62,32)'
                    : step < currentStep
                    ? 'rgb(16, 185, 129)'
                    : 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 3 && (
                  <div style={{
                    width: '60px',
                    height: '2px',
                    backgroundColor: step < currentStep ? 'rgb(16, 185, 129)' : 'rgba(255,255,255,0.2)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default StoreInstallmentModal;
