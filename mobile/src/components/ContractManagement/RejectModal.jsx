import React from 'react';
import { X, User, Package, AlertCircle } from 'lucide-react';

// Shadcn Components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const RejectModal = ({ isOpen, onClose, contract, processing, rejectionReason, onRejectionReasonChange, onReject }) => {
  if (!contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700/30">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <X className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="text-center">Reject Contract</DialogTitle>
          <DialogDescription className="text-center">
            Please provide a reason for rejecting this contract
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-gray-700/30">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1.5">Customer</p>
                  <p className="font-semibold text-base">{contract.customer_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1.5">Item</p>
                  <p className="font-semibold text-base truncate">{contract.item_name}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground mb-2">Contract ID</p>
                  <p className="font-semibold text-base">#{contract.id}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground mb-2">Branch</p>
                  <p className="font-semibold text-base">{contract.branch_name}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Label htmlFor="rejection-reason" className="text-sm font-medium mb-2 block">
              Rejection Reason *
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejecting this contract..."
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This reason will be recorded and visible to the sales team.
            </p>
          </div>

          <Card className="p-5 bg-red-500/10 border-red-500/20">
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-500 flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5" />
                Important consequences:
              </p>
              <ul className="space-y-2.5 text-sm text-red-500/80">
                <li className="flex items-center gap-3">
                  <X className="h-4 w-4" />
                  Item quantity will be increased by 1
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-4 w-4" />
                  Reservation will be released
                </li>
                <li className="flex items-center gap-3">
                  <X className="h-4 w-4" />
                  Contract cannot be reactivated
                </li>
              </ul>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onReject}
            disabled={processing || !rejectionReason.trim()}
            variant="destructive"
            className="flex-1"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Reject Contract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectModal;