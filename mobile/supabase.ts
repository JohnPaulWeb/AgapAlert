import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Supabase configuration for React Native Expo
// Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ==============================================================================
// Database Types
// ==============================================================================

export type UserRole = "resident" | "official";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  barangay_id: string | null;
  status: "pending" | "active" | "suspended";
}

export interface EvacuationCenter {
  id: string;
  barangay_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  status: "open" | "limited" | "full" | "closed";
  elevation_notes?: string;
  contact_number?: string;
  features?: string[];
  last_updated_at: string;
}

export interface IncidentReport {
  id: string;
  user_id?: string;
  barangay_id: string;
  category: "sos" | "flood" | "relief" | "medical" | "debris" | "hazard";
  title: string;
  details: string;
  latitude?: number;
  longitude?: number;
  location_landmark: string;
  contact_number?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "NEW" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
  created_at: string;
}

// ==============================================================================
// Mobile API Helpers
// ==============================================================================

/**
 * Fetch all verified centers
 */
export async function fetchMobileCenters(): Promise<EvacuationCenter[]> {
  try {
    const { data, error } = await supabase
      .from("evacuation_centers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("Using offline centers data:", err);
    return [];
  }
}

/**
 * Submit SOS or Incident Report from Mobile
 */
export async function sendMobileIncidentReport(
  report: Omit<IncidentReport, "id" | "created_at">
) {
  const { data, error } = await supabase
    .from("incident_reports")
    .insert([report])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Real-time listener for centers
 */
export function subscribeToMobileCenters(callback: (payload: any) => void) {
  return supabase
    .channel("mobile_centers")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "evacuation_centers" },
      (payload) => callback(payload)
    )
    .subscribe();
}
