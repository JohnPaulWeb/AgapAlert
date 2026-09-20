"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Navigation,
  Compass,
  Layers,
  MapPin,
  Crosshair,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Home,
  Radio,
  Siren,
  Sparkles,
  Info,
  CheckCircle2,
  Phone,
  Eye,
  EyeOff,
  LocateFixed,
  Route,
  Waves,
  ExternalLink,
  Car,
  Footprints,
  X,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export interface MapCenter {
  id: string;
  name: string;
  barangay: string;
  city: string;
  distance: string;
  status: "Open" | "Full";
  occupancy: number;
  capacity: number;
  supplies: string[];
  features: string[];
  contact: string;
  elevation: string;
  lat: number;
  lng: number;
}

export interface MapIncident {
  id: string;
  category: "flood" | "relief" | "medical" | "debris" | "sos";
  title: string;
  location: string;
  timestamp: string;
  status: "NEW" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  details: string;
  contact?: string;
  lat?: number;
  lng?: number;
}

export interface MapLocationPreset {
  id: string;
  name: string;
  region: string;
  riverName: string;
  riverLevel: number;
  alarmLevel: 1 | 2 | 3 | 0;
  stormSignal: number;
  lat: number;
  lng: number;
  zoom: number;
}

interface InteractiveMapProps {
  selectedLocation: MapLocationPreset;
  centers: MapCenter[];
  reports: MapIncident[];
  liveRiverLevel: number;
  onSelectCenter: (center: MapCenter) => void;
  onRequestSos?: () => void;
  onReportHazard?: () => void;
}

// Google Maps Raster Tile Layers & Styles
type MapStyle = "google_streets" | "google_hybrid" | "google_terrain" | "google_traffic" | "dark_tactical";

const GOOGLE_TILE_LAYERS: Record<MapStyle, { name: string; url: string; subdomains?: string; maxZoom: number; previewBg: string }> = {
  google_streets: {
    name: "Google Streets",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    maxZoom: 20,
    previewBg: "bg-emerald-800",
  },
  google_hybrid: {
    name: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    maxZoom: 20,
    previewBg: "bg-blue-900",
  },
  google_terrain: {
    name: "Google Terrain",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    maxZoom: 20,
    previewBg: "bg-amber-800",
  },
  google_traffic: {
    name: "Live Traffic & Roads",
    url: "https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
    maxZoom: 20,
    previewBg: "bg-orange-800",
  },
  dark_tactical: {
    name: "Tactical Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    previewBg: "bg-slate-900",
  },
};

// Flood hazard polygons around low-lying river areas in Pangasinan, Metro Manila & Cagayan
const HAZARD_ZONES: Record<string, { name: string; level: string; color: string; coords: [number, number][] }[]> = {
  dalongue: [
    {
      name: "Sinocalan River Overflow & Dalongue Lowland Basin",
      level: "Critical Flood Hazard",
      color: "#ef4444",
      coords: [
        [16.0090, 120.3790],
        [16.0065, 120.3920],
        [15.9990, 120.3950],
        [15.9970, 120.3840],
        [16.0020, 120.3750],
      ],
    },
    {
      name: "Bued-Sinocalan Spillway Low Agricultural Basin",
      level: "Moderate Risk Zone",
      color: "#f59e0b",
      coords: [
        [16.0150, 120.3720],
        [16.0120, 120.3880],
        [16.0070, 120.3820],
        [16.0090, 120.3690],
      ],
    },
    {
      name: "Tuliao - Dalongue Road Corridor Water Inflow",
      level: "High Risk",
      color: "#f97316",
      coords: [
        [16.0040, 120.3810],
        [16.0010, 120.3890],
        [15.9950, 120.3860],
        [15.9980, 120.3780],
      ],
    },
  ],
  marikina: [
    {
      name: "Tumana & Malanday Low-Lying Basin (High Flood Risk)",
      level: "Critical Flood Overflow",
      color: "#ef4444",
      coords: [
        [14.662, 121.100],
        [14.656, 121.105],
        [14.647, 121.108],
        [14.645, 121.102],
        [14.653, 121.096],
        [14.660, 121.095],
      ],
    },
    {
      name: "Nangka River Overflow Watch Area",
      level: "Moderate Risk",
      color: "#f59e0b",
      coords: [
        [14.672, 121.110],
        [14.668, 121.118],
        [14.660, 121.114],
        [14.663, 121.106],
      ],
    },
    {
      name: "Provident Village Flood Basin",
      level: "Warning Zone",
      color: "#f97316",
      coords: [
        [14.629, 121.088],
        [14.624, 121.092],
        [14.620, 121.085],
        [14.625, 121.081],
      ],
    },
  ],
  qc: [
    {
      name: "Tullahan Riverbank Low Corridor",
      level: "High Flood Risk",
      color: "#ef4444",
      coords: [
        [14.698, 121.035],
        [14.694, 121.045],
        [14.688, 121.040],
        [14.692, 121.030],
      ],
    },
    {
      name: "San Mateo River Floodway Watch",
      level: "Moderate Risk",
      color: "#f59e0b",
      coords: [
        [14.680, 121.065],
        [14.675, 121.075],
        [14.668, 121.070],
        [14.672, 121.060],
      ],
    },
  ],
  pasig: [
    {
      name: "Manggahan Floodway Discharge Overflow",
      level: "Critical Inflow Zone",
      color: "#ef4444",
      coords: [
        [14.582, 121.098],
        [14.575, 121.104],
        [14.565, 121.096],
        [14.572, 121.088],
      ],
    },
  ],
  cagayan: [
    {
      name: "Cagayan Main Basin Catchment Overflow",
      level: "Extremely Critical",
      color: "#dc2626",
      coords: [
        [17.635, 121.710],
        [17.625, 121.745],
        [17.595, 121.740],
        [17.605, 121.705],
      ],
    },
  ],
};

