import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface EmailTemplate {
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
}

const defaultTemplates: EmailTemplate[] = [
  {
    name: "Ambassador Welcome",
    subject: "Welcome to the DadderUp Ambassador Program! 🎉",
    body_html: `
      <h1>Welcome to the Ambassador Program!</h1>
      <p>Hi {{ambassador_name}},</p>
      <p>We're thrilled to have you join the DadderUp Ambassador Program!</p>
      <h2>Your Referral Links</h2>
      <ul>
        <li><strong>Main App:</strong> {{main_link}}</li>
        <li><strong>Shop:</strong> {{shop_link}}</li>
      </ul>
      <p>Best,<br>The DadderUp Team</p>
    `,
    variables: ["ambassador_name", "main_link", "shop_link", "commission_rate"]
  },
  {
    name: "First Commission Earned",
    subject: "🎊 You earned your first commission!",
    body_html: `
      <h1>Congratulations on Your First Commission!</h1>
      <p>Hi {{ambassador_name}},</p>
      <p>Great news! You've earned your first commission.</p>
      <p>Best,<br>The DadderUp Team</p>
    `,
    variables: ["ambassador_name", "commission_amt", "total_earn", "current_tier", "available_bal"]
  },
  {
    name: "Tier Upgrade",
    subject: "🥇 You've been upgraded!",
    body_html: `
      <h1>Tier Upgrade!</h1>
      <p>Hi {{ambassador_name}},</p>
      <p>Congratulations! You've been upgraded!</p>
      <p>Best,<br>The DadderUp Team</p>
    `,
    variables: ["ambassador_name", "new_tier", "old_tier", "new_rate", "old_rate", "conversions", "total_earn"]
  }
];

export const AmbassadorEmailTemplates = () => {
  const [isCreating, setIsCreating] = useState(false);

  const { data: templates = [], refetch } = useQuery({
    queryKey: ["ambassador-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createDefaultTemplates = async () => {
    setIsCreating(true);
    try {
      const templatesToInsert = defaultTemplates.map(t => ({
        name: t.name,
        subject: t.subject,
        body_html: t.body_html,
        variables: t.variables,
        is_active: true
      }));

      const { error } = await supabase
        .from("email_templates")
        .insert(templatesToInsert);

      if (error) throw error;

      toast.success("Default templates created!");
      refetch();
    } catch (error: any) {
      toast.error(`Failed to create templates: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Ambassador Email Templates</h3>
          <p className="text-sm text-muted-foreground">Pre-built templates for the ambassador program</p>
        </div>
        {templates.length === 0 && (
          <Button onClick={createDefaultTemplates} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? "Creating..." : "Create Default Templates"}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {defaultTemplates.map((template, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.subject}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <code key={variable} className="text-xs bg-muted px-2 py-1 rounded">
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                  {template.is_active ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
