import { createBrowserClient } from "@supabase/ssr"

function getSupabaseClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  if (supabaseUrl.startsWith("eyJ") && supabaseAnonKey.startsWith("http")) {
    [supabaseUrl, supabaseAnonKey] = [supabaseAnonKey, supabaseUrl]
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getSupabaseClient()
