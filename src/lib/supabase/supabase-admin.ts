/**
 * Supabase Admin Client — Server-Side Only
 *
 * Uses the service_role key to bypass Row Level Security for storage operations.
 * NEVER import this file in client components or expose to the browser.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const SNAPPATH_BUCKET = 'snappath-bucket'
