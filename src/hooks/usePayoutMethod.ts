import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PayoutMethod {
  id: string;
  user_id: string;
  payout_method: 'stripe' | 'paypal' | 'bank_transfer' | null;
  stripe_account_id: string | null;
  paypal_email_encrypted: string | null;
  bank_details_encrypted: string | null;
  is_verified: boolean;
}

export interface DecryptedBankDetails {
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  bankName: string;
}

export const usePayoutMethod = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch payout method
  const { data: payoutMethod, isLoading } = useQuery({
    queryKey: ["payout-method", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("ambassador_payout_methods")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      // Map database fields to interface
      return {
        id: data.id,
        user_id: data.user_id,
        payout_method: data.payout_method as 'stripe' | 'paypal' | 'bank_transfer' | null,
        stripe_account_id: data.stripe_account_id,
        paypal_email_encrypted: (data as any).paypal_email_encrypted || null,
        bank_details_encrypted: data.bank_details_encrypted,
        is_verified: data.is_verified
      } as PayoutMethod;
    },
    enabled: !!user?.id,
  });

  // Encrypt bank details
  const encryptBankDetails = async (bankDetails: DecryptedBankDetails): Promise<string> => {
    const { data, error } = await supabase.rpc('encrypt_sensitive_data', {
      data: JSON.stringify(bankDetails)
    });

    if (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt bank details');
    }

    return data;
  };

  // Encrypt PayPal email as plain string
  const encryptPaypalEmail = async (email: string): Promise<string> => {
    const { data, error } = await supabase.rpc('encrypt_sensitive_data', {
      data: email  // Encrypt plain string, not JSON
    });

    if (error) {
      console.error('PayPal encryption error:', error);
      throw new Error('Failed to encrypt PayPal email');
    }

    return data;
  };

  // Decrypt bank details
  const decryptBankDetails = async (recordId: string): Promise<DecryptedBankDetails | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
      body: {
        table: 'ambassador_payout_methods',
        column: 'bank_details_encrypted',
        recordId,
        targetUserId: user.id
      }
    });

    if (error) {
      console.error('Decryption error:', error);
      return null;
    }

    return data?.decrypted ? JSON.parse(data.decrypted) : null;
  };

  // Decrypt PayPal email
  const decryptPaypalEmail = async (recordId: string): Promise<string | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
      body: {
        table: 'ambassador_payout_methods',
        column: 'paypal_email_encrypted',
        recordId,
        targetUserId: user.id
      }
    });

    if (error) {
      console.error('PayPal decryption error:', error);
      return null;
    }

    return data?.decrypted || null;
  };

  // Save payout method
  const savePayoutMethod = useMutation({
    mutationFn: async ({ 
      method, 
      paypalEmail,
      stripeAccountId, 
      bankDetails 
    }: { 
      method: 'stripe' | 'paypal' | 'bank_transfer';
      paypalEmail?: string;
      stripeAccountId?: string;
      bankDetails?: DecryptedBankDetails;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      let bankDetailsEncrypted = null;
      if (method === 'bank_transfer' && bankDetails) {
        bankDetailsEncrypted = await encryptBankDetails(bankDetails);
      }

      let paypalEmailEncrypted = null;
      if (method === 'paypal' && paypalEmail) {
        paypalEmailEncrypted = await encryptPaypalEmail(paypalEmail);
      }

      const { data, error } = await supabase
        .from("ambassador_payout_methods")
        .upsert({
          user_id: user.id,
          payout_method: method,
          paypal_email_encrypted: paypalEmailEncrypted,
          stripe_account_id: stripeAccountId || null,
          bank_details_encrypted: bankDetailsEncrypted,
          is_verified: false
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-method", user?.id] });
      toast.success("Payout method saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save: ${error.message}`);
    }
  });

  return {
    payoutMethod,
    isLoading,
    savePayoutMethod,
    decryptBankDetails,
    decryptPaypalEmail
  };
};
