import { NextRequest, NextResponse } from "next/server";
import {
  RawPAGASAAlert,
  NormalizedAlert,
  normalizeAlert,
  isWithinRadius,
} from "@/backend/alerts";

export const dynamic = "force-dynamic";

// In-memory active alerts cache
let activeAlerts: NormalizedAlert[] = [
  normalizeAlert({
    externalId: "PAGASA-FFA-2026-0923-01",
    kind: "flash-flood",
    title: "Sinocalan River Flash Flood & Overflow Warning",
    area: "Santa Barbara, Calasiao, Dagupan (Pangasinan)",
    description: "Sinocalan River gauge exceeded 5.8m warning threshold. Rapid rainfall inflow detected. Residents in low-lying riverbank barangays are advised to evacuate immediately.",
    issuedAt: new Date().toISOString(),
    sourceUrl: "https://bagong.pagasa.dost.gov.ph",
    severity: "critical",
    centroid: { latitude: 16.0034, longitude: 120.3850 },
  }),
  normalizeAlert({
    externalId: "PAGASA-HRA-2026-0923-02",
    kind: "heavy-rainfall",
    title: "PAGASA Orange Rainfall Advisory #04",
    area: "Metro Manila, Rizal, Pangasinan",
    description: "Intense rainfall (15-28 mm/h) observed due to Southwest Monsoon enhanced by low pressure area. Flooding threatening low-lying roads.",
    issuedAt: new Date().toISOString(),
    sourceUrl: "https://bagong.pagasa.dost.gov.ph",
    severity: "high",
    centroid: { latitude: 14.6507, longitude: 121.1029 },
  }),
];

/**
 * GET /api/alerts
 * Optional query params:
 *   - lat & lng: filter alerts within radius
 *   - radius: radius in km (default: 50)
 *   - severity: minimum severity filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius") || "50";

    let filtered = [...activeAlerts];

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const radiusKm = parseFloat(radiusStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        filtered = filtered.filter((alert) => {
          if (!alert.centroid) return true;
          return isWithinRadius(alert.centroid, { latitude: lat, longitude: lng }, radiusKm);
        });
      }
    }

    return NextResponse.json({
      success: true,
      alerts: filtered,
      total: filtered.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Broadcast a new emergency alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, title, area, description, severity, centroid } = body;

    if (!title || !area || !description) {
      return NextResponse.json(
        { error: "title, area, and description are required fields." },
        { status: 400 }
      );
    }

    const rawAlert: RawPAGASAAlert = {
      externalId: `AGAP-${Date.now()}`,
      kind: kind || "flash-flood",
      title,
      area,
      description,
      issuedAt: new Date().toISOString(),
      sourceUrl: "https://agapalert.gov.ph",
      severity: severity || "high",
      centroid: centroid || { latitude: 16.0034, longitude: 120.3850 },
    };

    const normalized = normalizeAlert(rawAlert);
    activeAlerts.unshift(normalized);

    return NextResponse.json({
      success: true,
      alert: normalized,
      message: "Alert broadcast registered successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to broadcast alert" },
      { status: 500 }
    );
  }
}