// Safe High-Ground Routes
const SAFE_ROUTES: Record<string, { name: string; coords: [number, number][] }[]> = {
  dalongue: [
    {
      name: "Dalongue to Santa Barbara Poblacion High Spine",
      coords: [
        [16.0034, 120.3850],
        [16.0010, 120.3920],
        [15.9982, 120.4015],
      ],
    },
    {
      name: "Dalongue to Tuliao High Ground Route",
      coords: [
        [16.0034, 120.3850],
        [16.0070, 120.3810],
        [16.0120, 120.3780],
      ],
    },
  ],
  marikina: [
    {
      name: "Sumulong Highway High Ridge Corridor",
      coords: [
        [14.634, 121.099],
        [14.638, 121.108],
        [14.644, 121.115],
        [14.652, 121.122],
      ],
    },
    {
      name: "Marikina Heights Elevated Evacuation Spine",
      coords: [
        [14.6528, 121.1052],
        [14.6570, 121.1120],
        [14.6610, 121.1190],
      ],
    },
  ],
  qc: [
    {
      name: "Katipunan Elevated Ridge Route",
      coords: [
        [14.638, 121.072],
        [14.648, 121.075],
        [14.658, 121.074],
      ],
    },
  ],
};

export default function InteractiveMap({
  selectedLocation,
  centers,
  reports,
  liveRiverLevel,
  onSelectCenter,
  onRequestSos,
  onReportHazard,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layerGroupsRef = useRef<{
    centers?: any;
    hazards?: any;
    reports?: any;
    routes?: any;
    userLocation?: any;
    activeRoute?: any;
  }>({});

  // Map configuration state
  const [activeMapStyle, setActiveMapStyle] = useState<MapStyle>("google_streets");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showCenters, setShowCenters] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Search & Navigation
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [activeChipFilter, setActiveChipFilter] = useState<"all" | "open" | "medical" | "pets" | "highground">("all");
  const [activeRouteCenter, setActiveRouteCenter] = useState<MapCenter | null>(null);
  const [selectedPinCenter, setSelectedPinCenter] = useState<MapCenter | null>(null);
  const [travelMode, setTravelMode] = useState<"walk" | "drive">("walk");

  // Geolocation
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [selectedLocation.lat, selectedLocation.lng],
        zoom: selectedLocation.zoom || 14,
        zoomControl: false,
        attributionControl: true,
      });

      // Google-style Tile Layer
      const config = GOOGLE_TILE_LAYERS[activeMapStyle];
      const tile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        subdomains: (config as any).subdomains || "abc",
      }).addTo(map);

      tileLayerRef.current = tile;

      // Layer groups
      layerGroupsRef.current = {
        centers: L.layerGroup().addTo(map),
        hazards: L.layerGroup().addTo(map),
        reports: L.layerGroup().addTo(map),
        routes: L.layerGroup().addTo(map),
        userLocation: L.layerGroup().addTo(map),
        activeRoute: L.layerGroup().addTo(map),
      };

      mapInstanceRef.current = map;
      setMapLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import("leaflet").then((L) => {
      const config = GOOGLE_TILE_LAYERS[activeMapStyle];
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newTile = L.tileLayer(config.url, {
        maxZoom: config.maxZoom,
        subdomains: (config as any).subdomains || "abc",
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newTile;
    });
  }, [activeMapStyle]);

  // Pan / Fly to selected location preset
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedLocation.lat, selectedLocation.lng],
      selectedLocation.zoom || 14,
      { duration: 1.2 }
    );
  }, [selectedLocation]);

  // Filtered Centers by search & chips
  const filteredMapCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchQuery =
        !mapSearchQuery ||
        c.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        c.barangay.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(mapSearchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (activeChipFilter === "all") return true;
      if (activeChipFilter === "open") return c.status === "Open" && c.occupancy < c.capacity;
      if (activeChipFilter === "medical") return c.features.includes("Medical Aid");
      if (activeChipFilter === "pets") return c.features.includes("Pet Friendly");
      if (activeChipFilter === "highground") return c.features.includes("High Ground");
      return true;
    });
  }, [centers, mapSearchQuery, activeChipFilter]);

  // Draw Navigation Route to Evacuation Center
  const drawRouteToCenter = useCallback((center: MapCenter) => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.activeRoute) return;

    setActiveRouteCenter(center);
    setSelectedPinCenter(center);

    import("leaflet").then((L) => {
      const group = layerGroupsRef.current.activeRoute;
      group.clearLayers();

      const startPos: [number, number] = userLocation || [selectedLocation.lat, selectedLocation.lng];
      const endPos: [number, number] = [center.lat, center.lng];

      // Realistic high-ground route curve points
      const midLat = (startPos[0] + endPos[0]) / 2 + 0.0015;
      const midLng = (startPos[1] + endPos[1]) / 2 - 0.0018;

      const routePoints: [number, number][] = [startPos, [midLat, midLng], endPos];

      // Google Maps style blue route line
      const routeLine = L.polyline(routePoints, {
        color: "#4285F4", // Google Maps primary navigation blue
        weight: 7,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      });

      // Border outline for route
      const routeOutline = L.polyline(routePoints, {
        color: "#1a73e8",
        weight: 10,
        opacity: 0.4,
        lineCap: "round",
        lineJoin: "round",
      });

      group.addLayer(routeOutline);
      group.addLayer(routeLine);

      const bounds = L.latLngBounds([startPos, endPos]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });
    });
  }, [userLocation, selectedLocation]);

  const clearActiveRoute = useCallback(() => {
    setActiveRouteCenter(null);
    if (layerGroupsRef.current.activeRoute) {
      layerGroupsRef.current.activeRoute.clearLayers();
    }
  }, []);

  // Render Google Maps Style Teardrop Markers for Centers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.centers) return;

    import("leaflet").then((L) => {
      const group = layerGroupsRef.current.centers;
      group.clearLayers();

      if (!showCenters) return;

      filteredMapCenters.forEach((center) => {
        if (!center.lat || !center.lng) return;

        const occupancyPct = Math.round((center.occupancy / center.capacity) * 100);
        const isOpen = center.status === "Open" && occupancyPct < 98;
        const pinColor = isOpen ? "#0F9D58" : "#EA4335"; // Google Green vs Google Red
        const bedsLeft = center.capacity - center.occupancy;

        // Google Maps style teardrop pin
        const customIcon = L.divIcon({
          className: "google-maps-pin",
          html: `
            <div style="
              position: relative;
              width: 38px;
              height: 48px;
              transform: translate(-50%, -100%);
              cursor: pointer;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));
              transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
              <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 48 19 48C19 48 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z" fill="${pinColor}"/>
                <circle cx="19" cy="18" r="14" fill="#ffffff"/>
                <text x="19" y="22" font-size="13" font-family="system-ui, sans-serif" font-weight="900" text-anchor="middle" fill="${pinColor}">⌂</text>
              </svg>
              <div style="
                position: absolute;
                bottom: -2px;
                left: 50%;
                transform: translateX(-50%);
                background: #1e293b;
                color: #ffffff;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 5px;
                border-radius: 9999px;
                border: 1px solid ${pinColor};
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.5);
              ">
                ${bedsLeft} beds
              </div>
            </div>
          `,
          iconSize: [38, 48],
          iconAnchor: [19, 48],
        });

        const marker = L.marker([center.lat, center.lng], { icon: customIcon });

        marker.on("click", () => {
          setSelectedPinCenter(center);
          mapInstanceRef.current.flyTo([center.lat, center.lng], 16, { duration: 0.8 });
        });

        group.addLayer(marker);
      });
    });
  }, [filteredMapCenters, showCenters]);

  // Render Flood Hazard Risk Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.hazards) return;

    import("leaflet").then((L) => {
      const group = layerGroupsRef.current.hazards;
      group.clearLayers();

      if (!showHazards) return;

      const zones = HAZARD_ZONES[selectedLocation.id] || HAZARD_ZONES.marikina;

      zones.forEach((zone) => {
        const polygon = L.polygon(zone.coords, {
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.28,
          weight: 2.5,
          dashArray: "6, 6",
        });

        polygon.bindPopup(`
          <div style="font-family: inherit; min-width: 180px;">
            <span style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); padding: 2px 8px; border-radius: 6px;">
              ${zone.level}
            </span>
            <h5 style="font-size: 13px; font-weight: 700; margin: 8px 0 2px 0; color: #f1f5f9;">${zone.name}</h5>
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">High water inflow risk. Avoid low-ground roads.</p>
          </div>
        `);

        group.addLayer(polygon);
      });
    });
  }, [selectedLocation, showHazards]);

  // Render Safe High-Ground Routes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.routes) return;

    import("leaflet").then((L) => {
      const group = layerGroupsRef.current.routes;
      group.clearLayers();

      if (!showRoutes) return;

      const routes = SAFE_ROUTES[selectedLocation.id] || SAFE_ROUTES.marikina;

      routes.forEach((route) => {
        const polyline = L.polyline(route.coords, {
          color: "#0F9D58", // Google green
          weight: 5,
          opacity: 0.85,
          dashArray: "8, 6",
        });

        polyline.bindPopup(`
          <div style="font-family: inherit; min-width: 180px;">
            <span style="display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.35); padding: 2px 8px; border-radius: 6px;">
              Safe high ground
            </span>
            <h5 style="font-size: 13px; font-weight: 700; margin: 8px 0 2px 0; color: #f1f5f9;">${route.name}</h5>
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Elevated roadway passable during severe rainfall.</p>
          </div>
        `);

        group.addLayer(polyline);
      });
    });
  }, [selectedLocation, showRoutes]);

  // Render Live Incidents & SOS Markers (Google Maps style Red Alert Pins)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current.reports) return;

    import("leaflet").then((L) => {
      const group = layerGroupsRef.current.reports;
      group.clearLayers();

      if (!showReports) return;

      reports.forEach((rep) => {
        if (!rep.lat || !rep.lng) return;

        const isSos = rep.category === "sos" || rep.priority === "CRITICAL";
        const pinColor = isSos ? "#EA4335" : "#FBBC04";

        const repIcon = L.divIcon({
          className: "google-maps-incident-pin",
          html: `
            <div style="
              position: relative;
              width: 32px;
              height: 42px;
              transform: translate(-50%, -100%);
              cursor: pointer;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
            ">
              ${isSos ? `<div style="position: absolute; top: 0; left: 0; width: 32px; height: 32px; border-radius: 50%; background: rgba(234, 67, 53, 0.4); animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ""}
              <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${pinColor}"/>
                <circle cx="16" cy="15" r="11" fill="#ffffff"/>
                <text x="16" y="19" font-size="11" font-family="system-ui, sans-serif" font-weight="900" text-anchor="middle" fill="${pinColor}">
                  ${isSos ? "!" : "▲"}
                </text>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });

        const marker = L.marker([rep.lat, rep.lng], { icon: repIcon });

        marker.bindPopup(`
          <div style="font-family: inherit; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 9px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.35); padding: 2px 6px; border-radius: 4px;">
                ${rep.status} · ${rep.priority}
              </span>
              <span style="font-size: 10px; color: #94a3b8;">${rep.timestamp}</span>
            </div>
            <h5 style="font-size: 13px; font-weight: 700; margin: 6px 0 2px 0; color: #f1f5f9;">${rep.title}</h5>
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0;">${rep.location}</p>
            <p style="font-size: 11px; color: #cbd5e1; margin: 0; line-height: 1.45;">${rep.details}</p>
            ${rep.contact ? `<p style="font-size: 11px; color: #7dd3fc; font-weight: 600; margin: 6px 0 0 0;">Call ${rep.contact}</p>` : ""}
          </div>
        `);

        group.addLayer(marker);
      });
    });
  }, [reports, showReports]);

  // Google Maps Style User GPS Location (Blue dot with direction pulse)
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPos: [number, number] = [latitude, longitude];
        setUserLocation(userPos);
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(userPos, 16, { duration: 1.2 });

          import("leaflet").then((L) => {
            const group = layerGroupsRef.current.userLocation;
            group.clearLayers();

            const userIcon = L.divIcon({
              className: "google-my-location-dot",
              html: `
                <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
                  <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(66, 133, 244, 0.35); animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                  <div style="position: relative; width: 18px; height: 18px; background: #4285F4; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(66, 133, 244, 0.8);"></div>
                </div>
              `,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            });

            const marker = L.marker(userPos, { icon: userIcon });
            group.addLayer(marker);
          });
        }
      },
      () => {
        setIsLocating(false);
        const defaultPos: [number, number] = [selectedLocation.lat, selectedLocation.lng];
        setUserLocation(defaultPos);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [selectedLocation]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 font-sans ${
      isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "w-full h-[600px] sm:h-[660px]"
    }`}>
      {/* 1. Google Maps Floating Search Bar & Filter Chips (Top Left) */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto z-30 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {/* Floating Google Maps Style Search Card */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/70 p-2 flex items-center gap-2">
          <div className="pl-2 flex items-center text-slate-400">
            <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>

          <input
            type="text"
            placeholder={`Search ${selectedLocation.name} evacuation shelters...`}
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />

          {mapSearchQuery && (
            <button
              onClick={() => setMapSearchQuery("")}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <button
            onClick={() => handleLocateMe()}
            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Locate my position"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: `All Shelters (${centers.length})` },
            { id: "open", label: "Open Beds" },
            { id: "medical", label: "Medical Aid" },
            { id: "pets", label: "Pet Friendly" },
            { id: "highground", label: "High Ground" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveChipFilter(chip.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow-md whitespace-nowrap cursor-pointer ${
                activeChipFilter === chip.id
                  ? "bg-blue-600 text-white shadow-blue-600/30"
                  : "bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Google Maps Place Card / Detail Sheet (Bottom Left / Slide in) */}
      {selectedPinCenter && (
        <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:w-96 z-40 bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200 dark:border-cyan-500/40 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  selectedPinCenter.status === "Open"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-500/30"
                }`}>
                  {selectedPinCenter.status === "Open" ? "OPEN & ACCEPTING" : "AT FULL CAPACITY"}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {selectedPinCenter.distance} away
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {selectedPinCenter.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                📍 {selectedPinCenter.barangay}, {selectedPinCenter.city} · {selectedPinCenter.elevation}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPinCenter(null);
                clearActiveRoute();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Occupancy Indicator */}
          <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-3 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">Shelter Capacity</span>
              <span className="text-blue-600 dark:text-cyan-400">
                {selectedPinCenter.occupancy} / {selectedPinCenter.capacity} ({Math.round((selectedPinCenter.occupancy / selectedPinCenter.capacity) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((selectedPinCenter.occupancy / selectedPinCenter.capacity) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons: Directions, Call, Open in Google Maps */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => drawRouteToCenter(selectedPinCenter)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPinCenter.lat},${selectedPinCenter.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-blue-500" />
              Google Maps ↗
            </a>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={() => onSelectCenter(selectedPinCenter)}
              className="text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              View Full Supply Inventory →
            </button>
            <a
              href={`tel:${selectedPinCenter.contact}`}
              className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1 hover:text-blue-600"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Call Desk
            </a>
          </div>
        </div>
      )}

      {/* 3. Turn-by-Turn Route Direction Card (Top Right) */}
      {activeRouteCenter && (
        <div className="absolute top-4 right-4 z-30 max-w-sm w-full bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-blue-500/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                <Navigation className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-cyan-400">
                  SAFE HIGH-GROUND ROUTE
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none">
                  {activeRouteCenter.name}
                </h4>
              </div>
            </div>
            <button
              onClick={clearActiveRoute}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-emerald-500" />
              <span>~{Math.max(6, Math.round(parseFloat(activeRouteCenter.distance) * 11))} min walk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-500" />
              <span>~{Math.max(3, Math.round(parseFloat(activeRouteCenter.distance) * 4))} min drive</span>
            </div>
            <span className="ml-auto text-blue-600 dark:text-cyan-400">{activeRouteCenter.distance}</span>
          </div>

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
              <span>1. Head northeast towards elevated high-ground ridge corridor.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>2. Arrive at <strong>{activeRouteCenter.name}</strong> ({activeRouteCenter.elevation}).</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Google Maps Style Layer Switcher Widget (Bottom Left Square) */}
      <div className="absolute bottom-6 left-4 z-30 pointer-events-auto">
        {!selectedPinCenter && (
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-2 hover:scale-105 transition cursor-pointer group"
              title="Change Map Layers"
            >
              <div className={`w-10 h-10 rounded-xl ${GOOGLE_TILE_LAYERS[activeMapStyle].previewBg} flex items-center justify-center text-white font-bold shadow`}>
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold pr-2.5 text-slate-700 dark:text-slate-200 hidden sm:inline">
                Layers
              </span>
            </button>

            {/* Layer Picker Dropdown */}
            {showLayerMenu && (
              <div className="absolute bottom-14 left-0 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 w-64 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                  Map Type
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(GOOGLE_TILE_LAYERS) as MapStyle[]).map((styleKey) => (
                    <button
                      key={styleKey}
                      onClick={() => {
                        setActiveMapStyle(styleKey);
                        setShowLayerMenu(false);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold text-left transition cursor-pointer flex flex-col gap-1 border ${
                        activeMapStyle === styleKey
                          ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg ${GOOGLE_TILE_LAYERS[styleKey].previewBg} flex items-center justify-center text-white text-[10px]`}>
                        {styleKey === "google_hybrid" ? "Satellite" : styleKey === "google_traffic" ? "Traffic" : "Map"}
                      </div>
                      <span className="truncate">{GOOGLE_TILE_LAYERS[styleKey].name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                    Map Overlays
                  </span>
                  <button
                    onClick={() => setShowHazards(!showHazards)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-red-500" /> Flood Hazard Zones
                    </span>
                    {showHazards ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button
                    onClick={() => setShowRoutes(!showRoutes)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Route className="w-3.5 h-3.5 text-emerald-500" /> Safe High Routes
                    </span>
                    {showRoutes ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Google Maps Floating FABs (Bottom Right: Zoom, Re-center, Fullscreen) */}
      <div className="absolute bottom-6 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Locate Me FAB */}
        <button
          onClick={handleLocateMe}
          className="w-11 h-11 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition hover:scale-105 cursor-pointer"
          title="Re-center to my location"
        >
          <LocateFixed className={`w-5 h-5 text-blue-600 ${isLocating ? "animate-spin" : ""}`} />
        </button>

        {/* Zoom Controls Pill */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <button
            onClick={handleZoomIn}
            className="w-11 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-lg transition cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 w-full"></div>
          <button
            onClick={handleZoomOut}
            className="w-11 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-lg transition cursor-pointer"
            title="Zoom Out"
          >
            &minus;
          </button>
        </div>

        {/* Fullscreen Toggle FAB */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="w-11 h-11 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition hover:scale-105 cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* 6. Leaflet Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
          <span className="text-xs font-medium tracking-wide">Loading live map…</span>
        </div>
      )}
    </div>
  );
}
