import React, { useState } from 'react';
import { X, ClipboardList, User, Users, DollarSign, Phone, Mail, MapPin, Calendar } from 'lucide-react';

// Shadcn Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ContractDetailsModal = ({ isOpen, onClose, contractDetails, sponsors, onViewImage, getImageSrc }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!contractDetails) return null;

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

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    deleted: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 z-[200] bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700/30">
        <DialogHeader className="p-4 sm:p-6 border-b border-gray-700/30 bg-gradient-to-br from-gray-800/80 to-gray-900/90 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl">Contract #{contractDetails.id}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                {contractDetails.item_name || 'Unknown Item'}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Relationship Info */}
        {(contractDetails.original_contract_info || contractDetails.replacement_contract_info || contractDetails.status === 'rejected') && (
          <div className="px-4 sm:px-6 py-2 sm:py-3 shrink-0 border-b border-gray-700/30">
            <div className="flex flex-wrap gap-2">
              {contractDetails.original_contract_info && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs">
                  🔄 Reapplication of #{contractDetails.original_contract_info.id}
                </Badge>
              )}
              {contractDetails.replacement_contract_info && (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30 text-xs">
                  🔁 Replaced by #{contractDetails.replacement_contract_info.id}
                </Badge>
              )}
              {contractDetails.status === 'rejected' && contractDetails.rejection_reason && (
                <Badge variant="destructive" className="text-xs">
                  ❌ Rejected: {contractDetails.rejection_reason}
                </Badge>
              )}
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid grid-cols-4 px-3 sm:px-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-b border-gray-700/30 shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Customer</span>
              <span className="sm:hidden">Customer</span>
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sponsors ({sponsors.length})</span>
              <span className="sm:hidden">({sponsors.length})</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar min-h-0">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-8">
              <div className="space-y-5">
                <h3 className="text-base font-semibold flex items-center gap-3 mb-4">
                  <ClipboardList className="h-5 w-5" />
                  Contract Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Contract ID</p>
                    <p className="font-semibold text-base">#{contractDetails.id}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Sale ID</p>
                    <p className="font-semibold text-base">#{contractDetails.sale_id}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Item Name</p>
                    <p className="font-semibold text-base">{contractDetails.item_name}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Status</p>
                    <Badge variant="outline" className={statusColors[contractDetails.status]}>
                      {contractDetails.status.charAt(0).toUpperCase() + contractDetails.status.slice(1)}
                    </Badge>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Created By</p>
                    <p className="font-semibold text-base">{contractDetails.worker_name}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Start Date</p>
                    <p className="font-semibold text-base">{formatDate(contractDetails.start_date)}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Branch</p>
                    <p className="font-semibold text-base">{contractDetails.branch_name}</p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Created At</p>
                    <p className="font-semibold text-base">{formatDate(contractDetails.created_at)}</p>
                  </Card>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-5">
                <h3 className="text-base font-semibold flex items-center gap-3 mb-4">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-3">Total Contract Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(contractDetails.total_price)}</p>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-3">Down Payment</p>
                    <p className="text-xl font-semibold text-blue-500">
                      {formatCurrency(contractDetails.down_payment)}
                    </p>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-3">Remaining Amount</p>
                    <p className="text-xl font-semibold">
                      {formatCurrency(contractDetails.total_price - contractDetails.down_payment)}
                    </p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Monthly Payment</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(contractDetails.monthly_payment)}
                    </p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Duration</p>
                    <p className="text-lg font-semibold">
                      {contractDetails.months} months
                    </p>
                  </Card>
                  <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <p className="text-sm text-muted-foreground mb-2.5">Last Payment Date</p>
                    <p className="text-lg font-semibold">
                      {formatDate(contractDetails.last_payment_date)}
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="mt-0 space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">Full Name</p>
                        <p className="text-lg font-semibold">{contractDetails.customer_name}</p>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                            <p className="font-medium text-base">{contractDetails.customer_phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground mb-1">ID Card Number</p>
                            <p className="font-medium text-base">{contractDetails.customer_id_card_number}</p>
                          </div>
                        </div>
                        {contractDetails.customer_email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground mb-1">Email</p>
                              <p className="font-medium text-base">{contractDetails.customer_email}</p>
                            </div>
                          </div>
                        )}
                        {contractDetails.customer_address && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground mb-1">Address</p>
                              <p className="font-medium text-base">{contractDetails.customer_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {contractDetails.customer_id_card_image && (() => {
                    const imageSrc = getImageSrc(contractDetails.customer_id_card_image);
                    return imageSrc ? (
                      <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold">ID Card Image</h4>
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <img
                              src={imageSrc}
                              alt="Customer ID Card"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Failed to load customer image:', {
                                  src: imageSrc?.substring(0, 100),
                                  srcType: typeof imageSrc,
                                  rawData: contractDetails.customer_id_card_image?.substring(0, 100),
                                  rawDataType: typeof contractDetails.customer_id_card_image,
                                  rawDataLength: contractDetails.customer_id_card_image?.length
                                });
                                e.target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs sm:text-sm p-4 bg-gray-800';
                                errorDiv.textContent = 'Failed to load image';
                                if (e.target.parentElement) {
                                  e.target.parentElement.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                          <Button
                            onClick={() => onViewImage({
                              full_name: contractDetails.customer_name,
                              phone: contractDetails.customer_phone,
                              id_card_number: contractDetails.customer_id_card_number,
                              email: contractDetails.customer_email,
                              address: contractDetails.customer_address,
                              id_card_image: contractDetails.customer_id_card_image
                            }, 'customer')}
                            variant="outline"
                            className="w-full"
                          >
                            View Full Size
                          </Button>
                        </div>
                      </Card>
                    ) : null;
                  })()}
                </div>
              </div>
            </TabsContent>

            {/* Sponsors Tab */}
            <TabsContent value="sponsors" className="mt-0">
              {sponsors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No sponsors for this contract</p>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden pr-2 space-y-4 sm:space-y-5 custom-scrollbar">
                  {sponsors.map((sponsor, index) => (
                    <Card key={sponsor.id || index} className="overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                      <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-semibold">Sponsor {index + 1}</h4>
                          {sponsor.relationship && (
                            <Badge variant="secondary" className="text-xs shrink-0">{sponsor.relationship}</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-3 sm:space-y-4">
                          <div className="space-y-1 sm:space-y-1.5">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Full Name</p>
                            <p className="font-semibold text-sm sm:text-base">{sponsor.full_name}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1 sm:space-y-1.5">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Phone</p>
                              <p className="font-medium text-sm sm:text-base">{sponsor.phone}</p>
                            </div>
                            <div className="space-y-1 sm:space-y-1.5">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">ID Card</p>
                              <p className="font-medium font-mono text-xs sm:text-sm">{sponsor.id_card_number}</p>
                            </div>
                          </div>
                          {sponsor.address && (
                            <div className="space-y-1 sm:space-y-1.5">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">Address</p>
                              <p className="font-medium text-sm sm:text-base">{sponsor.address}</p>
                            </div>
                          )}
                        </div>

                        {sponsor.id_card_image && (() => {
                          const imageSrc = getImageSrc(sponsor.id_card_image);
                          return imageSrc ? (
                            <div className="space-y-3 sm:space-y-4 pt-2">
                              <Separator className="my-3 sm:my-4" />
                              <div className="space-y-2.5 sm:space-y-3">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">ID Card Image</p>
                                <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-gray-700/30">
                                  <img
                                    src={imageSrc}
                                    alt={`Sponsor ${sponsor.full_name} ID Card`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Failed to load sponsor image:', {
                                        src: imageSrc?.substring(0, 100),
                                        srcType: typeof imageSrc,
                                        rawData: sponsor.id_card_image?.substring(0, 100),
                                        rawDataType: typeof sponsor.id_card_image,
                                        rawDataLength: sponsor.id_card_image?.length
                                      });
                                      e.target.style.display = 'none';
                                      const errorDiv = document.createElement('div');
                                      errorDiv.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs sm:text-sm p-4 bg-gray-800';
                                      errorDiv.textContent = 'Failed to load image';
                                      if (e.target.parentElement) {
                                        e.target.parentElement.appendChild(errorDiv);
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  onClick={() => onViewImage(sponsor, 'sponsor')}
                                  variant="outline"
                                  className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white text-xs sm:text-sm"
                                >
                                  View Full Size
                                </Button>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-0 space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-6 text-center bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Down Payment</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {formatCurrency(contractDetails.down_payment)}
                      </p>
                      <p className="text-xs text-muted-foreground">Month 1</p>
                    </div>
                  </Card>
                  <Card className="p-6 text-center bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Monthly Payment</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency(contractDetails.monthly_payment)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ×{Math.max(0, contractDetails.months - 2)} months
                      </p>
                    </div>
                  </Card>
                  <Card className="p-6 text-center bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Last Payment</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {formatCurrency(contractDetails.installment_last_payment)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Month {contractDetails.months}
                      </p>
                    </div>
                  </Card>
                </div>

                <Card className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Contract Value</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(contractDetails.total_price)}</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                </Card>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">Payment Breakdown</h4>
                  <div className="space-y-3">
                    {contractDetails.months && Array.from({ length: contractDetails.months }).map((_, index) => {
                      const monthNumber = index + 1;
                      let amount = contractDetails.monthly_payment;
                      if (monthNumber === 1) amount = contractDetails.down_payment;
                      if (monthNumber === contractDetails.months) amount = contractDetails.installment_last_payment;
                      
                      return (
                        <Card key={index} className="p-4 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                monthNumber === 1 ? 'bg-blue-500/10 text-blue-500' :
                                monthNumber === contractDetails.months ? 'bg-purple-500/10 text-purple-500' :
                                'bg-green-500/10 text-green-500'
                              }`}>
                                {monthNumber}
                              </div>
                              <div>
                                <p className="font-medium">Month {monthNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {monthNumber === 1 ? 'Down Payment' : 
                                   monthNumber === contractDetails.months ? 'Final Payment' : 
                                   'Monthly Payment'}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold">{formatCurrency(amount)}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailsModal;