import { createClient } from "@supabase/supabase-js";

// Supabase environment keys (configured in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================================================================
// Database Types
// ==============================================================================

export type UserRole = "resident" | "official";
export type OfficialStatus = "pending" | "active" | "suspended";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  barangay_id: string | null;
  status: OfficialStatus;
  verification_doc_url?: string | null;
  phone_number?: string | null;
}

export interface Barangay {
  id: string;
  name: string;
  city: string;
  province: string;
  hotline?: string;
  river_basin?: string;
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

export interface ReliefItem {
  id: string;
  center_id: string;
  item_name: string;
  stock_status: "stocked" | "running_low" | "critical" | "out_of_stock";
  quantity_notes?: string;
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
  action_notes?: string;
  created_at: string;
}

// ==============================================================================
// AgapAlert API Helpers
// ==============================================================================

/**
 * Fetch all verified evacuation centers with relief inventory
 */
export async function fetchEvacuationCenters(): Promise<EvacuationCenter[]> {
  const { data, error } = await supabase
    .from("evacuation_centers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.warn("Using fallback centers data (Supabase offline):", error.message);
    return [];
  }
  return data || [];
}

/**
 * Update evacuation center occupancy and auto-calculate status (Official only)
 */
export async function updateCenterCapacity(
  centerId: string,
  newOccupancy: number,
  capacity: number
) {
  const pct = newOccupancy / capacity;
  const status = pct >= 1.0 ? "full" : pct >= 0.85 ? "limited" : "open";

  const { data, error } = await supabase
    .from("evacuation_centers")
    .update({
      current_occupancy: newOccupancy,
      status: status,
    })
    .eq("id", centerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch incident reports for a specific barangay queue (Official) or user (Resident)
 */
export async function fetchIncidentReports(barangayId?: string): Promise<IncidentReport[]> {
  let query = supabase
    .from("incident_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (barangayId) {
    query = query.eq("barangay_id", barangayId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Using fallback reports data:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Submit an emergency SOS or Community Incident Report
 */
export async function submitIncidentReport(
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
 * Update Incident Status (Acknowledge / Dispatch / Resolve) (Official only)
 */
export async function updateIncidentStatus(
  reportId: string,
  status: IncidentReport["status"],
  actionNotes?: string
) {
  const { data, error } = await supabase
    .from("incident_reports")
    .update({
      status: status,
      action_notes: actionNotes,
    })
    .eq("id", reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Subscribe to real-time evacuation center updates (WebSocket)
 */
export function subscribeToCenterUpdates(
  callback: (payload: any) => void
) {
  return supabase
    .channel("public:evacuation_centers")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "evacuation_centers" },
      (payload) => callback(payload)
    )
    .subscribe();
}

/**
 * Subscribe to real-time incident reports & SOS alerts (WebSocket)
 */
export function subscribeToIncidentQueue(
  barangayId: string | undefined,
  callback: (payload: any) => void
) {
  const channel = supabase.channel(`incident_reports:${barangayId || "all"}`);
  
  return channel
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "incident_reports" },
      (payload) => callback(payload)
    )
    .subscribe();
}
