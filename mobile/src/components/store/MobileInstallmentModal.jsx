import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalSession } from '../../hooks/useLocalSession';
import '../../styles/MobileStore.css';

export default function MobileInstallmentModal({ isOpen, onClose, product, quantity }) {
  const { currentUser } = useLocalSession();
  const [formData, setFormData] = useState({
    months: 6,
    downPayment: '',
    nationalId: '',
    address: '',
    monthlyIncome: '',
    employerName: '',
    employerPhone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const totalPrice = product.price * quantity;
  const downPaymentAmount = parseFloat(formData.downPayment) || 0;
  const remainingAmount = totalPrice - downPaymentAmount;
  const monthlyPayment = remainingAmount / formData.months;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUser.id) {
      toast.error('Please login to apply for installments');
      return;
    }

    if (downPaymentAmount < totalPrice * 0.1) {
      toast.error('Down payment must be at least 10% of total price');
      return;
    }

    setSubmitting(true);

    try {
      const selectedBranchId = localStorage.getItem('selectedBranchId');
      
      const response = await fetch('http://localhost:5000/api/contracts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: product.id,
          quantity: quantity,
          totalPrice: totalPrice,
          downPayment: downPaymentAmount,
          months: formData.months,
          monthlyPayment: monthlyPayment,
          nationalId: formData.nationalId,
          address: formData.address,
          monthlyIncome: parseFloat(formData.monthlyIncome),
          employerName: formData.employerName,
          employerPhone: formData.employerPhone,
          branchId: selectedBranchId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Installment application submitted successfully!');
        onClose();
        setFormData({
          months: 6,
          downPayment: '',
          nationalId: '',
          address: '',
          monthlyIncome: '',
          employerName: '',
          employerPhone: ''
        });
      } else {
        toast.error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting installment application:', error);
      toast.error('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-modal-overlay" onClick={onClose}>
      <div className="mobile-modal-content mobile-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-modal-header">
          <h2>
            <CreditCard size={24} />
            Installment Application
          </h2>
          <button className="mobile-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mobile-modal-form">
          <div className="mobile-installment-summary">
            <h3>{product.name}</h3>
            <p>Quantity: {quantity}</p>
            <p className="mobile-installment-total">Total: ${totalPrice.toFixed(2)}</p>
          </div>

          <div className="mobile-form-group">
            <label htmlFor="months">Installment Period</label>
            <select
              id="months"
              name="months"
              value={formData.months}
              onChange={handleChange}
              required
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>

          <div className="mobile-form-group">
            <label htmlFor="downPayment">Down Payment (min 10%)</label>
            <input
              id="downPayment"
              name="downPayment"
              type="number"
              step="0.01"
              value={formData.downPayment}
              onChange={handleChange}
              placeholder={`Minimum: $${(totalPrice * 0.1).toFixed(2)}`}
              required
            />
          </div>

          {downPaymentAmount > 0 && (
            <div className="mobile-installment-calculation">
              <p>Monthly Payment: <strong>${monthlyPayment.toFixed(2)}</strong></p>
              <p>Remaining Amount: ${remainingAmount.toFixed(2)}</p>
            </div>
          )}

          <div className="mobile-form-group">
            <label htmlFor="nationalId">National ID</label>
            <input
              id="nationalId"
              name="nationalId"
              type="text"
              value={formData.nationalId}
              onChange={handleChange}
              placeholder="Enter your national ID"
              required
            />
          </div>

          <div className="mobile-form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your full address"
              rows={3}
              required
            />
          </div>

          <div className="mobile-form-group">
            <label htmlFor="monthlyIncome">Monthly Income</label>
            <input
              id="monthlyIncome"
              name="monthlyIncome"
              type="number"
              step="0.01"
              value={formData.monthlyIncome}
              onChange={handleChange}
              placeholder="Enter your monthly income"
              required
            />
          </div>

          <div className="mobile-form-group">
            <label htmlFor="employerName">Employer Name</label>
            <input
              id="employerName"
              name="employerName"
              type="text"
              value={formData.employerName}
              onChange={handleChange}
              placeholder="Enter your employer name"
              required
            />
          </div>

          <div className="mobile-form-group">
            <label htmlFor="employerPhone">Employer Phone</label>
            <input
              id="employerPhone"
              name="employerPhone"
              type="tel"
              value={formData.employerPhone}
              onChange={handleChange}
              placeholder="Enter employer phone number"
              required
            />
          </div>

          <button 
            type="submit" 
            className="mobile-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
