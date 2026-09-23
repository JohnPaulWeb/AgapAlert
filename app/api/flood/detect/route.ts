import { NextRequest, NextResponse } from "next/server";
import {
  fetchLiveWeatherAndRainfall,
  findNearbyRiverStation,
  calculateFloodRisk,
  classifyPAGASARainfall,
  classifyTCWS,
} from "@/backend/alerts";

export const dynamic = "force-dynamic";

/**
 * GET /api/flood/detect
 * Query params:
 *   - lat: latitude (default: 16.0034 - Dalongue, Santa Barbara, Pangasinan)
 *   - lng: longitude (default: 120.3850)
 *   - river_level: optional simulated/sensor override for water level (meters)
 *   - rain_rate: optional simulated/sensor override for rain rate (mm/h)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "16.0034");
    const lng = parseFloat(searchParams.get("lng") || "120.3850");
    const overrideRiverLevel = searchParams.get("river_level");
    const overrideRainRate = searchParams.get("rain_rate");

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude parameters" },
        { status: 400 }
      );
    }

    // 1. Fetch live meteorological observations and 24h precipitation
    const weather = await fetchLiveWeatherAndRainfall(lat, lng);

    // Apply rain rate override if provided (useful for simulator & testing)
    if (overrideRainRate !== null && !isNaN(parseFloat(overrideRainRate))) {
      weather.rainRateMmPerHour = parseFloat(overrideRainRate);
    }

    // 2. Locate closest river gauge station telemetry
    let riverStation = findNearbyRiverStation(lat, lng);
    if (riverStation && overrideRiverLevel !== null && !isNaN(parseFloat(overrideRiverLevel))) {
      riverStation = {
        ...riverStation,
        currentLevelMeters: parseFloat(overrideRiverLevel),
      };
    }

    // 3. Compute multi-factor hydrological flood risk
    const assessment = calculateFloodRisk(weather, riverStation);

    return NextResponse.json({
      success: true,
      location: {
        latitude: lat,
        longitude: lng,
      },
      weather,
      riverTelemetry: riverStation,
      assessment,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API /api/flood/detect] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during flood detection",
      },
      { status: 500 }
    );
  }
}
