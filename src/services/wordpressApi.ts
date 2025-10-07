import { supabase } from "@/integrations/supabase/client";

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  date_of_birth?: string;
  father_type: 'blood_father' | 'flex_dad';
  how_many_kids?: number;
  agree_terms: 0 | 1;
  child_names?: string;
  child_ages?: string;
  due_date?: string;
}

export interface UpdateUserPayload {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  date_of_birth?: string;
  father_type: 'blood_father' | 'flex_dad';
  how_many_kids?: number;
  agree_terms: 0 | 1;
}

export interface UpdatePasswordPayload {
  user_id: number;
  new_password: string;
}

export interface WordPressUserResponse {
  success: boolean;
  data?: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    father_type: string;
    how_many_kids: number;
  };
  code?: string;
  message?: string;
}

/**
 * SECURITY NOTE: WooCommerce API keys are now stored securely as environment variables.
 * The WOOCOMMERCE_API_KEY and WOOCOMMERCE_SITE_URL are configured in Supabase Edge Function secrets.
 * This frontend function reads the site_url from the database for configuration purposes only.
 */

export async function createWordPressUser(
  payload: CreateUserPayload
): Promise<WordPressUserResponse> {
  try {
    // Call Edge function to create WordPress user securely
    const { data, error } = await supabase.functions.invoke('create-wordpress-user', {
      body: payload,
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        code: 'network_error',
        message: 'Unable to connect to registration service. Please try again.',
      };
    }

    return data as WordPressUserResponse;
  } catch (error) {
    console.error('WordPress API error:', error);
    return {
      success: false,
      code: 'network_error',
      message: 'Unable to connect to registration service. Please try again.',
    };
  }
}

export async function updateWordPressUser(
  payload: UpdateUserPayload
): Promise<WordPressUserResponse> {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('woocommerce_settings')
      .select('site_url')
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch WooCommerce settings:', settingsError);
      return {
        success: false,
        code: 'config_error',
        message: 'WordPress configuration not found. Please contact support.',
      };
    }

    const response = await fetch(
      `${settings.site_url}/wp-json/dadderup/v1/update-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        code: data.code || 'unknown_error',
        message: data.message || 'An error occurred during update.',
      };
    }

    return {
      success: data.success || true,
      data: data.data,
    };
  } catch (error) {
    console.error('WordPress API error:', error);
    return {
      success: false,
      code: 'network_error',
      message: 'Unable to connect to WordPress. Please try again.',
    };
  }
}

export async function updateWordPressPassword(
  payload: UpdatePasswordPayload
): Promise<WordPressUserResponse> {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('woocommerce_settings')
      .select('site_url')
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch WooCommerce settings:', settingsError);
      return {
        success: false,
        code: 'config_error',
        message: 'WordPress configuration not found. Please contact support.',
      };
    }

    const response = await fetch(
      `${settings.site_url}/wp-json/dadderup/v1/update-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        code: data.code || 'unknown_error',
        message: data.message || 'An error occurred during password update.',
      };
    }

    return {
      success: data.success || true,
      data: data.data,
    };
  } catch (error) {
    console.error('WordPress API error:', error);
    return {
      success: false,
      code: 'network_error',
      message: 'Unable to connect to WordPress. Please try again.',
    };
  }
}

export function getWordPressErrorMessage(code?: string): string {
  const errorMessages: Record<string, string> = {
    missing_first_name: 'First name is required.',
    missing_last_name: 'Last name is required.',
    missing_email: 'Email is required.',
    email_exists: 'An account with this email already exists.',
    'registration-error-email-exists': 'An account with this email already exists.',
    existing_user_email: 'An account with this email already exists.',
    existing_user_login: 'An account with this email already exists.',
    missing_password: 'Password is required.',
    missing_father_type: 'Father type is required.',
    terms_not_agreed: 'You must agree to the terms and conditions.',
    missing_user_id: 'Valid user ID is required.',
    missing_new_password: 'New password is required.',
    config_error: 'System configuration error. Please contact support.',
    network_error: 'Unable to connect. Please check your internet connection.',
    endpoint_not_found: 'WordPress registration service is not properly configured. Please contact support.',
    unauthorized: 'WordPress API authentication failed. Please contact support.',
    invalid_response: 'WordPress returned an invalid response. Please try again.',
    unknown_error: 'An unexpected error occurred. Please try again.',
  };

  return errorMessages[code || 'unknown_error'] || errorMessages.unknown_error;
}
