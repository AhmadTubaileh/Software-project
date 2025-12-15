import React, { useState } from 'react';
import MobileModal from '../MobileModal.jsx';
import '../../styles/theme.css';

const ContractDetailsModal = ({ contractDetails, sponsors, onClose, onViewImage, getImageSrc }) => {
  const [detailsTab, setDetailsTab] = useState('overview');
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const statusConfig = {
    pending: { label: 'Pending Review', color: 'status-pending', emoji: '⏳' },
    active: { label: 'Active', color: 'status-active', emoji: '✅' },
    rejected: { label: 'Rejected', color: 'status-rejected', emoji: '❌' },
    completed: { label: 'Completed', color: 'status-completed', emoji: '✓' },
    deleted: { label: 'Deleted', color: 'status-deleted', emoji: '🗑️' },
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'customer', label: 'Customer', icon: '👤' },
    { id: 'sponsors', label: `Sponsors (${sponsors?.length || 0})`, icon: '👥' },
    { id: 'payments', label: 'Payments', icon: '💰' }
  ];

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title={`Contract #${contractDetails.id}`}
      size="large"
    >
      {/* Status Alerts - Horizontal if multiple */}
      {(contractDetails.original_contract_info || contractDetails.replacement_contract_info || contractDetails.status === 'rejected') && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {contractDetails.original_contract_info && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1">
              <p className="text-blue-300 text-xs flex items-center gap-1">
                <span>↻</span>
                <span>Reapplication of #{contractDetails.original_contract_info.id}</span>
              </p>
            </div>
          )}
          {contractDetails.replacement_contract_info && (
            <div className="bg-gray-500/10 border border-gray-500/30 rounded px-2 py-1">
              <p className="text-gray-300 text-xs flex items-center gap-1">
                <span>↪</span>
                <span>Replaced by #{contractDetails.replacement_contract_info.id}</span>
              </p>
            </div>
          )}
          {contractDetails.status === 'rejected' && contractDetails.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-2 py-1 flex-1 min-w-0">
              <p className="text-red-300 text-xs flex items-center gap-1">
                <span>❌</span>
                <span className="truncate"><strong>Reason:</strong> {contractDetails.rejection_reason}</span>
              </p>
              {contractDetails.decision_date && (
                <p className="text-red-300 text-xs ml-4 mt-0.5">Rejected: {formatDate(contractDetails.decision_date)}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        overflowX: 'auto',
        marginBottom: '16px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDetailsTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              borderBottom: `2px solid ${detailsTab === tab.id ? '#8B5CF6' : 'transparent'}`,
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              color: detailsTab === tab.id ? '#8B5CF6' : '#9ca3af',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        maxHeight: '60vh'
      }}>
        {/* Overview Tab */}
        {detailsTab === 'overview' && (
          <div className="space-y-3">
            {/* Contract Info - Mixed Layout */}
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <h3 className="text-sm font-semibold mb-2 text-blue-400 flex items-center gap-1.5">
                <span>📄</span>
                <span>Contract Info</span>
              </h3>
              <div className="space-y-2">
                {/* First Row - Horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-gray-400 text-xs mb-0.5">Contract ID</p>
                    <p className="font-semibold text-white text-xs">#{contractDetails.id}</p>
                  </div>
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-gray-400 text-xs mb-0.5">Sale ID</p>
                    <p className="font-semibold text-white text-xs">#{contractDetails.sale_id}</p>
                  </div>
                </div>
                {/* Item - Full Width (Vertical) */}
                <div className="bg-gray-600/30 rounded p-1.5">
                  <p className="text-gray-400 text-xs mb-0.5">Item</p>
                  <p className="font-semibold text-white text-xs">{contractDetails.item_name}</p>
                </div>
                {/* Second Row - Horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-gray-400 text-xs mb-0.5">Created By</p>
                    <p className="font-semibold text-white text-xs truncate">{contractDetails.worker_name}</p>
                  </div>
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-gray-400 text-xs mb-0.5">Start Date</p>
                    <p className="font-semibold text-white text-xs">{formatDate(contractDetails.start_date)}</p>
                  </div>
                </div>
                {/* Status - Full Width (Vertical) */}
                <div className="bg-gray-600/30 rounded p-1.5">
                  <p className="text-gray-400 text-xs mb-0.5">Status</p>
                  <p className={`font-semibold text-xs ${
                    contractDetails.status === 'completed' ? 'text-green-400' :
                    contractDetails.status === 'active' ? 'text-blue-400' :
                    contractDetails.status === 'pending' ? 'text-yellow-400' :
                    contractDetails.status === 'rejected' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {contractDetails.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary - Mixed Layout */}
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <h3 className="text-sm font-semibold mb-2 text-green-400 flex items-center gap-1.5">
                <span>💵</span>
                <span>Financial</span>
              </h3>
              <div className="space-y-2">
                {/* Total Value - Full Width (Vertical) */}
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded p-2 border border-green-500/30">
                  <p className="text-xs text-gray-400 mb-0.5">Total Value</p>
                  <p className="font-bold text-lg text-white">{formatCurrency(contractDetails.total_price)}</p>
                </div>
                {/* Down Payment & Remaining - Horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-xs text-gray-400 mb-0.5">Down Payment</p>
                    <p className="font-semibold text-sm text-blue-300">{formatCurrency(contractDetails.down_payment)}</p>
                  </div>
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                    <p className="font-semibold text-sm text-white">
                      {formatCurrency(contractDetails.total_price - contractDetails.down_payment)}
                    </p>
                  </div>
                </div>
                {/* Duration & Monthly - Horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                    <p className="font-semibold text-sm text-purple-300">{contractDetails.months} months</p>
                  </div>
                  <div className="bg-gray-600/30 rounded p-1.5">
                    <p className="text-xs text-gray-400 mb-0.5">Monthly</p>
                    <p className="font-semibold text-sm text-green-300">{formatCurrency(contractDetails.monthly_payment)}</p>
                  </div>
                </div>
                {/* Last Payment - Full Width (Vertical) */}
                <div className="bg-gray-600/30 rounded p-1.5">
                  <p className="text-xs text-gray-400 mb-0.5">Last Payment</p>
                  <p className="font-semibold text-sm text-blue-300">{formatCurrency(contractDetails.installment_last_payment)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Tab */}
        {detailsTab === 'customer' && (
          <div className="space-y-3">
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <h3 className="text-sm font-semibold mb-2 text-purple-400 flex items-center gap-1.5">
                <span>👤</span>
                <span>Customer</span>
              </h3>
              <div className="space-y-2 text-xs">
                {/* Name - Full Width (Vertical) */}
                <div className="bg-gray-600/30 rounded p-2">
                  <p className="text-gray-400 mb-0.5">Full Name</p>
                  <p className="font-semibold text-white">{contractDetails.customer_name}</p>
                </div>
                {/* Phone & ID Card - Horizontal */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-600/30 rounded p-2">
                    <p className="text-gray-400 mb-0.5">Phone</p>
                    <p className="font-semibold text-white">{contractDetails.customer_phone}</p>
                  </div>
                  <div className="bg-gray-600/30 rounded p-2">
                    <p className="text-gray-400 mb-0.5">ID Card</p>
                    <p className="font-semibold text-white font-mono text-xs break-all">{contractDetails.customer_id_card_number}</p>
                  </div>
                </div>
                {/* Email - Full Width (Vertical) */}
                {contractDetails.customer_email && (
                  <div className="bg-gray-600/30 rounded p-2">
                    <p className="text-gray-400 mb-0.5">Email</p>
                    <p className="font-semibold text-white text-xs break-all">{contractDetails.customer_email}</p>
                  </div>
                )}
                {/* Address - Full Width (Vertical) */}
                {contractDetails.customer_address && (
                  <div className="bg-gray-600/30 rounded p-2">
                    <p className="text-gray-400 mb-0.5">Address</p>
                    <p className="font-semibold text-white text-xs">{contractDetails.customer_address}</p>
                  </div>
                )}
                {/* ID Card Image - Full Width (Vertical) */}
                {contractDetails.customer_id_card_image && (
                  <div className="bg-gray-600/30 rounded p-2">
                    <p className="text-gray-400 mb-1.5 text-xs">ID Card Image</p>
                    <div className="space-y-1.5">
                      <img 
                        src={getImageSrc(contractDetails.customer_id_card_image)} 
                        alt="Customer ID Card"
                        className="w-full h-auto rounded border border-gray-500 cursor-pointer"
                        onClick={() => onViewImage({
                          full_name: contractDetails.customer_name,
                          phone: contractDetails.customer_phone,
                          id_card_number: contractDetails.customer_id_card_number,
                          email: contractDetails.customer_email,
                          address: contractDetails.customer_address,
                          id_card_image: contractDetails.customer_id_card_image
                        }, 'customer')}
                      />
                      <button
                        type="button"
                        onClick={() => onViewImage({
                          full_name: contractDetails.customer_name,
                          phone: contractDetails.customer_phone,
                          id_card_number: contractDetails.customer_id_card_number,
                          email: contractDetails.customer_email,
                          address: contractDetails.customer_address,
                          id_card_image: contractDetails.customer_id_card_image
                        }, 'customer')}
                        className="mobile-button mobile-button-primary w-full"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sponsors Tab */}
        {detailsTab === 'sponsors' && (
          <div className="space-y-3">
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
                  <span>👥</span>
                  <span>Sponsors</span>
                </h3>
                <span className="px-2 py-1 bg-gray-600 rounded text-xs font-semibold">
                  {sponsors.length}
                </span>
              </div>
              
              {sponsors.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-3xl mb-2">👥</div>
                  <p className="text-xs">No sponsors</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sponsors.map((sponsor, index) => (
                    <div key={sponsor.id || index} className="bg-gray-600/50 rounded-lg p-2.5 border border-gray-500/50">
                      {/* Header - Horizontal */}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white text-sm">Sponsor {index + 1}</h4>
                        {sponsor.relationship && (
                          <span className="px-2 py-0.5 bg-blue-600 rounded text-xs font-semibold">
                            {sponsor.relationship}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {/* Name - Full Width (Vertical) */}
                        <div className="bg-gray-700/50 rounded p-1.5">
                          <p className="text-gray-400 mb-0.5">Name</p>
                          <p className="font-semibold text-white">{sponsor.full_name}</p>
                        </div>
                        {/* Phone & ID Card - Horizontal */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="bg-gray-700/50 rounded p-1.5">
                            <p className="text-gray-400 mb-0.5">Phone</p>
                            <p className="font-semibold text-white text-xs">{sponsor.phone}</p>
                          </div>
                          <div className="bg-gray-700/50 rounded p-1.5">
                            <p className="text-gray-400 mb-0.5">ID Card</p>
                            <p className="font-semibold text-white font-mono text-xs break-all">{sponsor.id_card_number}</p>
                          </div>
                        </div>
                        {/* Address - Full Width (Vertical) */}
                        {sponsor.address && (
                          <div className="bg-gray-700/50 rounded p-1.5">
                            <p className="text-gray-400 mb-0.5">Address</p>
                            <p className="font-semibold text-white text-xs">{sponsor.address}</p>
                          </div>
                        )}
                        {/* ID Card Image - Full Width (Vertical) */}
                        {sponsor.id_card_image && (
                          <div className="bg-gray-700/50 rounded p-1.5">
                            <p className="text-gray-400 mb-1 text-xs">ID Card Image</p>
                            <div className="space-y-1">
                              <img 
                                src={getImageSrc(sponsor.id_card_image)} 
                                alt={`Sponsor ${sponsor.full_name} ID Card`}
                                className="w-full h-auto rounded border border-gray-500 cursor-pointer"
                                onClick={() => onViewImage(sponsor, 'sponsor')}
                              />
                              <button
                                type="button"
                                onClick={() => onViewImage(sponsor, 'sponsor')}
                                className="mobile-button mobile-button-primary w-full"
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                              >
                                View Full Size
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {detailsTab === 'payments' && (
          <div className="space-y-3">
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <h3 className="text-sm font-semibold mb-3 text-green-400 flex items-center gap-1.5">
                <span>💰</span>
                <span>Payment Schedule</span>
              </h3>
              {/* Payment Cards - Horizontal Grid */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <div className="text-center p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-gray-400 text-xs mb-0.5">Down</p>
                  <p className="text-base font-bold text-blue-300">{formatCurrency(contractDetails.down_payment)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Month 1</p>
                </div>
                <div className="text-center p-2 bg-green-500/10 border border-green-500/30 rounded">
                  <p className="text-gray-400 text-xs mb-0.5">Monthly</p>
                  <p className="text-base font-bold text-green-300">{formatCurrency(contractDetails.monthly_payment)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">×{Math.max(0, contractDetails.months - 2)}</p>
                </div>
                <div className="text-center p-2 bg-purple-500/10 border border-purple-500/30 rounded">
                  <p className="text-gray-400 text-xs mb-0.5">Last</p>
                  <p className="text-base font-bold text-purple-300">{formatCurrency(contractDetails.installment_last_payment)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">M{contractDetails.months}</p>
                </div>
              </div>
              {/* Total - Full Width (Vertical) */}
              <div className="pt-2 border-t border-gray-600">
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded border border-green-500/30">
                  <p className="text-gray-300 font-semibold text-sm">Total Value</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(contractDetails.total_price)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileModal>
  );
};

export default ContractDetailsModal;
