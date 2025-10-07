-- 1. USER ACTIVITY/ENGAGEMENT TRACKING
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'page_view', 'logout', 'feature_use'
  page_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX idx_user_activity_created ON public.user_activity_logs(created_at);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity_logs FOR SELECT
  USING (get_current_user_role() = 'admin');

-- 2. CONTENT VIEWS/INTERACTIONS
CREATE TABLE public.content_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'video', 'challenge', 'onboarding_step', 'podcast'
  content_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'complete', 'pause', 'skip'
  progress_percent INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_interactions_user_id ON public.content_interactions(user_id);
CREATE INDEX idx_content_interactions_type ON public.content_interactions(content_type);
CREATE INDEX idx_content_interactions_content_id ON public.content_interactions(content_id);

ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interactions"
  ON public.content_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON public.content_interactions FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_content_interactions_updated_at
  BEFORE UPDATE ON public.content_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. USER FEEDBACK/SUPPORT
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL, -- 'bug', 'feature_request', 'general', 'support'
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  admin_response TEXT,
  admin_responder_id UUID REFERENCES auth.users(id),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_type ON public.user_feedback(feedback_type);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
  ON public.user_feedback FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. COMMUNITY POSTS/COMMENTS
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'general', 'advice', 'success_story', 'question'
  media_urls JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_status ON public.community_posts(moderation_status);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved posts"
  ON public.community_posts FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id OR get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts"
  ON public.community_posts FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Community Comments
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_moderated BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON public.community_comments(user_id);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON public.community_comments FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id OR get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.community_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
  ON public.community_comments FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Post Likes
CREATE TABLE public.community_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own likes"
  ON public.community_post_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
  ON public.community_post_likes FOR SELECT
  USING (true);

-- 5. USER PREFERENCES/SETTINGS
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'daily', -- 'instant', 'daily', 'weekly', 'never'
  theme_preference TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  content_recommendations BOOLEAN DEFAULT true,
  community_visibility TEXT DEFAULT 'public', -- 'public', 'friends', 'private'
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
  ON public.user_preferences FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. SCHEDULED CONTENT
CREATE TABLE public.scheduled_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'challenge', 'onboarding_step', 'announcement'
  content_id UUID NOT NULL,
  unlock_condition TEXT NOT NULL, -- 'date', 'days_after_signup', 'badge_earned', 'challenge_completed'
  unlock_value TEXT NOT NULL, -- date string, number of days, badge_id, challenge_id
  target_user_group TEXT DEFAULT 'all', -- 'all', 'new_users', 'active_users', 'specific_package'
  package_id UUID REFERENCES public.packages(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_content_type ON public.scheduled_content(content_type);
CREATE INDEX idx_scheduled_content_active ON public.scheduled_content(is_active);

ALTER TABLE public.scheduled_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled content"
  ON public.scheduled_content FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE TRIGGER update_scheduled_content_updated_at
  BEFORE UPDATE ON public.scheduled_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. USER MILESTONES
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'streak', 'challenges_completed', 'badges_earned', 'community_posts'
  milestone_value INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  icon TEXT DEFAULT 'Trophy',
  points_awarded INTEGER DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_type ON public.user_milestones(milestone_type);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own milestones"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all milestones"
  ON public.user_milestones FOR ALL
  USING (get_current_user_role() = 'admin');

-- 8. FEATURE FLAGS
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0, -- 0-100
  target_user_groups JSONB DEFAULT '[]'::jsonb, -- ['admin', 'beta_testers', 'package_premium']
  package_restrictions JSONB DEFAULT '[]'::jsonb, -- array of package_ids
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Anyone can view enabled features"
  ON public.feature_flags FOR SELECT
  USING (is_enabled = true);

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();