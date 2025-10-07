import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../RichTextEditor.css";
import DOMPurify from "dompurify";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [defaultTemplateDialogOpen, setDefaultTemplateDialogOpen] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState({
    body_html: getDefaultEmailTemplate(),
  });
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body_html: "",
    variables: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
    loadDefaultTemplate();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables : []
      })) as EmailTemplate[];
      
      setTemplates(typedData);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body_html: template.body_html,
        variables: template.variables || [],
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        subject: "",
        body_html: "",
        variables: [],
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.body_html) {
        toast.error("Name, subject, and body are required");
        return;
      }

      const templateData = {
        name: formData.name,
        subject: formData.subject,
        body_html: formData.body_html,
        variables: formData.variables,
        is_active: formData.is_active,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success("Template created successfully");
      }

      setDialogOpen(false);
      loadTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
      loadTemplates();
    } catch (error) {
      console.error("Error toggling template:", error);
      toast.error("Failed to update template");
    }
  };

  const addVariable = (variable: string) => {
    if (variable && !formData.variables.includes(variable)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variable],
      });
    }
  };

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter(v => v !== variable),
    });
  };

  const insertVariableIntoBody = (variable: string) => {
    const variableTag = `{{${variable}}}`;
    setFormData({
      ...formData,
      body_html: formData.body_html + variableTag,
    });
  };

  const handlePreviewCurrent = () => {
    setPreviewTemplate({
      id: editingTemplate?.id || 'preview',
      name: formData.name || 'Preview',
      subject: formData.subject,
      body_html: formData.body_html,
      variables: formData.variables,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setPreviewOpen(true);
  };

  const saveDefaultTemplate = async () => {
    try {
      // Check if a default template exists
      const { data: existing } = await supabase
        .from('default_email_template')
        .select('id')
        .maybeSingle();

      if (existing) {
        // Update existing template
        const { error } = await supabase
          .from('default_email_template')
          .update({ body_html: defaultTemplate.body_html })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new template
        const { error } = await supabase
          .from('default_email_template')
          .insert({ body_html: defaultTemplate.body_html });

        if (error) throw error;
      }

      toast.success("Default template saved");
      setDefaultTemplateDialogOpen(false);
    } catch (error) {
      console.error("Error saving default template:", error);
      toast.error("Failed to save default template");
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('default_email_template')
        .select('body_html')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDefaultTemplate({ body_html: data.body_html });
      }
    } catch (error) {
      console.error("Error loading default template:", error);
      toast.error("Failed to load default template");
    }
  };

  const imageHandler = async (quillInstance: any) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `email-images/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('challenge-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('challenge-media')
          .getPublicUrl(filePath);

        const range = quillInstance.getEditorSelection();
        quillInstance.getEditor().insertEmbed(range.index, 'image', publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      }
    };
  };

  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function(this: any) {
          imageHandler(this.quill);
        }
      }
    }
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-foreground/70">
            Create reusable email templates with dynamic variables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDefaultTemplateDialogOpen(true)}>
            Edit Default Template
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Template" : "Create New Template"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Welcome Email"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">Subject Line</Label>
                <Input
                  id="template-subject"
                  placeholder="e.g., Welcome to DadderUp, {{user_name}}!"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.variables.map((variable) => (
                    <div
                      key={variable}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      <span>{`{{${variable}}}`}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => removeVariable(variable)}
                      >
                        ×
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0"
                        onClick={() => insertVariableIntoBody(variable)}
                        title="Insert into body"
                      >
                        ↓
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="new-variable"
                    placeholder="e.g., user_name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addVariable((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new-variable') as HTMLInputElement;
                      addVariable(input.value);
                      input.value = '';
                    }}
                  >
                    Add Variable
                  </Button>
                </div>
                <p className="text-xs text-foreground/60">
                  Common variables: user_name, badge_name, challenge_title, points_earned
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-body">Email Body (HTML)</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.body_html}
                  onChange={(value) => setFormData({ ...formData, body_html: value })}
                  placeholder="Email content with HTML formatting..."
                  className="bg-white rounded-md"
                  modules={quillModules}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="template-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="template-active">Active</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={handlePreviewCurrent}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? "Update" : "Create"} Template
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-foreground/60">
            No templates created yet. Create your first template to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{template.name}</h3>
                      {!template.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mb-2">
                      <strong>Subject:</strong> {template.subject}
                    </p>
                    {template.variables && template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {`{{${variable}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-foreground/50">
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(template)}
                    >
                      <Switch checked={template.is_active} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <p className="text-sm mt-1">{previewTemplate.subject}</p>
              </div>
              <div>
                <Label>Body</Label>
                <div
                  className="mt-2 p-4 border rounded bg-white"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(previewTemplate.body_html, {
                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'span', 'div', 'b', 'i', 'img'],
                      ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'src', 'alt', 'width', 'height'],
                      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                    })
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={defaultTemplateDialogOpen} onOpenChange={setDefaultTemplateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Default Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-foreground/70">
              This template is used as the base HTML structure for all emails. Use {'{{content}}'} where the email body should appear.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-template">HTML Template</Label>
                <textarea
                  id="default-template"
                  value={defaultTemplate.body_html}
                  onChange={(e) => setDefaultTemplate({ body_html: e.target.value })}
                  placeholder="Default email template with {{content}} placeholder..."
                  className="w-full h-[400px] p-3 border rounded-md font-mono text-sm"
                  style={{ resize: 'vertical' }}
                />
                <p className="text-xs text-foreground/60">
                  Use {'{{content}}'} where the email body should appear
                </p>
              </div>
              <div className="space-y-2">
                <Label>Live Preview</Label>
                <div className="border rounded-md overflow-hidden bg-gray-50">
                  <iframe
                    srcDoc={defaultTemplate.body_html.replace(
                      '{{content}}', 
                      `<h1>Welcome to DadderUp! 🎉</h1>
                      <p>Thanks for joining our community of awesome dads. We're excited to help you level up your dad game!</p>
                      <a href="#" class="button">Get Started</a>
                      <div class="stats-box">
                        <h4>Your Stats</h4>
                        <p><strong>Challenges Completed:</strong> 15</p>
                        <p><strong>Points Earned:</strong> 350</p>
                        <p><strong>Current Streak:</strong> 7 days</p>
                      </div>
                      <p>Keep up the great work, Dad! Every challenge you complete makes you an even better parent.</p>`
                    )}
                    style={{ width: '100%', height: '400px', border: 'none' }}
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setDefaultTemplate({ body_html: getDefaultEmailTemplate() });
                toast.success("Reset to default template");
              }}>
                Reset to Default
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDefaultTemplateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveDefaultTemplate}>
                  Save Default Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function getDefaultEmailTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DadderUp - Dad Challenge Accepted</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #4b92d5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-wrapper {
      width: 100%;
      background-color: #4b92d5;
      padding: 40px 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(44, 70, 103, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #2c4667 0%, #1e3a52 100%);
      padding: 50px 40px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #eb612c 0%, #f5a623 100%);
    }
    .logo-container {
      margin-bottom: 10px;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .tagline {
      color: #d1dce8;
      font-size: 16px;
      margin-top: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 50px 40px;
      color: #2c4667;
      line-height: 1.8;
      background-color: #ffffff;
    }
    .content h1 {
      color: #2c4667;
      font-size: 28px;
      margin: 0 0 24px 0;
      font-weight: 700;
      line-height: 1.3;
    }
    .content h2 {
      color: #2c4667;
      font-size: 22px;
      margin: 32px 0 16px 0;
      font-weight: 600;
    }
    .content p {
      margin: 0 0 20px 0;
      font-size: 17px;
      color: #4a5a6f;
      line-height: 1.7;
    }
    .content ul {
      margin: 20px 0;
      padding-left: 20px;
    }
    .content li {
      margin: 10px 0;
      font-size: 16px;
      color: #4a5a6f;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      margin: 28px 0;
      background: linear-gradient(135deg, #eb612c 0%, #f07a52 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 17px;
      box-shadow: 0 6px 20px rgba(235, 97, 44, 0.35);
      transition: all 0.3s ease;
      text-align: center;
    }
    .button:hover {
      box-shadow: 0 8px 25px rgba(235, 97, 44, 0.45);
      transform: translateY(-2px);
    }
    .badge-highlight {
      background: linear-gradient(135deg, #4b92d5 0%, #5ca3e6 100%);
      color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      margin: 32px 0;
      text-align: center;
      box-shadow: 0 8px 24px rgba(75, 146, 213, 0.25);
    }
    .badge-highlight h3 {
      margin: 0 0 12px 0;
      font-size: 24px;
      font-weight: 700;
    }
    .badge-highlight p {
      margin: 0;
      font-size: 16px;
      color: #ffffff;
      opacity: 0.95;
    }
    .stats-box {
      background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
      border-left: 5px solid #4b92d5;
      padding: 24px 28px;
      margin: 28px 0;
      border-radius: 8px;
    }
    .stats-box h4 {
      color: #2c4667;
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
    }
    .stats-box p {
      margin: 8px 0;
      color: #4a5a6f;
      font-size: 16px;
    }
    .tip-box {
      background-color: #fff8f0;
      border-left: 5px solid #eb612c;
      padding: 24px 28px;
      margin: 28px 0;
      border-radius: 8px;
    }
    .tip-box strong {
      color: #eb612c;
      font-size: 16px;
      display: block;
      margin-bottom: 8px;
    }
    .divider {
      height: 2px;
      background: linear-gradient(to right, transparent, #d1dce8, transparent);
      margin: 32px 0;
      border: none;
    }
    .footer {
      background: linear-gradient(135deg, #2c4667 0%, #1e3a52 100%);
      color: #cbd5e0;
      padding: 40px;
      text-align: center;
      font-size: 14px;
    }
    .footer-logo {
      margin-bottom: 20px;
    }
    .footer p {
      margin: 12px 0;
      line-height: 1.6;
    }
    .footer a {
      color: #5ca3e6;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }
    .footer a:hover {
      color: #ffffff;
    }
    .social-links {
      margin: 24px 0 16px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #cbd5e0;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 6px;
      background-color: rgba(255, 255, 255, 0.1);
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .content {
        padding: 30px 24px;
      }
      .header {
        padding: 35px 24px;
      }
      .content h1 {
        font-size: 24px;
      }
      .footer {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header with Logo -->
      <div class="header">
        <div class="logo-container">
          <img src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/dadderup-logo-white.png" alt="DadderUp Logo" class="logo" />
        </div>
        <p class="tagline">Level Up Your Dad Game</p>
      </div>

      <!-- Main Content Area -->
      <div class="content">
        {{content}}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-logo">
          <img src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/dadderup-logo-white.png" alt="DadderUp" style="max-width: 120px; height: auto; opacity: 0.8;" />
        </div>
        
        <p style="margin: 20px 0 8px 0; font-weight: 600; color: #ffffff;">Stay Connected</p>
        <div class="social-links">
          <a href="https://dadderup.com/community">Community</a>
          <a href="https://dadderup.com/podcasts">Podcasts</a>
          <a href="https://dadderup.com/progress">Your Progress</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
        
        <p style="margin: 16px 0 4px 0;">© 2025 DadderUp. All rights reserved.</p>
        <p style="font-size: 13px; color: #a0aec0;">
          <a href="https://dadderup.com">Visit Website</a> · 
          <a href="https://dadderup.com/settings">Email Preferences</a> · 
          <a href="https://dadderup.com/unsubscribe">Unsubscribe</a>
        </p>
        <p style="font-size: 12px; color: #7d8fa9; margin-top: 16px;">
          You're receiving this email because you're part of the DadderUp community.<br>
          Need help? Reply to this email or visit our support center.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}
