import React from 'react';
import { Check, DollarSign, Calendar, User, Package } from 'lucide-react';

// Shadcn Components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ApproveModal = ({ isOpen, onClose, contract, processing, onApprove }) => {
  if (!contract) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700/30">
        <DialogHeader className="pb-4">
          <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <DialogTitle className="text-center text-white text-lg sm:text-xl">Approve Contract</DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm">
            Are you sure you want to approve this contract?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1.5">Customer</p>
                  <p className="font-semibold text-base text-white">{contract.customer_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1.5">Item</p>
                  <p className="font-semibold text-base truncate text-white">{contract.item_name}</p>
                </div>
              </div>

              <Separator className="my-4 bg-gray-700/30" />

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground mb-2">Total Price</p>
                  <p className="text-lg font-bold text-green-500">
                    {formatCurrency(contract.total_price)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground mb-2">Duration</p>
                  <p className="text-lg font-semibold text-white">{contract.months} months</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1.5">Created</p>
                  <p className="font-medium text-base text-white">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-blue-500/10 border-blue-500/20">
            <div className="space-y-3">
              <p className="text-sm font-medium text-blue-500 mb-3">
                What happens when you approve:
              </p>
              <ul className="space-y-2.5 text-sm text-blue-500/80">
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4" />
                  Contract will be activated
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4" />
                  Payment schedule will be created
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-4 w-4" />
                  Item quantity remains reserved
                </li>
              </ul>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="flex-1 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30 hover:from-gray-700/80 hover:to-gray-800/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={onApprove}
            disabled={processing}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveModal;