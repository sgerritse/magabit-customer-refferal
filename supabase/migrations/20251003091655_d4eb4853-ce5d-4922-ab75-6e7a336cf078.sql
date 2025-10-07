-- Create Ambassador Welcome Email Sequence
INSERT INTO email_sequences (sequence_name, trigger_event, description, is_active)
VALUES ('Ambassador Welcome', 'first_challenge_completed', 'Welcome new brand ambassadors after first challenge', true)
ON CONFLICT DO NOTHING;

-- Get the sequence ID for inserting steps
DO $$
DECLARE
  v_sequence_id UUID;
  v_template_ids UUID[] := ARRAY[]::UUID[];
  v_template_id UUID;
BEGIN
  -- Get the sequence ID
  SELECT id INTO v_sequence_id FROM email_sequences WHERE sequence_name = 'Ambassador Welcome' LIMIT 1;
  
  IF v_sequence_id IS NOT NULL THEN
    -- Create Email Template 1: Welcome (Day 0 - Immediate)
    INSERT INTO email_templates (name, subject, body_html, is_active, variables)
    VALUES (
      'Ambassador Welcome - Day 0',
      'Welcome to the DadderUp Ambassador Program! 🎉',
      '<h1>Welcome, {{display_name}}!</h1>
      <p>Congratulations on completing your first challenge and joining the DadderUp Ambassador Program!</p>
      <p>As a Brand Ambassador, you can earn commissions by sharing DadderUp with other dads. Here''s what you need to know:</p>
      <ul>
        <li><strong>Current Tier:</strong> {{tier}} ({{commission_rate}}% commission)</li>
        <li><strong>Your Referral Link:</strong> <a href="{{referral_link}}">{{referral_link}}</a></li>
        <li><strong>Share & Earn:</strong> Every time someone signs up through your link, you earn!</li>
      </ul>
      <p>Check out your Brand Ambassador dashboard to track your earnings and get marketing materials.</p>
      <p>Let''s help more dads level up together!</p>
      <p>- The DadderUp Team</p>',
      true,
      '["display_name", "tier", "commission_rate", "referral_link"]'::jsonb
    )
    RETURNING id INTO v_template_id;
    v_template_ids := array_append(v_template_ids, v_template_id);
    
    -- Create Email Template 2: Tips (Day 1)
    INSERT INTO email_templates (name, subject, body_html, is_active, variables)
    VALUES (
      'Ambassador Welcome - Day 1',
      '5 Tips to Maximize Your Ambassador Earnings 💰',
      '<h1>Hey {{display_name}}!</h1>
      <p>Here are 5 proven tips to maximize your ambassador earnings:</p>
      <ol>
        <li><strong>Share Your Story:</strong> Personal testimonials convert 3x better</li>
        <li><strong>Use Multiple Channels:</strong> Share on social media, email, and in dad groups</li>
        <li><strong>Create a Landing Page:</strong> Build a custom page in your dashboard</li>
        <li><strong>Track Your Links:</strong> Use different links to see what works best</li>
        <li><strong>Engage Daily:</strong> The more active you are, the more you earn</li>
      </ol>
      <p>Pro tip: Ambassadors who share weekly earn 4x more on average!</p>
      <p><a href="{{dashboard_link}}">Go to Your Dashboard</a></p>',
      true,
      '["display_name", "dashboard_link"]'::jsonb
    )
    RETURNING id INTO v_template_id;
    v_template_ids := array_append(v_template_ids, v_template_id);
    
    -- Create Email Template 3: Landing Page (Day 3)
    INSERT INTO email_templates (name, subject, body_html, is_active, variables)
    VALUES (
      'Ambassador Welcome - Day 3',
      'Create Your Custom Landing Page 🎨',
      '<h1>{{display_name}}, Take Your Referrals to the Next Level</h1>
      <p>Did you know ambassadors with custom landing pages convert 5x more visitors?</p>
      <p>Your landing page lets you:</p>
      <ul>
        <li>Share your personal dad journey</li>
        <li>Highlight your favorite challenges</li>
        <li>Add a video message</li>
        <li>Show social proof with your stats</li>
      </ul>
      <p>Creating your landing page takes just 5 minutes!</p>
      <p><a href="{{landing_page_link}}">Create Your Landing Page</a></p>
      <p>Once approved, you''ll have a beautiful custom page to share everywhere.</p>',
      true,
      '["display_name", "landing_page_link"]'::jsonb
    )
    RETURNING id INTO v_template_id;
    v_template_ids := array_append(v_template_ids, v_template_id);
    
    -- Create Email Template 4: Marketing Assets (Day 5)
    INSERT INTO email_templates (name, subject, body_html, is_active, variables)
    VALUES (
      'Ambassador Welcome - Day 5',
      'Download Your Marketing Assets 📸',
      '<h1>Get Ready-to-Share Content, {{display_name}}</h1>
      <p>We''ve created professional marketing assets just for you:</p>
      <ul>
        <li>Social media graphics (Instagram, Facebook, Twitter)</li>
        <li>Email templates you can customize</li>
        <li>Logo files and brand guidelines</li>
        <li>Video clips you can share</li>
      </ul>
      <p>All designed to help you share DadderUp authentically and effectively.</p>
      <p><a href="{{creatives_link}}">Browse Marketing Assets</a></p>
      <p>Pick what resonates with you and start sharing!</p>',
      true,
      '["display_name", "creatives_link"]'::jsonb
    )
    RETURNING id INTO v_template_id;
    v_template_ids := array_append(v_template_ids, v_template_id);
    
    -- Create Email Template 5: Tier Up (Day 7)
    INSERT INTO email_templates (name, subject, body_html, is_active, variables)
    VALUES (
      'Ambassador Welcome - Day 7',
      'How to Reach Silver & Gold Tier 🥇',
      '<h1>Level Up Your Ambassador Tier, {{display_name}}</h1>
      <p>You''re currently at <strong>{{tier}} tier</strong> earning {{commission_rate}}% commissions.</p>
      <p>Here''s how to level up:</p>
      <ul>
        <li><strong>Silver Tier (35%):</strong> Get 10 conversions per month</li>
        <li><strong>Gold Tier (40%):</strong> Get 25+ conversions per month</li>
      </ul>
      <p>Your progress this month: <strong>{{monthly_conversions}} conversions</strong></p>
      <p>Tips to reach the next tier:</p>
      <ol>
        <li>Share your referral link daily</li>
        <li>Engage in dad communities and groups</li>
        <li>Use your custom landing page</li>
        <li>Follow up with interested dads</li>
      </ol>
      <p><a href="{{dashboard_link}}">Check Your Stats</a></p>
      <p>You''ve got this! 💪</p>',
      true,
      '["display_name", "tier", "commission_rate", "monthly_conversions", "dashboard_link"]'::jsonb
    )
    RETURNING id INTO v_template_id;
    v_template_ids := array_append(v_template_ids, v_template_id);
    
    -- Insert sequence steps
    INSERT INTO email_sequence_steps (sequence_id, step_order, template_id, delay_days, delay_hours, send_time)
    VALUES
      (v_sequence_id, 1, v_template_ids[1], 0, 0, '08:00:00'),  -- Day 0 - Immediate (sent at 8am next day)
      (v_sequence_id, 2, v_template_ids[2], 1, 0, '08:00:00'),  -- Day 1
      (v_sequence_id, 3, v_template_ids[3], 3, 0, '08:00:00'),  -- Day 3
      (v_sequence_id, 4, v_template_ids[4], 5, 0, '08:00:00'),  -- Day 5
      (v_sequence_id, 5, v_template_ids[5], 7, 0, '08:00:00');  -- Day 7
  END IF;
