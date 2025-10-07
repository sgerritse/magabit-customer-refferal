import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tax_year } = await req.json();

    if (!tax_year) {
      return new Response(
        JSON.stringify({ error: "Tax year required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Generate 1099] Generating data for tax year: ${tax_year}`);

    // Fetch all paid earnings for the tax year with user information
    const { data: earnings, error: earningsError } = await supabase
      .from("ambassador_earnings")
      .select(`
        user_id,
        amount,
        earned_at,
        profiles:user_id (
          display_name,
          w9_submitted,
          tax_id_type,
          tax_id_last_four
        ),
        users:user_id (
          email,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("status", "paid")
      .gte("earned_at", `${tax_year}-01-01`)
      .lte("earned_at", `${tax_year}-12-31`);

    if (earningsError) {
      console.error("[Generate 1099] Error fetching earnings:", earningsError);
      throw earningsError;
    }

    // Aggregate earnings by user
    const userEarnings = earnings.reduce((acc: any, earning: any) => {
      const userId = earning.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          total_earnings: 0,
          email: earning.users?.email || "",
          first_name: earning.users?.first_name || "",
          last_name: earning.users?.last_name || "",
          phone: earning.users?.phone || "",
          display_name: earning.profiles?.display_name || "",
          w9_submitted: earning.profiles?.w9_submitted || false,
          tax_id_type: earning.profiles?.tax_id_type || "",
          tax_id_last_four: earning.profiles?.tax_id_last_four || "",
        };
      }
      acc[userId].total_earnings += Number(earning.amount);
      return acc;
    }, {});

    // Filter users who earned $600 or more (1099 threshold)
    const eligible1099s = Object.values(userEarnings).filter(
      (user: any) => user.total_earnings >= 600
    );

    // Generate CSV
    const csvHeaders = [
      "Tax Year",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Display Name",
      "Total Earnings",
      "W-9 Submitted",
      "Tax ID Type",
      "Tax ID Last 4",
      "1099-NEC Required"
    ];

    const csvRows = eligible1099s.map((user: any) => [
      tax_year,
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.display_name,
      user.total_earnings.toFixed(2),
      user.w9_submitted ? "Yes" : "No",
      user.tax_id_type.toUpperCase(),
      user.tax_id_last_four,
      user.total_earnings >= 600 ? "Yes" : "No"
    ]);

    const csv = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    console.log(`[Generate 1099] Generated data for ${eligible1099s.length} ambassadors`);

    return new Response(
      JSON.stringify({
        success: true,
        tax_year,
        total_ambassadors: eligible1099s.length,
        total_amount: eligible1099s.reduce((sum: number, user: any) => sum + user.total_earnings, 0),
        csv
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Generate 1099] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
