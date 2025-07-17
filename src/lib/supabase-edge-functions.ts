import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const SUPABASE_PROJECT_ID = 'mrdupsekghsnbooyrdmj'; // Your Supabase Project ID
const API_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

interface InvokeEdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
  accessToken?: string | null;
  supabase?: SupabaseClient | null; // Optional Supabase client for getting access token if not provided
}

/**
 * Invokes a Supabase Edge Function.
 * @param functionName The name of the Edge Function (e.g., 'hello-world').
 * @param options Configuration for the request.
 * @returns The JSON response from the Edge Function.
 * @throws An error if the network request fails or the function returns an error.
 */
export async function invokeEdgeFunction<T>(
  functionName: string,
  options: InvokeEdgeFunctionOptions = {}
): Promise<T> {
  const { method = 'POST', body, accessToken, supabase } = options;

  let token = accessToken;
  if (!token && supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token || null;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${functionName}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || `Error invoking ${functionName}: ${response.statusText}`;
      console.error(`Edge Function Error (${functionName}):`, data);
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: any) {
    console.error(`Network or unexpected error invoking ${functionName}:`, error);
    toast.error(`Failed to connect to ${functionName}: ${error.message}`);
    throw error;
  }
}