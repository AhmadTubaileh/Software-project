import React from 'react';
import '../../styles/store.css';

const StoreContractItemsStep = ({ formData, updateFormData, prevStep, onSubmit, loading, product }) => {
  // Get the single contract item (should only be one)
  const contractItem = formData.contractItems[0];

  if (!contractItem) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', color: 'white', textAlign: 'center', padding: '40px' }}>
        <p>No item selected. Please go back and try again.</p>
        <button onClick={prevStep} className="mars-order-installment-btn" style={{ marginTop: '20px' }}>
          ← Back
        </button>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Calculate the actual installment payments
  const calculatePayments = () => {
    const totalPrice = contractItem.total_price;
    const downPayment = contractItem.down_payment || 0;
    const months = contractItem.months;
    
    // Calculate remaining amount after down payment
    const remaining = totalPrice - downPayment;
    
    // Calculate monthly payments (excluding last month which might be different)
    const equalMonths = Math.max(1, months - 1);
    const rawMonthly = remaining / equalMonths;
    
    // Round to nearest 10 for cleaner numbers
    let monthlyPayment = Math.floor(rawMonthly / 10) * 10;
    let lastPayment = remaining - (monthlyPayment * equalMonths);
    
    // Adjust if last payment is 0 or negative
    if (lastPayment <= 0) {
      monthlyPayment = monthlyPayment - 10;
      lastPayment = 10 * equalMonths;
    }
    
    return {
      downPayment,
      monthlyPayment,
      lastPayment,
      remaining,
      equalMonths
    };
  };

  const payments = calculatePayments();
  const canSubmit = () => {
    return contractItem && contractItem.total_price > 0 && contractItem.months >= 3;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: 'rgb(181,62,32)', fontSize: '1.5rem', marginBottom: '20px' }}>
        Step 3: Contract Details
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Selected Item */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px' }}>
            Selected Item
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '10px' }}>
              {contractItem.item_name}
            </h4>
          </div>

          {/* Contract Terms - Read Only */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            {/* Total Price */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Total Price *
              </label>
              <input
                type="text"
                readOnly
                value={formatCurrency(contractItem.total_price)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Down Payment - NEW FIELD */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Down Payment *
              </label>
              <input
                type="text"
                readOnly
                value={formatCurrency(contractItem.down_payment || 0)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Total Months */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Total Months *
              </label>
              <input
                type="text"
                readOnly
                value={contractItem.months}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Remaining After Down Payment - NEW FIELD */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Remaining After Down Payment
              </label>
              <input
                type="text"
                readOnly
                value={formatCurrency(payments.remaining)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Monthly Payment - Use calculated value */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Monthly Payment
              </label>
              <input
                type="text"
                readOnly
                value={formatCurrency(payments.monthlyPayment)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Last Month Payment - Use calculated value */}
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontSize: '0.9rem' }}>
                Last Month Payment
              </label>
              <input
                type="text"
                readOnly
                value={formatCurrency(payments.lastPayment)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          </div>

          {/* Payment Schedule - UPDATED with Down Payment */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '15px'
          }}>
            <h5 style={{ color: 'white', fontSize: '1rem', marginBottom: '15px' }}>Payment Schedule:</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              {/* Down Payment */}
              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                  Down Payment
                </p>
                <p style={{ color: 'rgb(245, 158, 11)', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(payments.downPayment)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '5px 0 0 0' }}>
                  At Contract Start
                </p>
              </div>
              
              {/* Monthly Payments */}
              <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                  Monthly × {payments.equalMonths}
                </p>
                <p style={{ color: 'rgb(59, 130, 246)', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(payments.monthlyPayment)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '5px 0 0 0' }}>
                  Months 1-{payments.equalMonths}
                </p>
              </div>
              
              {/* Last Month Payment */}
              <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '6px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                  Last Month Payment
                </p>
                <p style={{ color: 'rgb(139, 92, 246)', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(payments.lastPayment)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '5px 0 0 0' }}>
                  Month {contractItem.months}
                </p>
              </div>
              
              {/* Total */}
              <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '0 0 5px 0' }}>
                  Total
                </p>
                <p style={{ color: 'rgb(16, 185, 129)', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                  {formatCurrency(contractItem.total_price)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: '5px 0 0 0' }}>
                  Sum of All Payments
                </p>
              </div>
            </div>
            
            {/* Payment Summary */}
            <div style={{ 
              marginTop: '15px', 
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '6px'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
                <strong>Payment Breakdown:</strong> {formatCurrency(payments.downPayment)} (Down) + 
                ({payments.equalMonths} × {formatCurrency(payments.monthlyPayment)}) + 
                {formatCurrency(payments.lastPayment)} (Last) = {formatCurrency(contractItem.total_price)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={prevStep}
            disabled={loading}
            className="mars-order-installment-btn"
          >
            ← Back
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit() || loading}
            className="mars-order-add-btn"
            style={{ 
              opacity: (canSubmit() && !loading) ? 1 : 0.5,
              cursor: (canSubmit() && !loading) ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Application →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreContractItemsStep;