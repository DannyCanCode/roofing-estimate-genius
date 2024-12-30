import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zmddqruzmcbpgblduxqx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZGRxcnV6bWNicGdibGR1eHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NTQ3NzAsImV4cCI6MjAyNDUzMDc3MH0.Iu_O8FoAhvxG9_UBGQIJkYh6d5-_4aqUhE_0zL3LQxY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)