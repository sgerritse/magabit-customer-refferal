import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePayoutMethod, DecryptedBankDetails } from "@/hooks/usePayoutMethod";
import { Loader2, CreditCard, DollarSign, Building2, Shield, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReAuthDialog } from "./ReAuthDialog";
import { validationSchemas } from "@/utils/inputValidation";

export const PayoutMethodSelector = () => {
  const { user } = useAuth();
  const { payoutMethod, isLoading, savePayoutMethod, decryptBankDetails, decryptPaypalEmail } = usePayoutMethod();
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'bank_transfer'>(
    payoutMethod?.payout_method || 'paypal'
  );
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [loadingDecryption, setLoadingDecryption] = useState(false);
  const [payoutEligibility, setPayoutEligibility] = useState<{
    eligible: boolean;
    reason: string;
    hours_remaining: number;
  } | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [showReAuthDialog, setShowReAuthDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  // Load and decrypt existing PayPal email
  useEffect(() => {
    const loadPaypalEmail = async () => {
      if (payoutMethod?.payout_method === 'paypal' && 
          payoutMethod?.paypal_email_encrypted && 
          payoutMethod?.id) {
        setLoadingDecryption(true);
        try {
          const decrypted = await decryptPaypalEmail(payoutMethod.id);
          if (decrypted) {
            setPaypalEmail(decrypted);
          }
        } catch (error) {
          console.error('Failed to decrypt PayPal email:', error);
        } finally {
          setLoadingDecryption(false);
        }
      }
    };

    loadPaypalEmail();
  }, [payoutMethod?.id, payoutMethod?.paypal_email_encrypted, payoutMethod?.payout_method]);

  // Load and decrypt existing bank details
  useEffect(() => {
    const loadBankDetails = async () => {
      if (payoutMethod?.payout_method === 'bank_transfer' && 
          payoutMethod?.bank_details_encrypted && 
          payoutMethod?.id) {
        setLoadingDecryption(true);
        try {
          const decrypted = await decryptBankDetails(payoutMethod.id);
          if (decrypted) {
            setBankName(decrypted.bankName || "");
            setBankAccount(decrypted.accountNumber || "");
            setBankRouting(decrypted.routingNumber || "");
            setAccountHolder(decrypted.accountHolderName || "");
          }
        } catch (error) {
          console.error('Failed to decrypt bank details:', error);
          toast.error("Failed to load bank details");
        } finally {
          setLoadingDecryption(false);
        }
      }
    };

    loadBankDetails();
  }, [payoutMethod?.id, payoutMethod?.bank_details_encrypted, payoutMethod?.payout_method]);

  // Check payout eligibility
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user?.id) return;
      
      setIsCheckingEligibility(true);
      try {
        const { data, error } = await supabase.rpc('check_payout_eligibility' as any, {
          p_user_id: user.id
        }) as any;

        if (error) throw error;
        if (data && Array.isArray(data) && data.length > 0) {
          setPayoutEligibility(data[0]);
        }
      } catch (error) {
        console.error('Error checking payout eligibility:', error);
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [user?.id, (payoutMethod as any)?.last_changed_at]);

  const handleSave = async () => {
    setPendingSave(true);
    setShowReAuthDialog(true);
  };

  const handleReAuthSuccess = () => {
    if (selectedMethod === 'paypal') {
      // Validate PayPal email using zod schema
      const emailValidation = validationSchemas.email.safeParse(paypalEmail);
      if (!emailValidation.success) {
        toast.error(emailValidation.error.errors[0].message);
        setPendingSave(false);
        return;
      }

      savePayoutMethod.mutate({ 
        method: 'paypal', 
        paypalEmail: emailValidation.data
      });
    } else if (selectedMethod === 'bank_transfer') {
      // Validate bank details using zod schema
      const bankValidation = validationSchemas.bankAccount.safeParse({
        accountNumber: bankAccount,
        routingNumber: bankRouting,
        accountHolderName: accountHolder,
        bankName: bankName
      });

      if (!bankValidation.success) {
        toast.error(bankValidation.error.errors[0].message);
        setPendingSave(false);
        return;
      }
      
      const bankDetails: DecryptedBankDetails = {
        bankName: bankValidation.data.bankName || '',
        accountNumber: bankValidation.data.accountNumber,
        routingNumber: bankValidation.data.routingNumber,
        accountHolderName: bankValidation.data.accountHolderName
      };
      
      savePayoutMethod.mutate({
        method: 'bank_transfer',
        bankDetails
      });
    }
    setPendingSave(false);
  };

  if (isLoading || loadingDecryption) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">
            {loadingDecryption ? "Decrypting..." : "Loading..."}
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Payout Method
        </CardTitle>
        <CardDescription>
          Configure how you want to receive your commission payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        {(payoutMethod as any)?.last_changed_at && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Protection Active</AlertTitle>
            <AlertDescription>
              For your security, payout method changes are monitored. Any suspicious activity will be flagged.
              You'll receive an email notification when your payout method is changed.
            </AlertDescription>
          </Alert>
        )}

        {/* 24-Hour Delay Warning */}
        {!isCheckingEligibility && payoutEligibility && !payoutEligibility.eligible && (
          <Alert variant="destructive">
            <Clock className="h-4 w-4" />
            <AlertTitle>Payout Temporarily Unavailable</AlertTitle>
            <AlertDescription>
              {payoutEligibility.reason}
              {payoutEligibility.hours_remaining > 0 && (
                <span className="block mt-2 font-medium">
                  Time remaining: {payoutEligibility.hours_remaining} hours
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {payoutMethod?.is_verified && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <Badge variant="default" className="bg-green-600">Verified</Badge>
            <span className="text-sm text-green-800 dark:text-green-200">
              Your payout method is verified and ready to use
            </span>
          </div>
        )}

        <RadioGroup value={selectedMethod} onValueChange={(val) => setSelectedMethod(val as any)}>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="paypal" id="paypal" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="paypal" className="cursor-pointer flex items-center gap-2 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  PayPal / Venmo
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive payments directly to your PayPal or Venmo account
                </p>
                {selectedMethod === 'paypal' && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="paypal-email">PayPal/Venmo Email</Label>
                    <Input
                      id="paypal-email"
                      type="email"
                      placeholder="your@email.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="stripe" id="stripe" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="stripe" className="cursor-pointer flex items-center gap-2 font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Stripe Connect
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your bank account via Stripe for instant transfers
                </p>
                {selectedMethod === 'stripe' && (
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" disabled>
                      Connect with Stripe
                      <span className="ml-2 text-xs">(Coming Soon)</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="bank_transfer" className="cursor-pointer flex items-center gap-2 font-semibold">
                  <Building2 className="h-4 w-4" />
                  Direct Bank Transfer
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive payments via ACH transfer to your bank account
                </p>
                {selectedMethod === 'bank_transfer' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        placeholder="Chase, Bank of America, etc."
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account-holder">Account Holder Name</Label>
                      <Input
                        id="account-holder"
                        placeholder="John Doe"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="routing">Routing Number</Label>
                      <Input
                        id="routing"
                        placeholder="123456789"
                        value={bankRouting}
                        onChange={(e) => setBankRouting(e.target.value.replace(/\D/g, "").slice(0, 9))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account">Account Number</Label>
                      <Input
                        id="account"
                        type="password"
                        placeholder="••••••••••"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </RadioGroup>

        <Button
          onClick={handleSave}
          disabled={savePayoutMethod.isPending}
          className="w-full"
        >
          {savePayoutMethod.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Payout Method
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your payment information is encrypted and stored securely. We never share your financial details.
        </p>
      </CardContent>

      <ReAuthDialog
        open={showReAuthDialog}
        onOpenChange={setShowReAuthDialog}
        onSuccess={handleReAuthSuccess}
        title="Confirm Payment Method Change"
        description="For security, please re-enter your password to update your payout method"
      />
    </Card>
  );
};
