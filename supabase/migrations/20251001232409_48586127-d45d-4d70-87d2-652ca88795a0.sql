-- Create table for default email template
CREATE TABLE IF NOT EXISTS public.default_email_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body_html TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.default_email_template ENABLE ROW LEVEL SECURITY;

-- Only admins can view the default template
CREATE POLICY "Admins can view default template"
  ON public.default_email_template
  FOR SELECT
  USING (get_current_user_role() = 'admin');

-- Only admins can insert the default template
CREATE POLICY "Admins can insert default template"
  ON public.default_email_template
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can update the default template
CREATE POLICY "Admins can update default template"
  ON public.default_email_template
  FOR UPDATE
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Trigger to update updated_at
CREATE TRIGGER update_default_email_template_updated_at
  BEFORE UPDATE ON public.default_email_template
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the default branded template
INSERT INTO public.default_email_template (body_html)
VALUES ('<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DadderUp - Dad Challenge Accepted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;
      background-color: #4b92d5;
      -webkit-font-smoothing: antialiased;
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
      content: '''';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #eb612c 0%, #f5a623 100%);
    }
    .logo { max-width: 180px; height: auto; }
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
    }
    .content h1 {
      color: #2c4667;
      font-size: 28px;
      margin: 0 0 24px 0;
      font-weight: 700;
    }
    .content p {
      margin: 0 0 20px 0;
      font-size: 17px;
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
    }
    .footer {
      background: linear-gradient(135deg, #2c4667 0%, #1e3a52 100%);
      color: #cbd5e0;
      padding: 40px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #5ca3e6;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 20px 10px; }
      .content { padding: 30px 24px; }
      .header { padding: 35px 24px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <img src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/dadderup-logo-white.png" alt="DadderUp Logo" class="logo" />
        <p class="tagline">Level Up Your Dad Game</p>
      </div>
      <div class="content">
        {{content}}
      </div>
      <div class="footer">
        <img src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/dadderup-logo-white.png" alt="DadderUp" style="max-width: 120px; opacity: 0.8;" />
        <p style="margin: 20px 0;">© 2025 DadderUp. All rights reserved.</p>
        <p><a href="https://dadderup.com">Website</a> · <a href="https://dadderup.com/settings">Preferences</a> · <a href="https://dadderup.com/unsubscribe">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>')
ON CONFLICT DO NOTHING;