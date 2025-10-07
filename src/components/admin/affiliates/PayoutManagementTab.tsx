import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, ExternalLink, Download, FileText, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  payout_method: string;
  status: string;
  requested_at: string;
  user_email?: string;
  user_name?: string;
}

export const PayoutManagementTab = () => {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [bankDetailsDialogOpen, setBankDetailsDialogOpen] = useState(false);
  const [decryptedBankDetails, setDecryptedBankDetails] = useState<any>(null);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [revealedFields, setRevealedFields] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    const { data, error } = await supabase
      .from("ambassador_payouts")
      .select(`
        *,
        profiles!ambassador_payouts_user_id_fkey(display_name)
      `)
      .order("requested_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading payouts:", error);
    } else {
      setPayouts(data.map((p: any) => ({
        ...p,
        user_name: p.profiles?.display_name || 'Unknown'
      })));
    }
    setLoading(false);
  };

  const handleApprove = async (payoutId: string) => {
    const { error } = await supabase
      .from("ambassador_payouts")
      .update({ 
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .eq("id", payoutId);

    if (error) {
      toast.error("Failed to approve payout");
    } else {
      toast.success("Payout approved!");
      loadPayouts();
    }
  };

  const handleReject = async (payoutId: string, reason: string) => {
    const { error } = await supabase
      .from("ambassador_payouts")
      .update({ 
        status: 'cancelled',
        processed_at: new Date().toISOString(),
        failure_reason: reason
      })
      .eq("id", payoutId);

    if (error) {
      toast.error("Failed to reject payout");
    } else {
      toast.success("Payout rejected");
      loadPayouts();
    }
  };

  const handleBulkApprove = async () => {
    const payoutIds = Array.from(selectedPayouts);
    
    const { error } = await supabase
      .from("ambassador_payouts")
      .update({ 
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .in("id", payoutIds);

    if (error) {
      toast.error("Failed to approve payouts");
    } else {
      toast.success(`${payoutIds.length} payouts approved`);
      setSelectedPayouts(new Set());
      loadPayouts();
    }
  };

  const handleExportCSV = () => {
    const pendingPayouts = payouts.filter(p => p.status === 'pending');
    
    const csvHeaders = ['User Name', 'User Email', 'Amount', 'Payout Method', 'Requested At'];
    const csvRows = pendingPayouts.map(p => [
      p.user_name,
      p.user_email || '',
      p.amount.toFixed(2),
      p.payout_method,
      format(new Date(p.requested_at), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csv = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const toggleSelectPayout = (id: string) => {
    const newSelected = new Set(selectedPayouts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayouts(newSelected);
  };

  const openRejectDialog = (payoutId: string) => {
    setRejectingId(payoutId);
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectingId || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    await handleReject(rejectingId, rejectReason);
    setRejectDialogOpen(false);
    setRejectingId(null);
    setRejectReason("");
  };

  const handleViewBankDetails = async (userId: string, payoutMethod: string) => {
    if (payoutMethod !== 'bank_transfer') {
      toast.error("Bank details are only available for bank transfer payouts");
      return;
    }

    setLoadingBankDetails(true);
    setBankDetailsDialogOpen(true);
    setRevealedFields({});

    try {
      // Get the payout method record ID
      const { data: payoutMethodData, error: fetchError } = await supabase
        .from('ambassador_payout_methods')
        .select('id')
        .eq('user_id', userId)
        .eq('payout_method', 'bank_transfer')
        .single();

      if (fetchError) throw fetchError;

      // Call decrypt edge function - automatically logs access
      const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
        body: {
          table: 'ambassador_payout_methods',
          column: 'bank_details_encrypted',
          recordId: payoutMethodData.id,
          targetUserId: userId
        }
      });

      if (error) throw error;

      if (data?.decrypted) {
        setDecryptedBankDetails(JSON.parse(data.decrypted));
      } else {
        throw new Error('No decrypted data returned');
      }
    } catch (error) {
      console.error('Error decrypting bank details:', error);
      toast.error("Failed to decrypt bank details");
      setBankDetailsDialogOpen(false);
    } finally {
      setLoadingBankDetails(false);
    }
  };

  const toggleFieldVisibility = (fieldName: string) => {
    setRevealedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const maskValue = (value: string, revealed: boolean) => {
    if (!value) return 'N/A';
    if (revealed) return value;
    return '•'.repeat(Math.min(value.length, 12)) + value.slice(-4);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payout request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Setup Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              💳 Stripe Transfers
              <Badge variant="outline">Not Configured</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Enable automated payouts via Stripe Connect. Setup required:
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://stripe.com/docs/connect" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Stripe Connect Setup Docs
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              💰 PayPal Payouts
              <Badge variant="outline">Not Configured</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Enable automated payouts via PayPal Business API.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://developer.paypal.com/docs/payouts/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View PayPal API Docs
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              🏦 Bank Transfer
              <Badge variant="default">Active (Manual)</Badge>
            </h4>
            <p className="text-sm text-muted-foreground">
              Manual process: Admin exports CSV and processes via bank
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Payouts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Payout Requests</CardTitle>
            <div className="flex gap-2">
              {selectedPayouts.size > 0 && (
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Selected ({selectedPayouts.size})
                </Button>
              )}
              {payouts.filter(p => p.status === 'pending').length > 0 && (
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.filter(p => p.status === 'pending').length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending payout requests</p>
          ) : (
            <div className="space-y-4">
              {payouts.filter(p => p.status === 'pending').map((payout) => (
                <div key={payout.id} className="flex items-center gap-3 p-4 border rounded-lg">
                  <Checkbox
                    checked={selectedPayouts.has(payout.id)}
                    onCheckedChange={() => toggleSelectPayout(payout.id)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{payout.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${payout.amount.toFixed(2)} • {payout.payout_method} • {format(new Date(payout.requested_at), 'PPp')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(payout.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openRejectDialog(payout.id)}>
                      <XCircle className="w-4 h-4 mr-1 text-destructive" />
                      Reject
                    </Button>
                    {payout.payout_method === 'bank_transfer' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewBankDetails(payout.user_id, payout.payout_method)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Bank
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payouts.filter(p => p.status !== 'pending').slice(0, 10).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{payout.user_name}</p>
                  <p className="text-sm text-muted-foreground">${payout.amount.toFixed(2)} • {payout.payout_method}</p>
                </div>
                <Badge variant={payout.status === 'completed' ? 'default' : 'outline'}>
                  {payout.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Dialog */}
      <Dialog open={bankDetailsDialogOpen} onOpenChange={setBankDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Secure Bank Details View</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mt-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Access logged for compliance audit</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {loadingBankDetails ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-4 text-muted-foreground">Decrypting bank details...</p>
            </div>
          ) : decryptedBankDetails ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <div className="p-3 bg-muted rounded-md">
                  {decryptedBankDetails.accountHolderName || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bank Name</Label>
                <div className="p-3 bg-muted rounded-md">
                  {decryptedBankDetails.bankName || 'N/A'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Account Number</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFieldVisibility('accountNumber')}
                  >
                    {revealedFields.accountNumber ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Reveal</>
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md font-mono">
                  {maskValue(decryptedBankDetails.accountNumber, revealedFields.accountNumber)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Routing Number</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFieldVisibility('routingNumber')}
                  >
                    {revealedFields.routingNumber ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Reveal</>
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-muted rounded-md font-mono">
                  {maskValue(decryptedBankDetails.routingNumber, revealedFields.routingNumber)}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => loadPayouts()}>
          Refresh Payouts
        </Button>
      </div>
    </div>
  );
};
