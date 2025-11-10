import React from 'react';

const ContractDetailsModal = ({ contractDetails, sponsors, onClose, onViewImage, getImageSrc }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700/50 bg-gray-900/50 sticky top-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Contract Details</h2>
            <p className="text-gray-400">
              Contract #{contractDetails.id} • {contractDetails.item_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-700/50 rounded-lg p-1">
            <button className="flex-1 py-2 px-4 rounded-md bg-blue-600 text-white">
              📋 Contract & Customer
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Information */}
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Contract Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Contract ID</label>
                    <p className="font-semibold">#{contractDetails.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sale ID</label>
                    <p className="font-semibold">#{contractDetails.sale_id}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Item</label>
                  <p className="font-semibold text-lg">{contractDetails.item_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Created By</label>
                    <p className="font-semibold">{contractDetails.worker_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Start Date</label>
                    <p className="font-semibold">{formatDate(contractDetails.start_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Financial Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Total Price</label>
                    <p className="font-semibold text-xl">{formatCurrency(contractDetails.total_price)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Down Payment</label>
                    <p className="font-semibold text-xl">{formatCurrency(contractDetails.down_payment)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Financed Amount</label>
                    <p className="font-semibold text-lg">
                      {formatCurrency(contractDetails.total_price - contractDetails.down_payment)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Contract Duration</label>
                    <p className="font-semibold text-lg">{contractDetails.months} months</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Monthly Payment</label>
                  <p className="font-semibold text-2xl text-green-400">
                    {formatCurrency(contractDetails.monthly_payment)}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information - FIXED IMAGE DISPLAY */}
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Full Name</label>
                  <p className="font-semibold text-lg">{contractDetails.customer_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Phone</label>
                    <p className="font-semibold">{contractDetails.customer_phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">ID Card</label>
                    <p className="font-semibold font-mono">{contractDetails.customer_id_card_number}</p>
                  </div>
                </div>
                {contractDetails.customer_email && (
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="font-semibold">{contractDetails.customer_email}</p>
                  </div>
                )}
                {contractDetails.customer_address && (
                  <div>
                    <label className="text-sm text-gray-400">Address</label>
                    <p className="font-semibold">{contractDetails.customer_address}</p>
                  </div>
                )}
                {/* Customer ID Card Image - FIXED TO WORK LIKE SPONSORS */}
                <div>
                  <label className="text-sm text-gray-400">ID Card Image</label>
                  {contractDetails.customer_id_card_image ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-4">
                        <img 
                          src={getImageSrc(contractDetails.customer_id_card_image)} 
                          alt="Customer ID Card"
                          className="w-32 h-20 object-cover rounded border border-gray-600 cursor-pointer hover:border-blue-500 transition-colors duration-200"
                          onClick={() => onViewImage({
                            full_name: contractDetails.customer_name,
                            phone: contractDetails.customer_phone,
                            id_card_number: contractDetails.customer_id_card_number,
                            email: contractDetails.customer_email,
                            address: contractDetails.customer_address,
                            id_card_image: contractDetails.customer_id_card_image
                          }, 'customer')}
                        />
                        <div>
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
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors duration-200 mb-2"
                          >
                            🔍 View Full Size
                          </button>
                          <p className="text-xs text-gray-400">Click image to view full size</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">No ID card image available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sponsors Information */}
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-yellow-400">Sponsors</h3>
                <span className="px-3 py-1 bg-gray-600 rounded-full text-sm">
                  {sponsors.length} Sponsor{sponsors.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {sponsors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="text-2xl mb-2">👥</div>
                  <p>No sponsors for this contract</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {sponsors.map((sponsor, index) => (
                    <div key={sponsor.id || index} className="bg-gray-600/50 rounded-lg p-4 border border-gray-500/50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-lg">Sponsor {index + 1}</h4>
                        {sponsor.relationship && (
                          <span className="px-2 py-1 bg-blue-600 rounded text-xs font-semibold">
                            {sponsor.relationship}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <p className="font-semibold">{sponsor.full_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <p className="font-semibold">{sponsor.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">ID Card:</span>
                          <p className="font-semibold font-mono">{sponsor.id_card_number}</p>
                        </div>
                        {sponsor.address && (
                          <div>
                            <span className="text-gray-400">Address:</span>
                            <p className="font-semibold">{sponsor.address}</p>
                          </div>
                        )}
                        {/* Sponsor ID Card Image */}
                        <div>
                          <span className="text-gray-400">ID Card Image:</span>
                          {sponsor.id_card_image ? (
                            <div className="mt-1">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={getImageSrc(sponsor.id_card_image)} 
                                  alt={`Sponsor ${sponsor.full_name} ID Card`}
                                  className="w-20 h-12 object-cover rounded border border-gray-500 cursor-pointer hover:border-blue-500 transition-colors duration-200"
                                  onClick={() => onViewImage(sponsor, 'sponsor')}
                                />
                                <button
                                  type="button"
                                  onClick={() => onViewImage(sponsor, 'sponsor')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors duration-200"
                                >
                                  View Full Size
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-xs mt-1">No ID card image available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsModal;