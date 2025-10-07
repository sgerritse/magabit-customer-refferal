import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const TaxComplianceTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Fetch ambassadors with their earnings and W-9 status
  const { data: ambassadors, isLoading } = useQuery({
    queryKey: ["tax-compliance", selectedYear],
    queryFn: async () => {
      const { data: earnings, error: earningsError } = await supabase
        .from("ambassador_earnings")
        .select(`
          user_id,
          amount,
          earned_at,
          profiles:user_id (
            display_name
          )
        `)
        .eq("status", "paid")
        .gte("earned_at", `${selectedYear}-01-01`)
        .lte("earned_at", `${selectedYear}-12-31`);

      if (earningsError) throw earningsError;

      // Get all users with decrypted PII (admin-only, audit-logged)
      const { data: allUsers, error: usersError } = await supabase
        .rpc('get_all_users_decrypted');

      if (usersError) throw usersError;

      // Create a map of user data by user_id
      const usersMap = new Map(
        allUsers?.map((user: any) => [user.id, user]) || []
      );

      // Aggregate earnings by user
      const earningsByUser = earnings?.reduce((acc: any, earning: any) => {
        const userId = earning.user_id;
        const user = usersMap.get(userId);
        
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            total_earnings: 0,
            display_name: earning.profiles?.display_name || "Unknown",
            email: user?.email || "Unknown",
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
          };
        }
        acc[userId].total_earnings += Number(earning.amount);
        return acc;
      }, {});

      const userIds = Object.keys(earningsByUser || {});

      // Use secure RPC function to get tax documents (with audit logging)
      const taxDocsPromises = userIds.map(userId => 
        supabase.rpc('get_tax_document_secure', { target_user_id: userId })
      );
      
      const taxDocsResults = await Promise.all(taxDocsPromises);
      
      // Map tax documents by user_id
      const taxDocsMap = new Map();
      taxDocsResults.forEach(result => {
        if (!result.error && result.data) {
          result.data.forEach((doc: any) => {
            if (doc.tax_year === parseInt(selectedYear)) {
              taxDocsMap.set(doc.user_id, doc);
            }
          });
        }
      });

      // Combine earnings with tax document data
      return Object.values(earningsByUser || {}).map((user: any) => {
        const taxDoc = taxDocsMap.get(user.user_id);
        return {
          ...user,
          w9_submitted: !!taxDoc,
          w9_submitted_date: taxDoc?.w9_submitted_date,
          tax_id_type: taxDoc?.tax_id_type,
          tax_id_last_four: taxDoc?.tax_id_last_four,
        };
      });
    },
  });

  // Generate 1099 data CSV
  const generate1099Mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-1099-data", {
        body: { tax_year: selectedYear },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Create and download CSV
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1099-data-${selectedYear}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `1099 data for ${selectedYear} downloaded successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tax Compliance & 1099 Management</h3>
          <p className="text-sm text-muted-foreground">
            Track W-9 submissions and generate 1099 data for ambassadors earning $600+
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tax Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => generate1099Mutation.mutate()}
            disabled={generate1099Mutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Download 1099 Data
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ambassador Tax Status</CardTitle>
          <CardDescription>
            Ambassadors earning $600 or more require W-9 forms for tax reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>W-9 Status</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Submitted Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : ambassadors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No earnings data for {selectedYear}
                  </TableCell>
                </TableRow>
              ) : (
                ambassadors?.map((ambassador: any) => (
                  <TableRow key={ambassador.user_id}>
                    <TableCell className="font-medium">
                      {ambassador.display_name}
                    </TableCell>
                    <TableCell>{ambassador.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        ${ambassador.total_earnings.toFixed(2)}
                        {ambassador.total_earnings >= 600 && !ambassador.w9_submitted && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ambassador.w9_submitted ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : ambassador.total_earnings >= 600 ? (
                        <Badge variant="destructive">Required - Missing</Badge>
                      ) : (
                        <Badge variant="secondary">Not Required</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ambassador.tax_id_type && ambassador.tax_id_last_four ? (
                        <span className="text-sm">
                          {ambassador.tax_id_type === "ssn" ? "SSN" : "EIN"} ***-**-
                          {ambassador.tax_id_last_four}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ambassador.w9_submitted_date
                        ? format(new Date(ambassador.w9_submitted_date), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
