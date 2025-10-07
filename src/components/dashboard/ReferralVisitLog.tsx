import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Filter } from "lucide-react";
import { useReferralVisits, type ReferralVisitWithLink } from "@/hooks/useReferralVisits";
import { format } from "date-fns";

export const ReferralVisitLog = () => {
  const [dateRange, setDateRange] = useState(30);
  const [linkType, setLinkType] = useState("all");
  const [converted, setConverted] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useReferralVisits({
    dateRange,
    linkType,
    converted,
    page,
    pageSize: 20,
  });

  // Format hashed IP for display (show first 8 chars)
  const formatHashedIp = (hash: string | null) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...`;
  };

  // Format location from country and state codes
  const formatLocation = (countryCode: string | null, stateCode: string | null) => {
    if (!countryCode) return "Unknown";
    if (stateCode) return `${countryCode}-${stateCode}`;
    return countryCode;
  };

  const exportToCsv = () => {
    if (!data?.visits.length) return;

    const headers = ["Date", "Link Type", "IP Hash", "Device Info", "Location", "Converted"];
    const rows = data.visits.map((visit: ReferralVisitWithLink) => {
      return [
        format(new Date(visit.visited_at), "PPpp"),
        visit.link_type,
        formatHashedIp(visit.ip_address_hash),
        visit.user_agent_truncated || "Unknown",
        formatLocation(visit.country_code, visit.state_code),
        visit.converted ? "Yes" : "No",
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referral-visits-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const totalPages = Math.ceil((data?.totalCount || 0) / 20);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Referral Visit Log
            </CardTitle>
            <CardDescription>Detailed tracking of all referral visits</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!data?.visits.length}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={dateRange.toString()} onValueChange={(v) => { setDateRange(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={linkType} onValueChange={(v) => { setLinkType(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All links</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={converted === null ? "all" : converted ? "yes" : "no"} 
            onValueChange={(v) => { 
              setConverted(v === "all" ? null : v === "yes"); 
              setPage(1); 
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visits</SelectItem>
              <SelectItem value="yes">Converted</SelectItem>
              <SelectItem value="no">Not converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        ) : data?.visits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No visits found for the selected filters</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Link Type</TableHead>
                  <TableHead>IP Hash</TableHead>
                  <TableHead>Device Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.visits.map((visit: ReferralVisitWithLink) => {
                    return (
                      <TableRow key={visit.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(visit.visited_at), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {visit.link_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatHashedIp(visit.ip_address_hash)}
                        </TableCell>
                        <TableCell>{visit.user_agent_truncated || "Unknown"}</TableCell>
                        <TableCell>{formatLocation(visit.country_code, visit.state_code)}</TableCell>
                        <TableCell>
                          {visit.converted ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Converted
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data?.totalCount || 0)} of {data?.totalCount} visits
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
