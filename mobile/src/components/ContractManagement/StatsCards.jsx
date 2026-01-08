import React from 'react';
import { DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';

// Shadcn Components
import { Card, CardContent } from '@/components/ui/card';

const StatsCards = ({ contracts }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    totalActive: contracts.filter(c => c.status !== 'deleted').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    active: contracts.filter(c => c.status === 'active').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    activeValue: contracts
      .filter(c => c.status === 'active')
      .reduce((sum, contract) => sum + parseFloat(contract.total_price || 0), 0),
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 mb-3 sm:mb-4">
        {/* Total Active */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="space-y-0.5 sm:space-y-1 md:space-y-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Total Active</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-500 truncate leading-none">{stats.totalActive}</p>
              </div>
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-500/50 shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="space-y-0.5 sm:space-y-1 md:space-y-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Pending</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-yellow-500 truncate leading-none">{stats.pending}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-yellow-500/50 shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="space-y-0.5 sm:space-y-1 md:space-y-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Active</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-500 truncate leading-none">{stats.active}</p>
              </div>
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-green-500/50 shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              <div className="space-y-0.5 sm:space-y-1 md:space-y-2 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Completed</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-500 truncate leading-none">{stats.completed}</p>
              </div>
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-500/50 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Contracts Value */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
        <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-5">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="space-y-0.5 sm:space-y-1 md:space-y-2 min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 leading-tight">Active Contracts Value</p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-emerald-500 truncate leading-none">
                {formatCurrency(stats.activeValue)}
              </p>
            </div>
            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-emerald-500/50 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;