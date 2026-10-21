import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ==============================================================================
// AgapAlert: Tomorrow Rain Forecast Tracker
// Uses Open-Meteo free forecast API to predict if it will rain tomorrow
// for monitored Philippine barangays.
// ==============================================================================

export type TomorrowForecast = {
  latitude: number;
  longitude: number;
  locationName: string;
  date: string;
  willRainTomorrow: boolean;
  rainProbabilityPercent: number;
  totalPrecipitationMm: number;
  maxRainRateMmPerHour: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  maxWindSpeedKph: number;
  weatherSummary: string;
  hourlyRainChance: number[];
  pagasaWarningLevel: "NONE" | "YELLOW" | "ORANGE" | "RED";
  advisoryMessage: string;
  floodRiskTomorrow: "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  timestamp: string;
};

function classifyFloodRisk(
  totalPrecipMm: number,
  maxRainRate: number,
  avgProbability: number
): TomorrowForecast["floodRiskTomorrow"] {
  if (totalPrecipMm >= 100 || maxRainRate >= 30) return "CRITICAL";
  if (totalPrecipMm >= 60 || maxRainRate >= 15) return "HIGH";
  if (totalPrecipMm >= 25 || maxRainRate >= 7.5) return "MODERATE";
  if (totalPrecipMm >= 5 || avgProbability >= 40) return "LOW";
  return "MINIMAL";
}

function classifyPagasaWarning(
  maxRainRate: number,
  totalPrecipMm: number
): TomorrowForecast["pagasaWarningLevel"] {
  if (maxRainRate >= 30 || totalPrecipMm >= 100) return "RED";
  if (maxRainRate >= 15 || totalPrecipMm >= 60) return "ORANGE";
  if (maxRainRate >= 7.5 || totalPrecipMm >= 25) return "YELLOW";
  return "NONE";
}

function generateAdvisory(forecast: Partial<TomorrowForecast>): string {
  const { pagasaWarningLevel, totalPrecipitationMm = 0, floodRiskTomorrow } = forecast;

  if (pagasaWarningLevel === "RED") {
    return `🔴 RED RAINFALL WARNING: Expect torrential rain tomorrow (${totalPrecipitationMm.toFixed(1)}mm). MANDATORY EVACUATION may be required for low-lying barangays. Prepare emergency Go-Bags and monitor Barangay announcements.`;
  }
  if (pagasaWarningLevel === "ORANGE") {
    return `🟠 ORANGE RAINFALL WARNING: Heavy rain expected tomorrow (${totalPrecipitationMm.toFixed(1)}mm). Flooding is threatening in riverside communities. Prepare to evacuate if water levels rise.`;
  }
  if (pagasaWarningLevel === "YELLOW") {
    return `🟡 YELLOW RAINFALL WARNING: Moderate rain expected tomorrow (${totalPrecipitationMm.toFixed(1)}mm). Possible flooding in low-lying areas. Keep emergency supplies ready.`;
  }
  if (floodRiskTomorrow === "LOW") {
    return `☁️ Light rain possible tomorrow (${totalPrecipitationMm.toFixed(1)}mm). No significant flood risk. Continue routine monitoring.`;
  }
  return `☀️ Clear to partly cloudy tomorrow. No significant rainfall expected. Conditions are safe.`;
}

function summarizeWeather(
  willRain: boolean,
  totalPrecip: number,
  maxWind: number
): string {
  if (!willRain) return "Clear to Partly Cloudy";
  if (totalPrecip >= 100) return "Torrential Downpour Expected";
  if (totalPrecip >= 60) return "Heavy Rainfall with Thunderstorms";
  if (totalPrecip >= 25) return "Moderate to Heavy Rain";
  if (totalPrecip >= 5) return "Light to Moderate Rain Showers";
  return "Light Drizzle / Scattered Showers";
}

