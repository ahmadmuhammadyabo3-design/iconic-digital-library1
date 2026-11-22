import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validates and retrieves the Supabase public environment variables.
 * Throws clear, actionable errors if any variables are missing or invalid.
 */
export function validateSupabaseEnv(): SupabaseEnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.trim() === "") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. " +
        "Please ensure it is set in your .env.local file."
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Please ensure it is set in your .env.local file."
    );
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". ` +
        "It must be a valid HTTP or HTTPS URL (e.g., https://your-project.supabase.co)."
    );
  }

  return {
    supabaseUrl: supabaseUrl.trim(),
    supabaseAnonKey: supabaseAnonKey.trim(),
  };
}

let clientInstance: TypedSupabaseClient | undefined;

/**
 * Creates or retrieves the singleton Supabase browser client using `@supabase/supabase-js`.
 * In a browser environment, it reuses the existing client instance across renders to prevent
 * duplicate WebSocket connections and redundant auth listeners.
 */
export function createClient(): TypedSupabaseClient {
  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const { supabaseUrl, supabaseAnonKey } = validateSupabaseEnv();

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}

/**
 * Alias for createClient() matching standard Supabase conventions.
 */
export const createBrowserClient = createClient;

/**
 * Shared Supabase browser client instance.
 * Safe to import directly into React client components.
 */
export const supabase: TypedSupabaseClient = (function () {
  try {
    return createClient();
  } catch {
    // If environment variables are not yet loaded at module evaluation time,
    // defer initialization via a Proxy until first accessed.
    return new Proxy({} as TypedSupabaseClient, {
      get(_target, prop, receiver) {
        const client = createClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
      },
    });
  }
})();

export default supabase;
export type { Database };
