export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_access_locations: {
        Row: {
          access_count: number | null
          admin_user_id: string
          city: string | null
          country: string | null
          created_at: string | null
          first_seen_at: string | null
          flagged_reason: string | null
          id: string
          ip_address: unknown | null
          is_flagged: boolean | null
          last_seen_at: string | null
        }
        Insert: {
          access_count?: number | null
          admin_user_id: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          flagged_reason?: string | null
          id?: string
          ip_address?: unknown | null
          is_flagged?: boolean | null
          last_seen_at?: string | null
        }
        Update: {
          access_count?: number | null
          admin_user_id?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          flagged_reason?: string | null
          id?: string
          ip_address?: unknown | null
          is_flagged?: boolean | null
          last_seen_at?: string | null
        }
        Relationships: []
      }
      affiliate_settings: {
        Row: {
          auto_payout_day: number | null
          auto_payout_enabled: boolean | null
          auto_payout_schedule: string | null
          auto_payout_time: string | null
          bronze_rate: number | null
          bronze_threshold: number | null
          campaign_boost_amount: number | null
          campaign_boost_enabled: boolean | null
          campaign_boost_end_date: string | null
          campaign_boost_start_date: string | null
          campaign_boost_target: string | null
          cookie_attribution_days: number | null
          created_at: string | null
          default_commission_rate: number | null
          default_commission_type: string | null
          gold_rate: number | null
          gold_threshold: number | null
          id: string
          max_emails_per_day: number | null
          max_emails_per_hour: number | null
          max_referrals_per_day: number | null
          max_referrals_per_hour: number | null
          max_signups_per_ip_per_day: number | null
          max_sms_per_day: number | null
          max_sms_per_hour: number | null
          minimum_payout_amount: number | null
          notification_frequency: string | null
          silver_rate: number | null
          silver_threshold: number | null
          spam_keywords: Json | null
          tiered_commissions_enabled: boolean | null
          updated_at: string | null
          velocity_limits_enabled: boolean | null
        }
        Insert: {
          auto_payout_day?: number | null
          auto_payout_enabled?: boolean | null
          auto_payout_schedule?: string | null
          auto_payout_time?: string | null
          bronze_rate?: number | null
          bronze_threshold?: number | null
          campaign_boost_amount?: number | null
          campaign_boost_enabled?: boolean | null
          campaign_boost_end_date?: string | null
          campaign_boost_start_date?: string | null
          campaign_boost_target?: string | null
          cookie_attribution_days?: number | null
          created_at?: string | null
          default_commission_rate?: number | null
          default_commission_type?: string | null
          gold_rate?: number | null
          gold_threshold?: number | null
          id?: string
          max_emails_per_day?: number | null
          max_emails_per_hour?: number | null
          max_referrals_per_day?: number | null
          max_referrals_per_hour?: number | null
          max_signups_per_ip_per_day?: number | null
          max_sms_per_day?: number | null
          max_sms_per_hour?: number | null
          minimum_payout_amount?: number | null
          notification_frequency?: string | null
          silver_rate?: number | null
          silver_threshold?: number | null
          spam_keywords?: Json | null
          tiered_commissions_enabled?: boolean | null
          updated_at?: string | null
          velocity_limits_enabled?: boolean | null
        }
        Update: {
          auto_payout_day?: number | null
          auto_payout_enabled?: boolean | null
          auto_payout_schedule?: string | null
          auto_payout_time?: string | null
          bronze_rate?: number | null
          bronze_threshold?: number | null
          campaign_boost_amount?: number | null
          campaign_boost_enabled?: boolean | null
          campaign_boost_end_date?: string | null
          campaign_boost_start_date?: string | null
          campaign_boost_target?: string | null
          cookie_attribution_days?: number | null
          created_at?: string | null
          default_commission_rate?: number | null
          default_commission_type?: string | null
          gold_rate?: number | null
          gold_threshold?: number | null
          id?: string
          max_emails_per_day?: number | null
          max_emails_per_hour?: number | null
          max_referrals_per_day?: number | null
          max_referrals_per_hour?: number | null
          max_signups_per_ip_per_day?: number | null
          max_sms_per_day?: number | null
          max_sms_per_hour?: number | null
          minimum_payout_amount?: number | null
          notification_frequency?: string | null
          silver_rate?: number | null
          silver_threshold?: number | null
          spam_keywords?: Json | null
          tiered_commissions_enabled?: boolean | null
          updated_at?: string | null
          velocity_limits_enabled?: boolean | null
        }
        Relationships: []
      }
      ambassador_earnings: {
        Row: {
          amount: number
          approved_at: string | null
          billing_cycle_number: number | null
          campaign_boost_amount: number | null
          campaign_boost_applied: boolean | null
          commission_rate: number
          commission_type: string
          created_at: string | null
          earned_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payout_id: string | null
          product_id: string | null
          referral_visit_id: string | null
          status: string
          subscription_id: string | null
          tax_year: number | null
          tier_at_earning: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          billing_cycle_number?: number | null
          campaign_boost_amount?: number | null
          campaign_boost_applied?: boolean | null
          commission_rate: number
          commission_type: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          product_id?: string | null
          referral_visit_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_year?: number | null
          tier_at_earning?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          billing_cycle_number?: number | null
          campaign_boost_amount?: number | null
          campaign_boost_applied?: boolean | null
          commission_rate?: number
          commission_type?: string
          created_at?: string | null
          earned_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payout_id?: string | null
          product_id?: string | null
          referral_visit_id?: string | null
          status?: string
          subscription_id?: string | null
          tax_year?: number | null
          tier_at_earning?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_earnings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambassador_earnings_referral_visit_id_fkey"
            columns: ["referral_visit_id"]
            isOneToOne: false
            referencedRelation: "referral_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_landing_pages: {
        Row: {
          created_at: string | null
          custom_content: string | null
          enabled: boolean | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string | null
          custom_content?: string | null
          enabled?: boolean | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string | null
          custom_content?: string | null
          enabled?: boolean | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      ambassador_payout_methods: {
        Row: {
          bank_details_encrypted: string | null
          change_count: number | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          last_changed_at: string | null
          payout_method: string | null
          paypal_email_encrypted: string | null
          stripe_account_id: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          bank_details_encrypted?: string | null
          change_count?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_changed_at?: string | null
          payout_method?: string | null
          paypal_email_encrypted?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          bank_details_encrypted?: string | null
          change_count?: number | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_changed_at?: string | null
          payout_method?: string | null
          paypal_email_encrypted?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      ambassador_payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ambassador_tiers: {
        Row: {
          created_at: string | null
          current_tier: string | null
          id: string
          monthly_conversions: number | null
          tier_calculated_at: string | null
          tier_reset_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          monthly_conversions?: number | null
          tier_calculated_at?: string | null
          tier_reset_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_tier?: string | null
          id?: string
          monthly_conversions?: number | null
          tier_calculated_at?: string | null
          tier_reset_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      answer_logs: {
        Row: {
          challenge_id: number
          challenge_title: string
          child_reactions: Json | null
          created_at: string
          id: string
          media_files: Json | null
          points_earned: number
          privacy: string
          rating: number
          reaction: string | null
          response: string
          submission_type: string
          time_spent: number
          updated_at: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          challenge_id: number
          challenge_title: string
          child_reactions?: Json | null
          created_at?: string
          id?: string
          media_files?: Json | null
          points_earned?: number
          privacy?: string
          rating?: number
          reaction?: string | null
          response: string
          submission_type: string
          time_spent?: number
          updated_at?: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          challenge_id?: number
          challenge_title?: string
          child_reactions?: Json | null
          created_at?: string
          id?: string
          media_files?: Json | null
          points_earned?: number
          privacy?: string
          rating?: number
          reaction?: string | null
          response?: string
          submission_type?: string
          time_spent?: number
          updated_at?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          badge_id: string
          challenge_ids: Json | null
          created_at: string
          description: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          points: number
          required_count: number | null
          type: string
          updated_at: string
        }
        Insert: {
          badge_id: string
          challenge_ids?: Json | null
          created_at?: string
          description: string
          display_order?: number
          icon: string
          id?: string
          is_active?: boolean
          name: string
          points?: number
          required_count?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          badge_id?: string
          challenge_ids?: Json | null
          created_at?: string
          description?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          required_count?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_address_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_fields: string[] | null
          accessed_user_id: string
          admin_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_fields?: string[] | null
          accessed_user_id: string
          admin_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_fields?: string[] | null
          accessed_user_id?: string
          admin_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      billing_addresses: {
        Row: {
          address_line1_encrypted: string | null
          address_line2_encrypted: string | null
          city_encrypted: string | null
          country: string | null
          created_at: string
          id: string
          postal_code_encrypted: string | null
          state_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1_encrypted?: string | null
          address_line2_encrypted?: string | null
          city_encrypted?: string | null
          country?: string | null
          created_at?: string
          id?: string
          postal_code_encrypted?: string | null
          state_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1_encrypted?: string | null
          address_line2_encrypted?: string | null
          city_encrypted?: string | null
          country?: string | null
          created_at?: string
          id?: string
          postal_code_encrypted?: string | null
          state_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_boost_ambassadors: {
        Row: {
          boost_amount: number | null
          campaign_end_date: string | null
          campaign_start_date: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          boost_amount?: number | null
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          boost_amount?: number | null
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          audio_points: number | null
          badges: Json | null
          category: string
          challenge_id: string
          created_at: string
          description: string
          difficulty: string
          display_order: number
          duration: number
          icon: string
          id: string
          image_points: number | null
          is_active: boolean
          parent_reactions: Json | null
          points: number
          points_bonus: number | null
          points_earned: number | null
          reactions: Json | null
          shop_button_enabled: boolean | null
          shop_points: number | null
          shop_product_id: string | null
          shop_type: string | null
          shop_url: string | null
          submission_types: Json | null
          tip: string | null
          title: string
          type: string
          updated_at: string
          video_points: number | null
          video_url: string | null
          woocommerce_product_id: string | null
        }
        Insert: {
          audio_points?: number | null
          badges?: Json | null
          category: string
          challenge_id: string
          created_at?: string
          description: string
          difficulty?: string
          display_order?: number
          duration?: number
          icon?: string
          id?: string
          image_points?: number | null
          is_active?: boolean
          parent_reactions?: Json | null
          points?: number
          points_bonus?: number | null
          points_earned?: number | null
          reactions?: Json | null
          shop_button_enabled?: boolean | null
          shop_points?: number | null
          shop_product_id?: string | null
          shop_type?: string | null
          shop_url?: string | null
          submission_types?: Json | null
          tip?: string | null
          title: string
          type: string
          updated_at?: string
          video_points?: number | null
          video_url?: string | null
          woocommerce_product_id?: string | null
        }
        Update: {
          audio_points?: number | null
          badges?: Json | null
          category?: string
          challenge_id?: string
          created_at?: string
          description?: string
          difficulty?: string
          display_order?: number
          duration?: number
          icon?: string
          id?: string
          image_points?: number | null
          is_active?: boolean
          parent_reactions?: Json | null
          points?: number
          points_bonus?: number | null
          points_earned?: number | null
          reactions?: Json | null
          shop_button_enabled?: boolean | null
          shop_points?: number | null
          shop_product_id?: string | null
          shop_type?: string | null
          shop_url?: string | null
          submission_types?: Json | null
          tip?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_points?: number | null
          video_url?: string | null
          woocommerce_product_id?: string | null
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_moderated: boolean | null
          likes_count: number | null
          moderation_status: string | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          likes_count?: number | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          likes_count?: number | null
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          is_moderated: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          media_urls: Json | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          is_moderated?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_interactions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          progress_percent: number | null
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          progress_percent?: number | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          progress_percent?: number | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      default_email_template: {
        Row: {
          body_html: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          browser: string | null
          created_at: string | null
          fingerprint_hash: string
          flagged_reason: string | null
          geolocation: Json | null
          id: string
          ip_address: unknown | null
          is_suspicious: boolean | null
          os: string | null
          screen_resolution: string | null
          session_id: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          fingerprint_hash: string
          flagged_reason?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          os?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          fingerprint_hash?: string
          flagged_reason?: string | null
          geolocation?: Json | null
          id?: string
          ip_address?: unknown | null
          is_suspicious?: boolean | null
          os?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_fingerprints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notification_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          from_email: string | null
          from_name: string | null
          id: string
          recipient_email: string | null
          security_reports_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          recipient_email?: string | null
          security_reports_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          recipient_email?: string | null
          security_reports_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          created_at: string | null
          daily_count: number | null
          daily_reset_at: string | null
          hourly_count: number | null
          hourly_reset_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_sequence_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_step: number | null
          id: string
          next_send_at: string | null
          sequence_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          next_send_at?: string | null
          sequence_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          next_send_at?: string | null
          sequence_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_progress_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          created_at: string | null
          delay_days: number | null
          delay_hours: number | null
          id: string
          send_time: string | null
          sequence_id: string
          step_order: number
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          send_time?: string | null
          sequence_id: string
          step_order: number
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delay_days?: number | null
          delay_hours?: number | null
          id?: string
          send_time?: string | null
          sequence_id?: string
          step_order?: number
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          sequence_name: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sequence_name: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sequence_name?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      encryption_key_rotations: {
        Row: {
          created_at: string
          id: string
          new_key_identifier: string
          notes: string | null
          old_key_identifier: string | null
          records_re_encrypted: number | null
          rotated_by: string | null
          rotation_date: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_key_identifier?: string
          notes?: string | null
          old_key_identifier?: string | null
          records_re_encrypted?: number | null
          rotated_by?: string | null
          rotation_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          new_key_identifier?: string
          notes?: string | null
          old_key_identifier?: string | null
          records_re_encrypted?: number | null
          rotated_by?: string | null
          rotation_date?: string
          status?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          package_restrictions: Json | null
          rollout_percentage: number | null
          target_user_groups: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          package_restrictions?: Json | null
          rollout_percentage?: number | null
          target_user_groups?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          package_restrictions?: Json | null
          rollout_percentage?: number | null
          target_user_groups?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          channel: string
          created_at: string | null
          data: Json
          id: string
          notification_type: string
          processed: boolean | null
          processed_at: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          data: Json
          id?: string
          notification_type: string
          processed?: boolean | null
          processed_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          data?: Json
          id?: string
          notification_type?: string
          processed?: boolean | null
          processed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_triggers: {
        Row: {
          conditions: Json | null
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          template_id: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          template_id?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template_id?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          created_at: string
          cta_buttons: Json | null
          description: string
          enable_page_url: boolean
          enable_video_url: boolean
          icon: string
          id: string
          is_active: boolean
          page_url: string | null
          page_url_type: string | null
          step_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          cta_buttons?: Json | null
          description: string
          enable_page_url?: boolean
          enable_video_url?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          page_url?: string | null
          page_url_type?: string | null
          step_order: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          cta_buttons?: Json | null
          description?: string
          enable_page_url?: boolean
          enable_video_url?: boolean
          icon?: string
          id?: string
          is_active?: boolean
          page_url?: string | null
          page_url_type?: string | null
          step_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          billing_period: string
          commission_enabled: boolean | null
          commission_rate: number | null
          commission_type: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          regular_price: number | null
          show_on_plans_page: boolean
          stripe_price_id: string | null
          trial_days: number | null
          trial_price: number | null
          updated_at: string | null
          woocommerce_product_id: string | null
        }
        Insert: {
          billing_period: string
          commission_enabled?: boolean | null
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          regular_price?: number | null
          show_on_plans_page?: boolean
          stripe_price_id?: string | null
          trial_days?: number | null
          trial_price?: number | null
          updated_at?: string | null
          woocommerce_product_id?: string | null
        }
        Update: {
          billing_period?: string
          commission_enabled?: boolean | null
          commission_rate?: number | null
          commission_type?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          regular_price?: number | null
          show_on_plans_page?: boolean
          stripe_price_id?: string | null
          trial_days?: number | null
          trial_price?: number | null
          updated_at?: string | null
          woocommerce_product_id?: string | null
        }
        Relationships: []
      }
      parent_reactions: {
        Row: {
          created_at: string
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          label: string
          reaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          emoji: string
          id?: string
          is_active?: boolean
          label: string
          reaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          label?: string
          reaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pause_reminder_tips: {
        Row: {
          created_at: string
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          tip_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          emoji?: string
          id?: string
          is_active?: boolean
          tip_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          tip_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_access_audit: {
        Row: {
          access_type: string
          accessed_columns: string[] | null
          accessed_table: string
          accessed_user_id: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_columns?: string[] | null
          accessed_table: string
          accessed_user_id: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_columns?: string[] | null
          accessed_table?: string
          accessed_user_id?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      payout_method_changes: {
        Row: {
          created_at: string | null
          flagged_as_suspicious: boolean | null
          id: string
          ip_address: unknown | null
          new_details: Json | null
          new_method: string
          old_details: Json | null
          old_method: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          flagged_as_suspicious?: boolean | null
          id?: string
          ip_address?: unknown | null
          new_details?: Json | null
          new_method: string
          old_details?: Json | null
          old_method?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          flagged_as_suspicious?: boolean | null
          id?: string
          ip_address?: unknown | null
          new_details?: Json | null
          new_method?: string
          old_details?: Json | null
          old_method?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_display_configs: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_features: Json | null
          custom_title: string | null
          display_order: number
          id: string
          is_active: boolean
          last_synced_at: string | null
          original_data: Json | null
          product_id: string
          product_source: string
          show_on_plans_page: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_features?: Json | null
          custom_title?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          original_data?: Json | null
          product_id: string
          product_source: string
          show_on_plans_page?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_features?: Json | null
          custom_title?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          original_data?: Json | null
          product_id?: string
          product_source?: string
          show_on_plans_page?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      plans_page_settings: {
        Row: {
          created_at: string | null
          cta_button_text: string | null
          delay_seconds: number | null
          enable_cta_button: boolean | null
          enable_delay: boolean | null
          id: string
          show_video: boolean | null
          updated_at: string | null
          video_description: string | null
          video_heading: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          cta_button_text?: string | null
          delay_seconds?: number | null
          enable_cta_button?: boolean | null
          enable_delay?: boolean | null
          id?: string
          show_video?: boolean | null
          updated_at?: string | null
          video_description?: string | null
          video_heading?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          cta_button_text?: string | null
          delay_seconds?: number | null
          enable_cta_button?: boolean | null
          enable_delay?: boolean | null
          id?: string
          show_video?: boolean | null
          updated_at?: string | null
          video_description?: string | null
          video_heading?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      profile_query_rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          query_count: number | null
          updated_at: string | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          query_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          query_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      push_notification_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          firebase_api_key: string | null
          firebase_app_id: string | null
          firebase_auth_domain: string | null
          firebase_project_id: string | null
          firebase_sender_id: string | null
          firebase_vapid_key: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          firebase_api_key?: string | null
          firebase_app_id?: string | null
          firebase_auth_domain?: string | null
          firebase_project_id?: string | null
          firebase_sender_id?: string | null
          firebase_vapid_key?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          firebase_api_key?: string | null
          firebase_app_id?: string | null
          firebase_auth_domain?: string | null
          firebase_project_id?: string | null
          firebase_sender_id?: string | null
          firebase_vapid_key?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_templates: {
        Row: {
          action_url: string | null
          body: string
          created_at: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          title: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          title: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          title?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      query_rate_limits: {
        Row: {
          created_at: string | null
          daily_count: number | null
          daily_reset_at: string | null
          hourly_count: number | null
          hourly_reset_at: string | null
          id: string
          query_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          query_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          query_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          challenge_ids: Json | null
          created_at: string
          display_order: number
          emoji: string
          id: string
          is_active: boolean
          label: string
          reaction_id: string
          updated_at: string
        }
        Insert: {
          challenge_ids?: Json | null
          created_at?: string
          display_order?: number
          emoji: string
          id?: string
          is_active?: boolean
          label: string
          reaction_id: string
          updated_at?: string
        }
        Update: {
          challenge_ids?: Json | null
          created_at?: string
          display_order?: number
          emoji?: string
          id?: string
          is_active?: boolean
          label?: string
          reaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_links: {
        Row: {
          clicks_count: number | null
          conversions_count: number | null
          created_at: string | null
          full_url: string
          id: string
          is_active: boolean | null
          last_click_at: string | null
          link_type: string
          notifications_enabled: Json | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string | null
          full_url: string
          id?: string
          is_active?: boolean | null
          last_click_at?: string | null
          link_type: string
          notifications_enabled?: Json | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          clicks_count?: number | null
          conversions_count?: number | null
          created_at?: string | null
          full_url?: string
          id?: string
          is_active?: boolean | null
          last_click_at?: string | null
          link_type?: string
          notifications_enabled?: Json | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      referral_visits: {
        Row: {
          billing_cycle_number: number | null
          conversion_date: string | null
          conversion_value: number | null
          converted: boolean | null
          converted_user_id: string | null
          country_code: string | null
          created_at: string | null
          days_active: number | null
          id: string
          ip_address_hash: string | null
          landing_page: string | null
          referral_link_id: string | null
          referrer_user_id: string | null
          state_code: string | null
          subscription_id: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          user_agent_truncated: string | null
          visited_at: string | null
          visited_page: string
          visitor_id: string
        }
        Insert: {
          billing_cycle_number?: number | null
          conversion_date?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          converted_user_id?: string | null
          country_code?: string | null
          created_at?: string | null
          days_active?: number | null
          id?: string
          ip_address_hash?: string | null
          landing_page?: string | null
          referral_link_id?: string | null
          referrer_user_id?: string | null
          state_code?: string | null
          subscription_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          user_agent_truncated?: string | null
          visited_at?: string | null
          visited_page: string
          visitor_id: string
        }
        Update: {
          billing_cycle_number?: number | null
          conversion_date?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          converted_user_id?: string | null
          country_code?: string | null
          created_at?: string | null
          days_active?: number | null
          id?: string
          ip_address_hash?: string | null
          landing_page?: string | null
          referral_link_id?: string | null
          referrer_user_id?: string | null
          state_code?: string | null
          subscription_id?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          user_agent_truncated?: string | null
          visited_at?: string | null
          visited_page?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_visits_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      role_check_audit: {
        Row: {
          checked_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          function_name: string | null
          id: string
          result: boolean
          user_id: string
        }
        Insert: {
          checked_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          function_name?: string | null
          id?: string
          result: boolean
          user_id: string
        }
        Update: {
          checked_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          function_name?: string | null
          id?: string
          result?: boolean
          user_id?: string
        }
        Relationships: []
      }
      scheduled_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          is_active: boolean | null
          package_id: string | null
          target_user_group: string | null
          unlock_condition: string
          unlock_value: string
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          package_id?: string | null
          target_user_group?: string | null
          unlock_condition: string
          unlock_value: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          package_id?: string | null
          target_user_group?: string | null
          unlock_condition?: string
          unlock_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_content_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          target_user_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_monitor_logs: {
        Row: {
          anomalous_access_count: number | null
          check_date: string
          created_at: string | null
          details: Json | null
          fraud_alerts_count: number | null
          health_status: string
          id: string
          unencrypted_pii_count: number | null
        }
        Insert: {
          anomalous_access_count?: number | null
          check_date?: string
          created_at?: string | null
          details?: Json | null
          fraud_alerts_count?: number | null
          health_status: string
          id?: string
          unencrypted_pii_count?: number | null
        }
        Update: {
          anomalous_access_count?: number | null
          check_date?: string
          created_at?: string | null
          details?: Json | null
          fraud_alerts_count?: number | null
          health_status?: string
          id?: string
          unencrypted_pii_count?: number | null
        }
        Relationships: []
      }
      sms_notification_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sms_rate_limits: {
        Row: {
          created_at: string | null
          daily_count: number | null
          daily_reset_at: string | null
          hourly_count: number | null
          hourly_reset_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_count?: number | null
          daily_reset_at?: string | null
          hourly_count?: number | null
          hourly_reset_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          name: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          name: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          name?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string
          id: string
          stripe_customer_id_encrypted: string | null
          stripe_payment_method_id_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          stripe_customer_id_encrypted?: string | null
          stripe_payment_method_id_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string
          id?: string
          stripe_customer_id_encrypted?: string | null
          stripe_payment_method_id_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_settings: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          test_mode: boolean | null
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          test_mode?: boolean | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          test_mode?: boolean | null
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      tax_document_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_user_id: string
          admin_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_user_id: string
          admin_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_user_id?: string
          admin_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      tax_documents: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          tax_id_encrypted: string | null
          tax_id_last_four: string
          tax_id_type: string
          tax_year: number
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          w9_file_path: string
          w9_submitted_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          tax_id_encrypted?: string | null
          tax_id_last_four: string
          tax_id_type: string
          tax_year?: number
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          w9_file_path: string
          w9_submitted_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          tax_id_encrypted?: string | null
          tax_id_last_four?: string
          tax_id_type?: string
          tax_year?: number
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          w9_file_path?: string
          w9_submitted_date?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          created_at: string | null
          dark_theme: Json
          id: string
          light_theme: Json
          loading_widget_settings: Json | null
          theme_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          dark_theme?: Json
          id?: string
          light_theme?: Json
          loading_widget_settings?: Json | null
          theme_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          dark_theme?: Json
          id?: string
          light_theme?: Json
          loading_widget_settings?: Json | null
          theme_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          device_fingerprint: string
          device_name: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          trusted_at: string | null
          user_id: string
        }
        Insert: {
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          trusted_at?: string | null
          user_id: string
        }
        Update: {
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          trusted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          duration_seconds: number | null
          id: string
          metadata: Json | null
          page_url: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_description: string
          badge_icon: string
          badge_id: string
          badge_name: string
          earned_at: string
          id: string
          points_awarded: number
          user_id: string
        }
        Insert: {
          badge_description: string
          badge_icon: string
          badge_id: string
          badge_name: string
          earned_at?: string
          id?: string
          points_awarded?: number
          user_id: string
        }
        Update: {
          badge_description?: string
          badge_icon?: string
          badge_id?: string
          badge_name?: string
          earned_at?: string
          id?: string
          points_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      user_commission_overrides: {
        Row: {
          commission_rate: number
          commission_type: string
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commission_rate: number
          commission_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commission_rate?: number
          commission_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_responder_id: string | null
          admin_response: string | null
          attachments: Json | null
          created_at: string
          feedback_type: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_responder_id?: string | null
          admin_response?: string | null
          attachments?: Json | null
          created_at?: string
          feedback_type: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_responder_id?: string | null
          admin_response?: string | null
          attachments?: Json | null
          created_at?: string
          feedback_type?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_media_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_camera_id: string | null
          preferred_microphone_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_camera_id?: string | null
          preferred_microphone_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_camera_id?: string | null
          preferred_microphone_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          achieved_at: string
          icon: string | null
          id: string
          milestone_description: string | null
          milestone_name: string
          milestone_type: string
          milestone_value: number
          points_awarded: number | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          icon?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name: string
          milestone_type: string
          milestone_value: number
          points_awarded?: number | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          icon?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          milestone_type?: string
          milestone_value?: number
          points_awarded?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          onboarding_step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          onboarding_step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          onboarding_step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_progress_onboarding_step_id_fkey"
            columns: ["onboarding_step_id"]
            isOneToOne: false
            referencedRelation: "onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          source_id?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          community_visibility: string | null
          content_recommendations: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          language: string | null
          notification_frequency: string | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          community_visibility?: string | null
          content_recommendations?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          community_visibility?: string | null
          content_recommendations?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notification_frequency?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_remembered: boolean | null
          last_activity_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_remembered?: boolean | null
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_remembered?: boolean | null
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          package_id: string
          status: string
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
          woocommerce_parent_product_id: number | null
          woocommerce_product_id: string | null
          woocommerce_subscription_id: string | null
          woocommerce_variation_id: number | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          package_id: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
          woocommerce_parent_product_id?: number | null
          woocommerce_product_id?: string | null
          woocommerce_subscription_id?: string | null
          woocommerce_variation_id?: number | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          package_id?: string
          status?: string
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
          woocommerce_parent_product_id?: number | null
          woocommerce_product_id?: string | null
          woocommerce_subscription_id?: string | null
          woocommerce_variation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_of_kids: string | null
          created_at: string
          date_of_birth_encrypted: string | null
          due_date: string | null
          email_encrypted: string | null
          father_type: string | null
          first_name_encrypted: string | null
          id: string
          last_name_encrypted: string | null
          number_of_kids: number | null
          phone_encrypted: string | null
          reminders_paused: boolean
          reminders_resume_date: string | null
          sync_status: string | null
          updated_at: string
          wp_user_id: number | null
        }
        Insert: {
          age_of_kids?: string | null
          created_at?: string
          date_of_birth_encrypted?: string | null
          due_date?: string | null
          email_encrypted?: string | null
          father_type?: string | null
          first_name_encrypted?: string | null
          id?: string
          last_name_encrypted?: string | null
          number_of_kids?: number | null
          phone_encrypted?: string | null
          reminders_paused?: boolean
          reminders_resume_date?: string | null
          sync_status?: string | null
          updated_at?: string
          wp_user_id?: number | null
        }
        Update: {
          age_of_kids?: string | null
          created_at?: string
          date_of_birth_encrypted?: string | null
          due_date?: string | null
          email_encrypted?: string | null
          father_type?: string | null
          first_name_encrypted?: string | null
          id?: string
          last_name_encrypted?: string | null
          number_of_kids?: number | null
          phone_encrypted?: string | null
          reminders_paused?: boolean
          reminders_resume_date?: string | null
          sync_status?: string | null
          updated_at?: string
          wp_user_id?: number | null
        }
        Relationships: []
      }
      welcome_video_settings: {
        Row: {
          created_at: string
          heading_text: string | null
          id: string
          is_enabled: boolean
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          heading_text?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          heading_text?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      whitelisted_ips: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          ip_address: unknown
          reason: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          reason?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      woocommerce_settings: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          last_sync_at: string | null
          site_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          site_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_sync_at?: string | null
          site_url?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      billing_addresses_admin_summary: {
        Row: {
          address_line1: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          postal_code_masked: string | null
          state: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_billing_address: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_access_tax_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_encryption_key_rotation_alert: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_message: string
          key_age_days: number
          requires_rotation: boolean
        }[]
      }
      check_payout_eligibility: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_profile_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: { p_ip_address: unknown; p_user_id: string }
        Returns: Json
      }
      cleanup_old_referral_visits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      detect_anomalous_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          access_count: number
          first_access: string
          last_access: string
          risk_level: string
          unique_tables: number
          user_id: string
        }[]
      }
      detect_payment_anomalies: {
        Args: { p_user_id: string }
        Returns: Json
      }
      encrypt_sensitive_data: {
        Args: { data: string }
        Returns: string
      }
      find_unencrypted_pii: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
          issue: string
          table_name: string
        }[]
      }
      get_all_users_decrypted: {
        Args: Record<PropertyKey, never>
        Returns: {
          age_of_kids: string
          created_at: string
          date_of_birth: string
          due_date: string
          email: string
          father_type: string
          first_name: string
          id: string
          last_name: string
          number_of_kids: number
          phone: string
          sync_status: string
          updated_at: string
          wp_user_id: number
        }[]
      }
      get_ambassador_analytics: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: Json
      }
      get_billing_address_decrypted: {
        Args: { target_user_id: string }
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          created_at: string
          id: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }[]
      }
      get_billing_address_secure: {
        Args: { target_user_id: string }
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          created_at: string
          id: string
          postal_code: string
          state: string
          updated_at: string
          user_id: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_db_connection_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          available_connections: number
          current_connections: number
          max_connections: number
        }[]
      }
      get_encryption_key_age: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_public_ambassador_profile: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_tax_document_secure: {
        Args: { target_user_id: string }
        Returns: {
          id: string
          is_verified: boolean
          tax_id_last_four: string
          tax_id_type: string
          tax_year: number
          user_id: string
          w9_submitted_date: string
        }[]
      }
      get_user_decrypted: {
        Args: { target_user_id: string }
        Returns: {
          age_of_kids: string
          created_at: string
          date_of_birth: string
          due_date: string
          email: string
          father_type: string
          first_name: string
          id: string
          last_name: string
          number_of_kids: number
          phone: string
          sync_status: string
          updated_at: string
          wp_user_id: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_ip_address: {
        Args: { ip: unknown }
        Returns: string
      }
      is_ip_whitelisted: {
        Args: { check_ip: unknown }
        Returns: boolean
      }
      is_key_rotation_overdue: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_switch: {
        Args: {
          action: string
          target_user_id: string
          target_user_name: string
        }
        Returns: undefined
      }
      log_device_fingerprint: {
        Args: {
          p_browser: string
          p_fingerprint_hash: string
          p_geolocation: Json
          p_ip_address: unknown
          p_os: string
          p_screen_resolution: string
          p_session_id: string
          p_timezone: string
          p_user_id: string
        }
        Returns: string
      }
      log_payment_access: {
        Args: {
          p_access_type: string
          p_accessed_columns: string[]
          p_accessed_table: string
          p_accessed_user_id: string
        }
        Returns: undefined
      }
      make_steven_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      revoke_old_sessions: {
        Args: { p_user_id: string }
        Returns: number
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: Json
          status: string
        }[]
      }
      security_notes: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      sync_stripe_payment_method: {
        Args: {
          p_card_brand: string
          p_card_exp_month: number
          p_card_exp_year: number
          p_card_last_four: string
          p_stripe_customer_id: string
          p_stripe_payment_method_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      truncate_user_agent: {
        Args: { ua: string }
        Returns: string
      }
      validate_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