/**
 * GET /api/forecast/tomorrow
 * Query params:
 *   lat (default: 16.0034 — Dalongue, Santa Barbara)
 *   lng (default: 120.3850)
 *   location (default: "Dalongue, Santa Barbara, Pangasinan")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "16.0034");
    const lng = parseFloat(searchParams.get("lng") || "120.3850");
    const locationName = searchParams.get("location") || "Dalongue, Santa Barbara, Pangasinan";

    // Fetch 2-day forecast from Open-Meteo (today + tomorrow)
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set(
      "daily",
      "precipitation_sum,precipitation_probability_max,rain_sum,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,weather_code"
    );
    url.searchParams.set(
      "hourly",
      "precipitation_probability,precipitation"
    );
    url.searchParams.set("timezone", "Asia/Manila");
    url.searchParams.set("forecast_days", "2");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }

    const data = await response.json();
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    // Tomorrow's data is at index 1
    const tomorrowIndex = 1;
    const tomorrowDate = daily.time?.[tomorrowIndex] || "Unknown";
    const totalPrecipMm = Number(
      (daily.precipitation_sum?.[tomorrowIndex] ?? 0).toFixed(1)
    );
    const rainSumMm = Number(
      (daily.rain_sum?.[tomorrowIndex] ?? 0).toFixed(1)
    );
    const maxRainProbability = daily.precipitation_probability_max?.[tomorrowIndex] ?? 0;
    const maxTempC = daily.temperature_2m_max?.[tomorrowIndex] ?? 30;
    const minTempC = daily.temperature_2m_min?.[tomorrowIndex] ?? 24;
    const maxWindKph = daily.wind_speed_10m_max?.[tomorrowIndex] ?? 10;

    // Extract tomorrow's hourly rain probabilities (hours 24-47)
    const hourlyProbs: number[] = (
      hourly.precipitation_probability || []
    ).slice(24, 48);
    const hourlyPrecip: number[] = (hourly.precipitation || []).slice(24, 48);
    const maxHourlyRainRate = Math.max(...hourlyPrecip, 0);
    const avgProbability =
      hourlyProbs.length > 0
        ? hourlyProbs.reduce((a: number, b: number) => a + b, 0) /
          hourlyProbs.length
        : maxRainProbability;

    const willRain = totalPrecipMm >= 1 || maxRainProbability >= 50;
    const floodRisk = classifyFloodRisk(
      totalPrecipMm,
      maxHourlyRainRate,
      avgProbability
    );
    const pagasaWarning = classifyPagasaWarning(
      maxHourlyRainRate,
      totalPrecipMm
    );
    const weatherSummary = summarizeWeather(willRain, totalPrecipMm, maxWindKph);

    const forecast: TomorrowForecast = {
      latitude: lat,
      longitude: lng,
      locationName,
      date: tomorrowDate,
      willRainTomorrow: willRain,
      rainProbabilityPercent: Math.round(
        Math.max(maxRainProbability, avgProbability)
      ),
      totalPrecipitationMm: Math.max(totalPrecipMm, rainSumMm),
      maxRainRateMmPerHour: Number(maxHourlyRainRate.toFixed(1)),
      minTemperatureC: Number(minTempC.toFixed(1)),
      maxTemperatureC: Number(maxTempC.toFixed(1)),
      maxWindSpeedKph: Number(maxWindKph.toFixed(1)),
      weatherSummary,
      hourlyRainChance: hourlyProbs,
      pagasaWarningLevel: pagasaWarning,
      advisoryMessage: "",
      floodRiskTomorrow: floodRisk,
      timestamp: new Date().toISOString(),
    };

    forecast.advisoryMessage = generateAdvisory(forecast);

    return NextResponse.json({
      success: true,
      forecast,
    });
  } catch (error: any) {
    // Fallback with simulated forecast data
    const fallbackForecast: TomorrowForecast = {
      latitude: 16.0034,
      longitude: 120.385,
      locationName: "Dalongue, Santa Barbara, Pangasinan",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      willRainTomorrow: true,
      rainProbabilityPercent: 72,
      totalPrecipitationMm: 28.5,
      maxRainRateMmPerHour: 12.4,
      minTemperatureC: 24.2,
      maxTemperatureC: 30.8,
      maxWindSpeedKph: 35,
      weatherSummary: "Moderate to Heavy Rain (Sensor Fallback)",
      hourlyRainChance: Array(24).fill(55),
      pagasaWarningLevel: "YELLOW",
      advisoryMessage:
        "🟡 YELLOW RAINFALL WARNING: Moderate rain expected tomorrow (28.5mm). Possible flooding in low-lying areas. Keep emergency supplies ready.",
      floodRiskTomorrow: "MODERATE",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      forecast: fallbackForecast,
      fallback: true,
      error: error?.message,
    });
  }
}
