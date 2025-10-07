import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, AlertTriangle } from "lucide-react";
import { ReAuthDialog } from "./ReAuthDialog";
import { validationSchemas } from "@/utils/inputValidation";

interface W9FormProps {
  onSuccess?: () => void;
}

export const W9Form = ({ onSuccess }: W9FormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [taxIdType, setTaxIdType] = useState<"ssn" | "ein">("ssn");
  const [taxId, setTaxId] = useState("");
  const [certificationChecked, setCertificationChecked] = useState(false);
  const [showReAuthDialog, setShowReAuthDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const submitW9Mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get last 4 digits for display
      const taxIdLastFour = taxId.slice(-4);

      // Encrypt the full Tax ID
      const { data: encryptedTaxId, error: encryptError } = await supabase.rpc('encrypt_sensitive_data', {
        data: taxId
      });

      if (encryptError) {
        console.error('Encryption error:', encryptError);
        throw new Error('Failed to encrypt Tax ID');
      }

      // Generate W-9 document (without full Tax ID for security)
      const w9Content = `
W-9 Form - Request for Taxpayer Identification Number
User ID: ${user.id}
Email: ${user.email}
Tax ID Type: ${taxIdType.toUpperCase()}
Tax ID (Last 4): ****${taxIdLastFour}
Submission Date: ${new Date().toISOString()}

Certification: Under penalties of perjury, I certify that:
1. The information provided is true, correct, and complete.
2. I am a U.S. citizen or other U.S. person.
3. I am not subject to backup withholding.
      `;

      // Upload to storage bucket
      const fileName = `${user.id}/w9-${new Date().getFullYear()}.txt`;
      const { error: uploadError } = await supabase.storage
        .from("tax-documents")
        .upload(fileName, new Blob([w9Content], { type: 'text/plain' }), {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Insert into tax_documents table with encrypted Tax ID
      const { error } = await supabase
        .from("tax_documents")
        .insert({
          user_id: user.id,
          tax_id_type: taxIdType,
          tax_id_last_four: taxIdLastFour,
          tax_id_encrypted: encryptedTaxId,
          w9_file_path: fileName,
          w9_submitted_date: new Date().toISOString(),
          tax_year: new Date().getFullYear(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast({
        title: "W-9 Submitted Successfully",
        description: "Your tax information has been securely stored.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using zod schema
    const validation = validationSchemas.taxId.safeParse({
      type: taxIdType,
      value: taxId
    });

    if (!validation.success) {
      toast({
        title: "Invalid Tax ID",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!certificationChecked) {
      toast({
        title: "Certification Required",
        description: "You must certify the accuracy of this information",
        variant: "destructive",
      });
      return;
    }

    // Show re-authentication dialog before submitting
    setPendingSubmit(true);
    setShowReAuthDialog(true);
  };

  const handleReAuthSuccess = () => {
    // Proceed with submission after re-authentication
    submitW9Mutation.mutate();
    setPendingSubmit(false);
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
          <div>
            <CardTitle>W-9 Tax Information Required</CardTitle>
            <CardDescription>
              You're expected to earn $600+ this year. Please submit your W-9 information for tax
              reporting purposes (IRS requirement).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Tax Identification Type</Label>
              <RadioGroup value={taxIdType} onValueChange={(val) => setTaxIdType(val as "ssn" | "ein")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ssn" id="ssn" />
                  <Label htmlFor="ssn" className="font-normal cursor-pointer">
                    Social Security Number (SSN)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ein" id="ein" />
                  <Label htmlFor="ein" className="font-normal cursor-pointer">
                    Employer Identification Number (EIN)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="taxId">
                {taxIdType === "ssn" ? "Social Security Number" : "Employer ID Number"}
              </Label>
              <Input
                id="taxId"
                type="password"
                placeholder={taxIdType === "ssn" ? "XXX-XX-XXXX" : "XX-XXXXXXX"}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.replace(/[^0-9]/g, ""))}
                maxLength={9}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter 9 digits without dashes. We only store the last 4 digits for security.
              </p>
            </div>

            <div className="flex items-start space-x-2 bg-background p-4 rounded-lg">
              <Checkbox
                id="certification"
                checked={certificationChecked}
                onCheckedChange={(checked) => setCertificationChecked(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="certification" className="cursor-pointer">
                  <span className="font-semibold">Certification</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Under penalties of perjury, I certify that the information provided is true,
                  correct, and complete. I am a U.S. citizen or other U.S. person, and I am not
                  subject to backup withholding.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground flex-1">
              Your tax information is encrypted and stored securely. We only retain the last 4
              digits of your tax ID for verification purposes.
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitW9Mutation.isPending || pendingSubmit}>
            {submitW9Mutation.isPending || pendingSubmit ? "Submitting..." : "Submit W-9 Information"}
          </Button>
        </form>
      </CardContent>

      <ReAuthDialog
        open={showReAuthDialog}
        onOpenChange={(open) => {
          setShowReAuthDialog(open);
          if (!open) setPendingSubmit(false);
        }}
        onSuccess={handleReAuthSuccess}
        title="Confirm Tax Information Submission"
        description="For security, please verify your identity before submitting sensitive tax information"
      />
    </Card>
  );
};
