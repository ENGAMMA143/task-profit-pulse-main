import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, AlertCircle, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawFormProps {
  currentBalance: number;
}

interface UserProfile {
  id: string;
  current_balance: number;
  total_profit: number;
  total_deposited: number;
  current_level: string;
  binance_address?: string;
}

export const WithdrawForm = ({ currentBalance }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [confirmAddress, setConfirmAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [withdrawalStep, setWithdrawalStep] = useState<'validate' | 'confirm' | 'processing'>('validate');
  const { user } = useAuth();
  const { toast } = useToast();

  const MINIMUM_WITHDRAWAL = 10;
  const WITHDRAWAL_FEE_PERCENT = 2;

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      
      if (data?.binance_address) {
        setWithdrawalAddress(data.binance_address);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getWithdrawalLimits = () => {
    const level = userProfile?.current_level;
    switch (level) {
      case 'bronze':
        return { minProfit: 5, maxDaily: 50 };
      case 'silver':
        return { minProfit: 15, maxDaily: 100 };
      case 'gold':
        return { minProfit: 30, maxDaily: 200 };
      default:
        return { minProfit: 5, maxDaily: 50 };
    }
  };

  const validateWithdrawal = () => {
    const withdrawAmount = parseFloat(amount);
    const limits = getWithdrawalLimits();
    
    // Check if user has sufficient profits
    if (!userProfile?.total_profit || userProfile.total_profit < limits.minProfit) {
      setError(`You need at least $${limits.minProfit} in profits to withdraw (${userProfile?.current_level} level requirement)`);
      return false;
    }

    // Check minimum withdrawal amount
    if (withdrawAmount < MINIMUM_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL}`);
      return false;
    }

    // Check if user has sufficient balance
    if (withdrawAmount > currentBalance) {
      setError('Insufficient balance for this withdrawal amount');
      return false;
    }

    // Check daily withdrawal limit
    if (withdrawAmount > limits.maxDaily) {
      setError(`Daily withdrawal limit for ${userProfile?.current_level} level is $${limits.maxDaily}`);
      return false;
    }

    // Validate withdrawal address format (basic USDT TRC20 validation)
    if (!withdrawalAddress || withdrawalAddress.length < 34) {
      setError('Please enter a valid Binance wallet address (USDT TRC20)');
      return false;
    }

    // Check if addresses match
    if (withdrawalAddress !== confirmAddress) {
      setError('Wallet addresses do not match. Please confirm your address.');
      return false;
    }

    return true;
  };

  const handleValidation = () => {
    setError('');
    
    if (validateWithdrawal()) {
      setWithdrawalStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setWithdrawalStep('processing');

    try {
      const withdrawAmount = parseFloat(amount);
      const fee = (withdrawAmount * WITHDRAWAL_FEE_PERCENT) / 100;
      const netAmount = withdrawAmount - fee;

      // Save withdrawal address to profile if not already saved
      if (userProfile?.binance_address !== withdrawalAddress) {
        await supabase
          .from('profiles')
          .update({ binance_address: withdrawalAddress })
          .eq('id', user?.id);
      }

      // Create withdrawal request
     const response = await fetch('/api/create-withdrawal-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user?.id,
    amount: withdrawAmount,
    address: withdrawalAddress
  })
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || 'Failed to process withdrawal');


      if (withdrawError) throw withdrawError;

      // Update user balance (deduct the withdrawal amount)
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          current_balance: currentBalance - withdrawAmount 
        })
        .eq('id', user?.id);

      if (balanceError) throw balanceError;

      // Simulate processing time
      setTimeout(() => {
        setSuccess(true);
        setAmount('');
        setConfirmAddress('');
        
        toast({
          title: "Withdrawal Successful!",
          description: `$${netAmount.toFixed(2)} has been sent to your wallet. Transaction fee: $${fee.toFixed(2)}`,
        });
      }, 3000);

    } catch (error: any) {
      setError(error.message);
      setWithdrawalStep('validate');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = () => {
    const withdrawAmount = parseFloat(amount) || 0;
    return (withdrawAmount * WITHDRAWAL_FEE_PERCENT) / 100;
  };

  const calculateNetAmount = () => {
    const withdrawAmount = parseFloat(amount) || 0;
    const fee = calculateFee();
    return withdrawAmount - fee;
  };

  const limits = getWithdrawalLimits();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Withdraw Funds
            {withdrawalStep === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {withdrawalStep === 'validate' && 'Enter withdrawal details and validate your request'}
            {withdrawalStep === 'confirm' && 'Review and confirm your withdrawal'}
            {withdrawalStep === 'processing' && 'Processing your withdrawal request...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Account Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Available Balance</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">${currentBalance.toFixed(2)}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total Profits</span>
              </div>
              <div className="text-2xl font-bold text-green-900">${userProfile?.total_profit?.toFixed(2) || '0.00'}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-purple-900">Level Status</span>
              </div>
              <div className="text-lg font-bold text-purple-900 capitalize">{userProfile?.current_level || 'Bronze'}</div>
              <div className="text-xs text-purple-700">Min profit: ${limits.minProfit}</div>
            </div>
          </div>

          {/* Withdrawal Eligibility Check */}
          {(!userProfile?.total_profit || userProfile.total_profit < limits.minProfit) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need at least ${limits.minProfit} in profits to withdraw (current: ${userProfile?.total_profit?.toFixed(2) || '0.00'}).
                Complete more tasks to increase your profits.
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Validation */}
          {withdrawalStep === 'validate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawal-address">Your Binance Wallet Address (USDT TRC20) *</Label>
                <Input
                  id="withdrawal-address"
                  type="text"
                  placeholder="Enter your Binance wallet address"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-600">
                  This must be a valid USDT TRC20 address on Binance
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-address">Confirm Wallet Address *</Label>
                <Input
                  id="confirm-address"
                  type="text"
                  placeholder="Re-enter your wallet address to confirm"
                  value={confirmAddress}
                  onChange={(e) => setConfirmAddress(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-600">
                  Must match the address above exactly
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdrawal Amount (USD) *</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder={`Enter amount (min: $${MINIMUM_WITHDRAWAL}, max: $${limits.maxDaily})`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MINIMUM_WITHDRAWAL}
                  max={Math.min(currentBalance, limits.maxDaily)}
                  step="0.01"
                  required
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Min: ${MINIMUM_WITHDRAWAL}</span>
                  <span>Max: ${Math.min(currentBalance, limits.maxDaily)}</span>
                </div>
              </div>

              {amount && parseFloat(amount) >= MINIMUM_WITHDRAWAL && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Withdrawal Summary:</h4>
                  <div className="space-y-1 text-sm text-yellow-800">
                    <div className="flex justify-between">
                      <span>Withdrawal Amount:</span>
                      <span>${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee ({WITHDRAWAL_FEE_PERCENT}%):</span>
                      <span>-${calculateFee().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-yellow-300 pt-1">
                      <span>You'll Receive:</span>
                      <span>${calculateNetAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleValidation}
                className="w-full" 
                disabled={!amount || !withdrawalAddress || !confirmAddress || (userProfile?.total_profit || 0) < limits.minProfit}
              >
                Validate Withdrawal Request
              </Button>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {withdrawalStep === 'confirm' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Withdrawal details validated successfully. Please review and confirm.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3">Withdrawal Confirmation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawal Amount:</span>
                    <span className="font-medium">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-medium">-${calculateFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Net Amount:</span>
                    <span className="text-green-600">${calculateNetAmount().toFixed(2)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-gray-600">Destination Address:</div>
                    <div className="font-mono text-sm bg-white p-2 rounded border mt-1 break-all">
                      {withdrawalAddress}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setWithdrawalStep('validate')}
                  className="flex-1"
                >
                  Back to Edit
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Withdrawal
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {withdrawalStep === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Withdrawal...</h3>
              <p className="text-gray-600 mb-4">
                Your withdrawal is being processed. This usually takes 1-3 minutes.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  Funds will be sent to your Binance wallet shortly...
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🎉 Withdrawal processed successfully! Funds have been sent to your Binance wallet.
              </AlertDescription>
            </Alert>
          )}

          {/* Withdrawal Guidelines */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Withdrawal Guidelines:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Minimum withdrawal: ${MINIMUM_WITHDRAWAL}</li>
              <li>• Processing fee: {WITHDRAWAL_FEE_PERCENT}% of withdrawal amount</li>
              <li>• Daily limit for {userProfile?.current_level || 'bronze'} level: ${limits.maxDaily}</li>
              <li>• Required minimum profits: ${limits.minProfit}</li>
              <li>• Processing time: 1-24 hours</li>
              <li>• Only USDT TRC20 addresses are supported</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