END $$;

-- Create trigger function to start ambassador welcome sequence
CREATE OR REPLACE FUNCTION start_ambassador_welcome_sequence()
RETURNS TRIGGER AS $$
DECLARE
  v_is_ambassador BOOLEAN;
  v_is_first_challenge BOOLEAN;
  v_sequence_id UUID;
  v_existing_progress UUID;
BEGIN
  -- Check if user has referral links (is an ambassador)
  SELECT EXISTS(
    SELECT 1 FROM referral_links WHERE user_id = NEW.user_id AND is_active = true
  ) INTO v_is_ambassador;
  
  -- Only proceed if they are an ambassador
  IF v_is_ambassador THEN
    -- Check if this is their first challenge completion
    SELECT COUNT(*) = 1 INTO v_is_first_challenge
    FROM answer_logs
    WHERE user_id = NEW.user_id;
    
    -- If first challenge, start the welcome sequence
    IF v_is_first_challenge THEN
      -- Get the Ambassador Welcome sequence ID
      SELECT id INTO v_sequence_id
      FROM email_sequences
      WHERE sequence_name = 'Ambassador Welcome'
        AND is_active = true
      LIMIT 1;
      
      IF v_sequence_id IS NOT NULL THEN
        -- Check if sequence already started (avoid duplicates)
        SELECT id INTO v_existing_progress
        FROM email_sequence_progress
        WHERE user_id = NEW.user_id
          AND sequence_id = v_sequence_id
        LIMIT 1;
        
        -- Only insert if not already started
        IF v_existing_progress IS NULL THEN
          INSERT INTO email_sequence_progress (
            user_id,
            sequence_id,
            current_step,
            next_send_at,
            completed
          ) VALUES (
            NEW.user_id,
            v_sequence_id,
            0,
            NOW() + INTERVAL '1 minute',  -- Send first email in 1 minute
            false
          );
          
          RAISE LOG 'Started Ambassador Welcome sequence for user %', NEW.user_id;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on answer_logs to start sequence
DROP TRIGGER IF EXISTS trigger_start_ambassador_welcome ON answer_logs;
CREATE TRIGGER trigger_start_ambassador_welcome
  AFTER INSERT ON answer_logs
  FOR EACH ROW
  EXECUTE FUNCTION start_ambassador_welcome_sequence();