import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DepositFormProps {
  onDepositSuccess: () => void;
}

export const DepositForm = ({ onDepositSuccess }: DepositFormProps) => {
  const { session } = useAuth();
  const token = session?.access_token || '';
  const { toast } = useToast();

  const [step, setStep] = useState<'select' | 'address' | 'confirm' | 'done'>('select');
  const [level, setLevel] = useState<'bronze' | 'silver' | 'gold' | ''>('');
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const levelConfig = {
    bronze: { min: 5, max: 20 },
    silver: { min: 20, max: 50 },
    gold: { min: 50, max: 100 },
  };

  // 1) بعد اختيار المستوى، استدعي الـ API لجلب العنوان
  const handleSelectLevel = async () => {
    if (!level) return setError('Please select an investment level');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/deposits/get-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coin: 'USDT', network: 'TRC20' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch address');
      setAddress(data.address);
      setStep('address');
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // 2) نسخ العنوان والانتقال لخطوة التأكيد
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({ title: 'Copied', description: 'Deposit address copied.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' });
    }
  };

  // 3) تأكيد الإنشاء: سجل الإيداع في الباك إند
  const handleConfirm = async () => {
    if (!copied) return setError('Please copy the address first');
    setError('');
    setLoading(true);
    try {
      const amount = levelConfig[level].min;
      const res = await fetch('/api/deposits/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coin: 'USDT', network: 'TRC20', amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create deposit');
      toast({ title: 'Deposit Created', description: `Please send ${amount} USDT.` });
      setStep('done');
      onDepositSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className={`h-5 w-5 ${loading ? 'animate-spin' : 'hidden'}`} />
          {step === 'select' && 'Select Your Level'}
          {step === 'address' && 'Copy Deposit Address'}
          {step === 'confirm' && 'Confirm Your Deposit'}
          {step === 'done' && 'Deposit Started'}
        </CardTitle>
        <CardDescription>
          {{
            select: 'Choose an investment level to proceed.',
            address: 'Copy the address below to make your deposit.',
            confirm: 'Click confirm after you have sent the funds.',
            done: 'Your deposit is pending confirmation.'
          }[step]}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* اختيار المستوى */}
        {step === 'select' && (
          <>
            <Label>Investment Level</Label>
            <Select value={level} onValueChange={val => setLevel(val as any)}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze ($5–$20)</SelectItem>
                <SelectItem value="silver">Silver ($20–$50)</SelectItem>
                <SelectItem value="gold">Gold ($50–$100)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSelectLevel} disabled={!level}>Next</Button>
          </>
        )}

        {/* عرض العنوان */}
        {step === 'address' && (
          <>
            <Label>Deposit Address</Label>
            <div className="flex items-center space-x-2">
              <code className="break-all flex-1">{address}</code>
              <Button size="sm" onClick={handleCopy}>
                {copied ? <CheckCircle /> : <Copy />}
              </Button>
            </div>
            <Button onClick={() => setStep('confirm')} disabled={!copied}>Continue</Button>
          </>
        )}

        {/* تأكيد الإنشاء */}
        {step === 'confirm' && (
          <>
            <Alert>
              <CheckCircle className="mr-2" />
              <AlertDescription>You've copied the address. Confirm to create deposit record.</AlertDescription>
            </Alert>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleConfirm} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 animate-spin" />} Confirm Deposit
            </Button>
          </>
        )}

        {/* مكتمل */}
        {step === 'done' && (
          <Alert variant="success">
            <CheckCircle className="mr-2" />
            <AlertDescription>Your deposit request is pending. Thank you!</AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
};
