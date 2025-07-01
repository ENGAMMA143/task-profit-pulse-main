import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Copy, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositFormProps {
  onDepositSuccess: () => void;
  selectedLevel?: string;
}

export const DepositForm = ({ onDepositSuccess, selectedLevel }: DepositFormProps) => {
  const [level, setLevel] = useState(selectedLevel || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [depositStep, setDepositStep] = useState<'select-level' | 'copy-address' | 'confirm-deposit' | 'processing'>('select-level');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [checkingDeposit, setCheckingDeposit] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const binanceDepositAddress = "TQn9Y2khEsLJqJrUjXxoJ5KUdq8J7X8XQv"; // Example USDT TRC20 address

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile?.current_level && !level) {
      setLevel(userProfile.current_level);
      setDepositStep('copy-address');
    } else if (!userProfile?.current_level && !level) {
      setDepositStep('select-level');
    }
  }, [userProfile, level]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getLevelDetails = (levelName: string) => {
    switch (levelName) {
      case 'bronze':
        return { min: 5, max: 20, color: 'orange' };
      case 'silver':
        return { min: 20, max: 50, color: 'gray' };
      case 'gold':
        return { min: 50, max: 100, color: 'yellow' };
      default:
        return { min: 5, max: 20, color: 'orange' };
    }
  };

  const handleLevelSelection = () => {
    if (!level) {
      setError('Please select a level before proceeding');
      return;
    }
    setError('');
    setDepositStep('copy-address');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setAddressCopied(true);
      toast({
        title: "Address Copied!",
        description: "Binance deposit address has been copied to your clipboard.",
      });
      
      // Auto-advance to next step after copying
      setTimeout(() => {
        setDepositStep('confirm-deposit');
      }, 1500);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the address.",
        variant: "destructive"
      });
    }
  };

  const handleDepositConfirmation = async () => {
    if (!addressCopied) {
      setError('Please copy the deposit address first');
      return;
    }

    setLoading(true);
    setError('');
    setDepositStep('processing');

    try {
      const levelDetails = getLevelDetails(level);
      
      // Create deposit record
      const { error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: user?.id,
          amount: levelDetails.min,
          level_requested: level as 'bronze' | 'silver' | 'gold',
          status: 'pending',
          binance_address: binanceDepositAddress,
          amount_expected: levelDetails.min
        });

      if (depositError) throw depositError;

      // Start checking for deposit confirmation
      setCheckingDeposit(true);
      checkDepositStatus();

    } catch (error: any) {
      setError(error.message);
      setDepositStep('confirm-deposit');
    } finally {
      setLoading(false);
    }
  };

  const checkDepositStatus = async () => {
    // Simulate Binance API check (in real implementation, this would call Binance API)
    const checkInterval = setInterval(async () => {
      try {
        // Simulate random deposit confirmation after 10-30 seconds
        const randomDelay = Math.random() * 20000 + 10000;
        
        setTimeout(async () => {
          const depositConfirmed = Math.random() > 0.3; // 70% success rate for demo
          
          if (depositConfirmed) {
            // Update user profile with new level and balance
            const levelDetails = getLevelDetails(level);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                current_level: level,
                current_balance: levelDetails.min,
                total_deposited: levelDetails.min
              })
              .eq('id', user?.id);

            if (updateError) throw updateError;

            // Update deposit status
            await supabase
              .from('deposits')
              .update({ status: 'confirmed' })
              .eq('user_id', user?.id)
              .eq('status', 'pending');

            // Enable tasks for user
            await enableUserTasks();

            setSuccess(true);
            setCheckingDeposit(false);
            clearInterval(checkInterval);
            
            toast({
              title: "Deposit Confirmed!",
              description: "Your deposit has been confirmed. Tasks are now available!",
            });

            onDepositSuccess();
          } else {
            setError('Deposit not confirmed. Please check your transaction and try again.');
            setCheckingDeposit(false);
            setDepositStep('confirm-deposit');
            clearInterval(checkInterval);
          }
        }, randomDelay);

      } catch (error: any) {
        setError(error.message);
        setCheckingDeposit(false);
        setDepositStep('confirm-deposit');
        clearInterval(checkInterval);
      }
    }, 5000);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (checkingDeposit) {
        setError('Deposit confirmation timeout. Please contact support.');
        setCheckingDeposit(false);
        setDepositStep('confirm-deposit');
      }
    }, 300000);
  };

  const enableUserTasks = async () => {
    try {
      const levelDetails = getLevelDetails(level);
      const today = new Date().toISOString().split('T')[0];
      
      // Create daily tasks for the user
      for (let i = 1; i <= 10; i++) {
        await supabase
          .from('daily_tasks')
          .insert({
            user_id: user?.id,
            task_number: i,
            date: today,
            status: 'available',
            earnings: Math.random() * (levelDetails.max - levelDetails.min) + levelDetails.min,
            available_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error enabling tasks:', error);
    }
  };

  const selectedLevelDetails = level ? getLevelDetails(level) : null;

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Loader2 className={`h-5 w-5 ${depositStep === 'processing' ? 'animate-spin' : 'hidden'} text-gray-900 dark:text-gray-100`} />
            Make a Deposit
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {depositStep === 'select-level' && 'First, select your investment level to proceed'}
            {depositStep === 'copy-address' && 'Copy our Binance address to make your deposit'}
            {depositStep === 'confirm-deposit' && 'Confirm your deposit to activate your account'}
            {depositStep === 'processing' && 'Processing your deposit confirmation...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Level Selection */}
          {depositStep === 'select-level' && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  You must select an investment level before proceeding with your deposit.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-gray-700 dark:text-gray-300">Select Investment Level *</Label>
                <Select value={level} onValueChange={setLevel} required>
                  <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    <SelectValue placeholder="Choose your investment level" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <SelectItem value="bronze">Bronze ($5-$20)</SelectItem>
                    <SelectItem value="silver">Silver ($20-$50)</SelectItem>
                    <SelectItem value="gold">Gold ($50-$100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedLevelDetails && (
                <div className={`bg-${selectedLevelDetails.color}-50 p-4 rounded-lg border border-${selectedLevelDetails.color}-200 dark:bg-${selectedLevelDetails.color}-950 dark:border-${selectedLevelDetails.color}-700`}>
                  <h4 className={`font-semibold text-${selectedLevelDetails.color}-900 mb-2 dark:text-${selectedLevelDetails.color}-200`}>
                    Selected Level: {level.toUpperCase()}
                  </h4>
                  <p className={`text-sm text-${selectedLevelDetails.color}-800 dark:text-${selectedLevelDetails.color}-300`}>
                    Deposit Range: ${selectedLevelDetails.min} - ${selectedLevelDetails.max}
                  </p>
                  <p className={`text-sm text-${selectedLevelDetails.color}-800 mt-1 dark:text-${selectedLevelDetails.color}-300`}>
                    Daily Tasks: 10 | Daily Earnings: $1-$10
                  </p>
                </div>
              )}

              <Button onClick={handleLevelSelection} className="w-full" disabled={!level}>
                Continue to Deposit
              </Button>
            </div>
          )}

          {/* Step 2: Copy Address */}
          {depositStep === 'copy-address' && (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200">
                <Copy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  You must copy our Binance address before proceeding with your deposit.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2 dark:text-blue-100">Binance Deposit Address (USDT TRC20)</h3>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-3 py-2 rounded border flex-1 text-sm font-mono break-all whitespace-normal dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                    {binanceDepositAddress}
                  </code>
                  <Button
                    variant={addressCopied ? "default" : "outline"}
                    size="sm"
                    onClick={() => copyToClipboard(binanceDepositAddress)}
                    className={addressCopied ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {addressCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-blue-700 mt-2 dark:text-blue-300">
                  ⚠️ Only send USDT (TRC20) to this address. Other tokens will be lost permanently.
                </p>
              </div>

              {selectedLevelDetails && (
                <div className={`bg-${selectedLevelDetails.color}-50 p-4 rounded-lg border border-${selectedLevelDetails.color}-200 dark:bg-${selectedLevelDetails.color}-950 dark:border-${selectedLevelDetails.color}-700 dark:text-${selectedLevelDetails.color}-200`}>
                  <h4 className={`font-semibold text-${selectedLevelDetails.color}-900 mb-2 dark:text-${selectedLevelDetails.color}-100`}>
                    Deposit Instructions for {level.toUpperCase()} Level
                  </h4>
                  <p className={`text-sm text-${selectedLevelDetails.color}-800 dark:text-${selectedLevelDetails.color}-300`}>
                    Send between ${selectedLevelDetails.min} - ${selectedLevelDetails.max} USDT to the address above
                  </p>
                </div>
              )}

              {addressCopied && (
                <Button onClick={() => setDepositStep('confirm-deposit')} className="w-full">
                  I've Copied the Address - Continue
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Confirm Deposit */}
          {depositStep === 'confirm-deposit' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Address copied! Now send your deposit and click confirm below.
                </AlertDescription>
              </Alert>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 dark:text-yellow-100">Before Confirming:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 dark:text-yellow-300">
                  <li>✓ You have sent USDT (TRC20) to our Binance address</li>
                  <li>✓ The amount is within your selected level range</li>
                  <li>✓ You have the transaction hash for reference</li>
                </ul>
              </div>

              <Button onClick={handleDepositConfirmation} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Deposit Sent
              </Button>
            </div>
          )}

          {/* Step 4: Processing */}
          {depositStep === 'processing' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">Checking Your Deposit...</h3>
                <p className="text-gray-600 mb-4 dark:text-gray-400">
                  We're verifying your deposit with Binance. This usually takes 1-5 
(Content truncated due to size limit. Use line ranges to read in chunks)
