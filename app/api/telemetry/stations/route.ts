import { NextRequest, NextResponse } from "next/server";
import { KNOWN_RIVER_STATIONS, RiverStationTelemetry } from "@/backend/alerts";

export const dynamic = "force-dynamic";

// In-memory telemetry cache for real-time sensor ingestion
let stationCache: RiverStationTelemetry[] = [...KNOWN_RIVER_STATIONS];

/**
 * GET /api/telemetry/stations
 * Returns all active river water level monitoring stations
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    stations: stationCache,
    total: stationCache.length,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/telemetry/stations
 * Ingests live telemetry readings from automated river gauges or IoT sensors
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, currentLevelMeters, trend, rateOfRiseMetersPerHour } = body;

    if (!stationId || typeof currentLevelMeters !== "number") {
      return NextResponse.json(
        { error: "stationId and numeric currentLevelMeters are required." },
        { status: 400 }
      );
    }

    const stationIndex = stationCache.findIndex((s) => s.stationId === stationId);
    if (stationIndex === -1) {
      return NextResponse.json(
        { error: `Station '${stationId}' not found.` },
        { status: 404 }
      );
    }

    stationCache[stationIndex] = {
      ...stationCache[stationIndex],
      currentLevelMeters,
      trend: trend || stationCache[stationIndex].trend,
      rateOfRiseMetersPerHour:
        rateOfRiseMetersPerHour ?? stationCache[stationIndex].rateOfRiseMetersPerHour,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      updatedStation: stationCache[stationIndex],
      message: "Telemetry ingested successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process telemetry reading" },
      { status: 500 }
    );
  }
}
