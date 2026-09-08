"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  HeartHandshake,
  Home,
  Info,
  Layers,
  LifeBuoy,
  MapPin,
  Navigation,
  Package,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sliders,
  Sparkles,
  Thermometer,
  Truck,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from "lucide-react";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[580px] bg-[#071120] border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-400">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-bold tracking-wider">Initializing Live Geospatial Map...</span>
    </div>
  ),
});

// Types
type Role = "resident" | "official";
type Tab = "radar" | "centers" | "reports" | "hotlines";

interface LocationPreset {
  id: string;
  name: string;
  region: string;
  riverName: string;
  riverLevel: number;
  riverTrend: "rising" | "stable" | "falling";
  alarmLevel: 1 | 2 | 3 | 0;
  stormSignal: number;
  windSpeed: number;
  rainRate: number; // mm/h
  status: "Normal" | "Watch" | "Warning" | "Critical";
  evacCentersCount: number;
  lat: number;
  lng: number;
  zoom: number;
}

const LOCATIONS: LocationPreset[] = [
  {
    id: "marikina",
    name: "Marikina City",
    region: "Eastern Metro Manila",
    riverName: "Marikina River",
    riverLevel: 16.4,
    riverTrend: "rising",
    alarmLevel: 2,
    stormSignal: 3,
    windSpeed: 88,
    rainRate: 28,
    status: "Warning",
    evacCentersCount: 6,
    lat: 14.6507,
    lng: 121.1029,
    zoom: 14,
  },
  {
    id: "qc",
    name: "Quezon City (San Mateo)",
    region: "Northern Metro Manila",
    riverName: "Tullahan & San Mateo River",
    riverLevel: 14.8,
    riverTrend: "stable",
    alarmLevel: 1,
    stormSignal: 2,
    windSpeed: 62,
    rainRate: 15,
    status: "Watch",
    evacCentersCount: 8,
    lat: 14.6760,
    lng: 121.0437,
    zoom: 13,
  },
  {
    id: "pasig",
    name: "Pasig City",
    region: "Metro Manila Delta",
    riverName: "Pasig-Manggahan Floodway",
    riverLevel: 15.6,
    riverTrend: "rising",
    alarmLevel: 2,
    stormSignal: 3,
    windSpeed: 75,
    rainRate: 22,
    status: "Warning",
    evacCentersCount: 5,
    lat: 14.5764,
    lng: 121.0851,
    zoom: 14,
  },
  {
    id: "cagayan",
    name: "Tuguegarao, Cagayan",
    region: "Cagayan Valley",
    riverName: "Cagayan River Basin",
    riverLevel: 18.9,
    riverTrend: "rising",
    alarmLevel: 3,
    stormSignal: 4,
    windSpeed: 140,
    rainRate: 45,
    status: "Critical",
    evacCentersCount: 12,
    lat: 17.6132,
    lng: 121.7270,
    zoom: 13,
  },
];

interface EvacCenter {
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

const INITIAL_CENTERS: EvacCenter[] = [
  {
    id: "c1",
    name: "Marikina Sports Center Complex",
    barangay: "Sto. Niño",
    city: "Marikina City",
    distance: "0.8 km",
    status: "Open",
    occupancy: 54,
    capacity: 220,
    supplies: ["Clean Water (1,200L)", "Ready-to-Eat Rice", "Hygiene Packs", "Infant Milk"],
    features: ["Medical Aid", "Pet Friendly", "High Ground", "Generator Power"],
    contact: "(02) 8646-1633",
    elevation: "24m High Elevation",
    lat: 14.6343,
    lng: 121.0991,
  },
  {
    id: "c2",
    name: "Concepcion Elementary School",
    barangay: "Concepcion Uno",
    city: "Marikina City",
    distance: "1.4 km",
    status: "Open",
    occupancy: 132,
    capacity: 200,
    supplies: ["Drinking Water", "Thermal Blankets", "First Aid Station"],
    features: ["Medical Aid", "High Ground"],
    contact: "(02) 8941-2290",
    elevation: "21m Elevation",
    lat: 14.6528,
    lng: 121.1052,
  },
  {
    id: "c3",
    name: "San Roque Multipurpose Evac Center",
    barangay: "San Roque",
    city: "Marikina City",
    distance: "2.1 km",
    status: "Open",
    occupancy: 78,
    capacity: 140,
    supplies: ["Hot Meals", "Canned Goods", "Flashlights & Batteries"],
    features: ["Pet Friendly", "High Ground"],
    contact: "(02) 8646-0812",
    elevation: "22m Elevation",
    lat: 14.6291,
    lng: 121.1005,
  },
  {
    id: "c4",
    name: "Claro M. Recto High School",
    barangay: "Loyola Heights",
    city: "Quezon City",
    distance: "3.2 km",
    status: "Open",
    occupancy: 160,
    capacity: 280,
    supplies: ["Water Purifiers", "Family Food Packs", "Sleeping Mats"],
    features: ["Medical Aid", "High Ground", "Solar Power"],
    contact: "(02) 8928-1144",
    elevation: "32m High Ground",
    lat: 14.6468,
    lng: 121.0776,
  },
  {
    id: "c5",
    name: "West Triangle Evacuation Gym",
    barangay: "West Triangle",
    city: "Quezon City",
    distance: "4.0 km",
    status: "Full",
    occupancy: 180,
    capacity: 180,
    supplies: ["Supply Replenishment Dispatched"],
    features: ["Pet Friendly"],
    contact: "(02) 8373-5521",
    elevation: "18m Elevation",
    lat: 14.6496,
    lng: 121.0367,
  },
  {
    id: "c6",
    name: "Santolan Multi-Level Disaster Center",
    barangay: "Santolan",
    city: "Pasig City",
    distance: "2.7 km",
    status: "Open",
    occupancy: 95,
    capacity: 170,
    supplies: ["Potable Water", "Hot Porridge (Lugaw)", "Medical Doctor on Duty"],
    features: ["Medical Aid", "High Ground"],
    contact: "(02) 8641-0022",
    elevation: "20m Elevation",
    lat: 14.6105,
    lng: 121.0883,
  },
];

interface IncidentReport {
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

const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "rep-1",
    category: "flood",
    title: "Waist-deep rapid flood near Katipunan St.",
    location: "Concepcion Uno, Marikina",
    timestamp: "4 min ago",
    status: "NEW",
    priority: "CRITICAL",
    details: "4 families stranded on 2nd floor with 2 elderly seniors. Water rising 10cm every 15 mins. Rescue boat requested.",
    contact: "0917-882-1920",
    lat: 14.6515,
    lng: 121.1070,
  },
  {
    id: "rep-2",
    category: "medical",
    title: "Oxygen tank & senior patient transport",
    location: "San Roque Riverside",
    timestamp: "18 min ago",
    status: "ACKNOWLEDGED",
    priority: "HIGH",
    details: "Elderly resident on oxygen concentrator lost power. Needs ambulance transfer to high-ground hospital.",
    contact: "0920-551-4432",
    lat: 14.6280,
    lng: 121.0965,
  },
  {
    id: "rep-3",
    category: "relief",
    title: "Relief food & potable water shortage",
    location: "Barangka Community Hall",
    timestamp: "45 min ago",
    status: "DISPATCHED",
    priority: "MEDIUM",
    details: "60 evacuees have arrived. Water tanker truck dispatched from city hall.",
    lat: 14.6335,
    lng: 121.0872,
  },
  {
    id: "rep-4",
    category: "debris",
    title: "Fallen acacia tree blocking Tumana Bridge exit",
    location: "Tumana Bridge approach",
    timestamp: "1 hr ago",
    status: "RESOLVED",
    priority: "MEDIUM",
    details: "DPWH & Barangay chainsaw clearing crew cleared one lane. Passable for rescue 4x4s.",
    lat: 14.6575,
    lng: 121.1012,
  },
];

export default function Page() {
  // Application State
  const [role, setRole] = useState<Role>("resident");
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const [selectedLocation, setSelectedLocation] = useState<LocationPreset>(LOCATIONS[0]);
  
  // Real-time live simulation state
  const [liveRiverLevel, setLiveRiverLevel] = useState(LOCATIONS[0].riverLevel);
  const [liveRainRate, setLiveRainRate] = useState(LOCATIONS[0].rainRate);
  const [liveWindSpeed, setLiveWindSpeed] = useState(LOCATIONS[0].windSpeed);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");

  // Data state
  const [centers, setCenters] = useState<EvacCenter[]>(INITIAL_CENTERS);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);
  
  // Filters & Search
  const [centerSearch, setCenterSearch] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("all");

  // Modals
  const [selectedCenter, setSelectedCenter] = useState<EvacCenter | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChecklistDrawer, setShowChecklistDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Go Bag Checklist Items
  const [checklist, setChecklist] = useState([
    { id: "c1", label: "3 days potable water (1 gallon/person/day)", checked: true },
    { id: "c2", label: "Non-perishable canned goods & manual opener", checked: true },
    { id: "c3", label: "Emergency power bank, flashlight & spare batteries", checked: true },
    { id: "c4", label: "Prescription medicines & First Aid kit", checked: false },
    { id: "c5", label: "Important IDs & documents in waterproof zip bags", checked: false },
    { id: "c6", label: "Whistle for signaling rescue boat responders", checked: true },
  ]);

  // Sync state when location changes
  useEffect(() => {
    setLiveRiverLevel(selectedLocation.riverLevel);
    setLiveRainRate(selectedLocation.rainRate);
    setLiveWindSpeed(selectedLocation.windSpeed);
  }, [selectedLocation]);

  // Live telemetry pulse ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // Micro-fluctuation to show live telemetry activity
      const delta = (Math.random() - 0.48) * 0.04;
      setLiveRiverLevel((prev) => Math.round((prev + delta) * 100) / 100);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Toast auto dismiss
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Flood Alarm Level calculation based on river level
  const computedAlarmLevel = useMemo(() => {
    if (liveRiverLevel >= 18.0) return { level: 3, name: "ALARM 3 (FORCED EVACUATION)", color: "text-red-500 bg-red-500/15 border-red-500/40", bar: "bg-red-500" };
    if (liveRiverLevel >= 16.0) return { level: 2, name: "ALARM 2 (PREPARATORY EVACUATION)", color: "text-amber-500 bg-amber-500/15 border-amber-500/40", bar: "bg-amber-500" };
    if (liveRiverLevel >= 15.0) return { level: 1, name: "ALARM 1 (WARNING MONITORING)", color: "text-yellow-400 bg-yellow-400/15 border-yellow-400/40", bar: "bg-yellow-400" };
    return { level: 0, name: "NORMAL WATER LEVEL", color: "text-emerald-400 bg-emerald-400/15 border-emerald-400/40", bar: "bg-emerald-500" };
  }, [liveRiverLevel]);

  // Simulate water level spike
  const triggerSimulationSpike = () => {
    setIsSimulatingSpike(true);
    setToastMessage("⚠️ Simulating heavy rainfall inflow: Marikina River water rising +0.8m!");
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLiveRiverLevel((prev) => Math.round((prev + 0.15) * 100) / 100);
      setLiveRainRate((prev) => prev + 4);
      if (step >= 5) {
        clearInterval(interval);
        setIsSimulatingSpike(false);
      }
    }, 600);
  };

  // Submit Incident Report
  const handleCreateReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    const newRep: IncidentReport = {
      id: `rep-${Date.now()}`,
      category: formData.get("category") as any,
      title: formData.get("title") as string,
      location: formData.get("location") as string,
      timestamp: "Just now",
      status: "NEW",
      priority: (formData.get("priority") as any) || "HIGH",
      details: formData.get("details") as string,
      contact: formData.get("contact") as string,
      lat: selectedLocation.lat + latOffset,
      lng: selectedLocation.lng + lngOffset,
    };
    setReports([newRep, ...reports]);
    setShowReportModal(false);
    setToastMessage("✓ Incident report successfully transmitted to Barangay Response Command & plotted on Live Map!");
  };

  // Update report status (Official action)
  const handleUpdateStatus = (id: string, newStatus: IncidentReport["status"]) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
    setToastMessage(`Incident status updated to: ${newStatus}`);
  };

  // SOS Beacon Trigger
  const handleTriggerSos = () => {
    const sosItem: IncidentReport = {
      id: `sos-${Date.now()}`,
      category: "sos",
      title: "🚨 CRITICAL SOS: Immediate Boat & Life Rescue Requested",
      location: `${selectedLocation.name} (Live GPS Coords: ${selectedLocation.lat.toFixed(4)}° N, ${selectedLocation.lng.toFixed(4)}° E)`,
      timestamp: "Just now",
      status: "NEW",
      priority: "CRITICAL",
      details: "Resident activated emergency SOS beacon. Water entered residence, life-threatening situation.",
      lat: selectedLocation.lat + 0.003,
      lng: selectedLocation.lng - 0.002,
    };
    setReports([sosItem, ...reports]);
    setShowSosModal(false);
    setToastMessage("🚨 RESCUE BEACON BROADCASTED: Coordinates sent to Barangay QRT & NDRRMC!");
  };

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    return centers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
        c.barangay.toLowerCase().includes(centerSearch.toLowerCase());
      if (!matchSearch) return false;
      if (centerFilter === "all") return true;
      if (centerFilter === "open") return c.status === "Open" && c.occupancy < c.capacity;
      if (centerFilter === "medical") return c.features.includes("Medical Aid");
      if (centerFilter === "pets") return c.features.includes("Pet Friendly");
      if (centerFilter === "highground") return c.features.includes("High Ground");
      return true;
    });
  }, [centers, centerSearch, centerFilter]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (reportFilter === "all") return true;
      return r.category === reportFilter;
    });
  }, [reports, reportFilter]);

  const official = role === "official";

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Live Weather & Typhoon Warning Ticker Header */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-rose-950 border-b border-red-500/30 text-white px-4 py-2.5 text-xs sm:text-sm font-medium sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-black/40 border border-red-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-red-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              PAGASA SIGNAL #{selectedLocation.stormSignal} ACTIVE
            </span>
            <span className="hidden md:inline text-slate-200">
              <strong>Severe Storm & River Surge:</strong> {selectedLocation.name} · River Level: <strong>{liveRiverLevel}m</strong> ({computedAlarmLevel.name})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Go-Bag Checklist ({checklist.filter(c => c.checked).length}/{checklist.length})
            </button>
            <button
              onClick={() => setSoundAlerts(!soundAlerts)}
              className="p-1 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title={soundAlerts ? "Mute audio alarms" : "Unmute audio alarms"}
            >
              {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Emergency Go-Bag Checklist Drawer */}
      {showChecklistDrawer && (
        <div className="bg-[#0B1728] border-b border-cyan-500/30 p-4 sm:p-6 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  Philippine Disaster Emergency Go-Bag Checklist
                </h3>
                <p className="text-xs text-slate-400">Ensure these essentials are ready for immediate evacuation.</p>
              </div>
              <button
                onClick={() => setShowChecklistDrawer(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    item.checked
                      ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-100"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {
                      setChecklist(checklist.map(c => c.id === item.id ? { ...c, checked: !c.checked } : c));
                    }}
                    className="mt-0.5 rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs leading-relaxed">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#070F1E]/90 backdrop-blur-xl sticky top-[41px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Telemetry Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-cyan-500/25">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base sm:text-lg text-white">
                  AGAP<span className="text-cyan-400">ALERT</span>
                </span>
                <span className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
                {official ? "BARANGAY INCIDENT OPERATIONS DESK" : "COMMUNITY DISASTER & EVACUATION HUB"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "radar" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Live Map & Radar
            </button>
            <button
              onClick={() => setActiveTab("centers")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "centers" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Evacuation Centers
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "reports" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Incident Queue
              {reports.filter(r => r.status === "NEW").length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {reports.filter(r => r.status === "NEW").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("hotlines")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "hotlines" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Hotlines
            </button>
          </nav>

          {/* Action Hub & Role Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Switcher */}
            <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center">
              <button
                onClick={() => setRole("resident")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  role === "resident" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resident</span>
              </button>
              <button
                onClick={() => setRole("official")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  role === "official" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Official Desk</span>
              </button>
            </div>

            {/* Quick SOS Button */}
            <button
              onClick={() => setShowSosModal(true)}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Siren className="w-4 h-4 animate-bounce" />
              <span>SOS</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Control Bar: Location Presets & Telemetry Refresh */}
        <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Monitoring Sector</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLocation.id}
                  onChange={(e) => {
                    const found = LOCATIONS.find(l => l.id === e.target.value);
                    if (found) setSelectedLocation(found);
                  }}
                  className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} · {loc.riverName}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400 hidden sm:inline">({selectedLocation.region})</span>
              </div>
            </div>
          </div>

          {/* Real-time simulation controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={triggerSimulationSpike}
              disabled={isSimulatingSpike}
              className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              {isSimulatingSpike ? "Simulating Surge..." : "Simulate Water Rise"}
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-cyan-500/25 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Report Hazard / Incident
            </button>
          </div>
        </div>

        {/* 4. Live Disaster & Threat Telemetry Gauge Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: River Basin Water Level */}
          <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                River Gauge Telemetry
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${computedAlarmLevel.color}`}>
                ALARM {computedAlarmLevel.level}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{liveRiverLevel}</span>
              <span className="text-lg font-bold text-slate-400">meters</span>
              <span className="ml-auto text-xs text-red-400 font-bold flex items-center">
                ▲ +0.2m/hr
              </span>
            </div>

            {/* Visual Level Gauge Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Normal: 14m</span>
                <span>Alarm 2: 16m</span>
                <span>Critical: 18m</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${computedAlarmLevel.bar}`}
                  style={{ width: `${Math.min(((liveRiverLevel - 13) / (20 - 13)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 font-medium">
              Sensor: <strong>{selectedLocation.riverName}</strong>
            </p>
          </div>

          {/* Card 2: Typhoon & Wind Radar */}
          <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-teal-400" />
                Typhoon Wind Gusts
              </span>
              <span className="text-[10px] font-black bg-teal-500/15 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full">
                GALE FORCE
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{liveWindSpeed}</span>
              <span className="text-lg font-bold text-slate-400">km/h</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <span>Tropical Storm Force:</span>
              <span className="font-bold text-teal-400">Signal #{selectedLocation.stormSignal} Warning</span>
            </div>
          </div>

          {/* Card 3: Rainfall Intensity Gauge */}
          <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-blue-400" />
                Doppler Rain Intensity
              </span>
              <span className="text-[10px] font-black bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                TORRENTIAL
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">{liveRainRate}</span>
              <span className="text-lg font-bold text-slate-400">mm/hour</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <span>Flash Flood Risk:</span>
              <span className="font-bold text-red-400">High in Low-Lying Areas</span>
            </div>
          </div>

          {/* Card 4: Active Evacuation Centers Availability */}
          <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-400" />
                Safe Haven Capacity
              </span>
              <span className="text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">
                {centers.filter(c => c.status === "Open").length} OPEN
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">
                {centers.reduce((acc, c) => acc + (c.capacity - c.occupancy), 0)}
              </span>
              <span className="text-lg font-bold text-slate-400">spaces left</span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-3">
              <span>Total Evacuees Sheltered:</span>
              <span className="font-bold text-emerald-400">{centers.reduce((acc, c) => acc + c.occupancy, 0)} people</span>
            </div>
          </div>
        </div>

        {/* 5. Main Tab Content Views */}
        
        {/* TAB 1: Live Radar & Interactive Threat Map */}
        {activeTab === "radar" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Interactive Leaflet Map */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-cyan-400" />
                    Live Community Hazard & Evacuation Map
                  </h3>
                  <p className="text-xs text-slate-400">Interactive OpenStreetMap view with evacuation shelters, flood hazard zones, and GPS routes.</p>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                  Synced {lastSyncTime}
                </span>
              </div>

              {/* Map Component */}
              <InteractiveMap
                selectedLocation={selectedLocation}
                centers={centers}
                reports={reports}
                liveRiverLevel={liveRiverLevel}
                onSelectCenter={(center) => setSelectedCenter(center)}
                onRequestSos={() => setShowSosModal(true)}
                onReportHazard={() => setShowReportModal(true)}
              />
            </div>

            {/* Official Urgent Warnings & Emergency Actions */}
            <div className="space-y-4">
              {/* Critical Alert Card */}
              <div className="bg-gradient-to-br from-red-950/70 via-[#0D1829] to-[#0D1829] border border-red-500/40 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Critical River Advisory
                </div>
                <h4 className="text-lg font-black text-white mb-2">Preparatory Evacuation Active</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Marikina River has breached <strong>16.3 meters</strong>. Residents in Tumana, Malanday, Nangka, and Concepcion Uno are advised to move to designated high-ground centers now before water enters homes.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCenter(centers[0])}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Route to Marikina Sports Center
                  </button>
                  <button
                    onClick={() => setShowSosModal(true)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
                  >
                    <Siren className="w-4 h-4" />
                    Request Immediate Rescue (SOS)
                  </button>
                </div>
              </div>

              {/* Barangay Response Quick Desk */}
              <div className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    Barangay Quick Response Teams
                  </h4>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    4 RESCUE BOATS ACTIVE
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-300">Tumana Rescue Unit</span>
                    <span className="font-bold text-emerald-400">On Patrol</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-300">Concepcion Medical Team</span>
                    <span className="font-bold text-cyan-400">At Center 2</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-300">Food Logistics Truck</span>
                    <span className="font-bold text-amber-400">En Route</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Evacuation Centers Finder */}
        {activeTab === "centers" && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search evacuation centers by name, barangay, or school..."
                  value={centerSearch}
                  onChange={(e) => setCenterSearch(e.target.value)}
                  className="w-full bg-[#0D1829] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All Centers" },
                  { id: "open", label: "Open Beds" },
                  { id: "medical", label: "Medical Aid" },
                  { id: "pets", label: "Pet Friendly" },
                  { id: "highground", label: "High Ground" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCenterFilter(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      centerFilter === tab.id
                        ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                        : "bg-[#0D1829] border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Centers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCenters.map(center => {
                const occupancyPct = Math.round((center.occupancy / center.capacity) * 100);
                const isFull = center.status === "Full" || occupancyPct >= 98;
                const barColor = occupancyPct >= 85 ? "bg-red-500" : occupancyPct >= 60 ? "bg-amber-500" : "bg-emerald-500";

                return (
                  <div
                    key={center.id}
                    className="bg-[#0D1829] border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isFull ? "text-red-400 bg-red-500/15 border-red-500/30" : "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                        }`}>
                          {isFull ? "AT CAPACITY" : "OPEN & READY"}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">{center.distance} away</span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition mb-1">
                        {center.name}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">📍 {center.barangay}, {center.city} · {center.elevation}</p>

                      {/* Capacity Bar */}
                      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-400 font-medium">Occupancy</span>
                          <span className="font-bold text-white">
                            {center.occupancy} / {center.capacity} ({occupancyPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(occupancyPct, 100)}%` }}></div>
                        </div>
                      </div>

                      {/* Supplies tags */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Verified Supplies:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {center.supplies.map((sup, idx) => (
                            <span key={idx} className="bg-slate-900 text-slate-300 border border-slate-800 text-[11px] px-2 py-0.5 rounded">
                              ✓ {sup}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedCenter(center)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs py-2 rounded-xl transition cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCenter(center);
                          setActiveTab("radar");
                          setToastMessage(`Locating ${center.name} on Google-style Live Map...`);
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Directions & Map
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Community Incident Queue & Official Dispatch */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">
                  {official ? "Barangay Operations Incident Queue" : "Community Reports & Distress Requests"}
                </h3>
                <p className="text-xs text-slate-400">
                  {official
                    ? "Live queue from residents. Acknowledge, dispatch boats, and resolve reports in real time."
                    : "Report flooded streets, trapped families, or needed supplies directly to barangay responders."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Category filter */}
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="bg-[#0D1829] border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Categories</option>
                  <option value="flood">Flooding Alerts</option>
                  <option value="medical">Medical Emergencies</option>
                  <option value="relief">Relief Requests</option>
                  <option value="debris">Road Debris</option>
                  <option value="sos">SOS Beacons</option>
                </select>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/25"
                >
                  <Plus className="w-4 h-4" />
                  Submit Report
                </button>
              </div>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {filteredReports.map(rep => (
                <div
                  key={rep.id}
                  className={`bg-[#0D1829] border rounded-2xl p-5 shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    rep.priority === "CRITICAL"
                      ? "border-red-500/50 bg-gradient-to-r from-red-950/30 to-[#0D1829]"
                      : "border-slate-800/80"
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        rep.status === "NEW" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                        rep.status === "ACKNOWLEDGED" ? "text-amber-400 bg-amber-500/15 border-amber-500/30" :
                        rep.status === "DISPATCHED" ? "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" :
                        "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                      }`}>
                        {rep.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{rep.timestamp}</span>
                      <span className="text-[10px] font-bold text-slate-400">· 📍 {rep.location}</span>
                    </div>

                    <h4 className="text-base font-bold text-white">{rep.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{rep.details}</p>
                    {rep.contact && (
                      <p className="text-xs text-cyan-400 font-medium">📞 Contact: {rep.contact}</p>
                    )}
                  </div>

                  {/* Official Action Lifecycle Controls */}
                  {official && (
                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                      {rep.status === "NEW" && (
                        <button
                          onClick={() => handleUpdateStatus(rep.id, "ACKNOWLEDGED")}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      {rep.status === "ACKNOWLEDGED" && (
                        <button
                          onClick={() => handleUpdateStatus(rep.id, "DISPATCHED")}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          Dispatch Unit
                        </button>
                      )}
                      {rep.status === "DISPATCHED" && (
                        <button
                          onClick={() => handleUpdateStatus(rep.id, "RESOLVED")}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {rep.status === "RESOLVED" && (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Resolved
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Philippine Emergency Hotlines */}
        {activeTab === "hotlines" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-white">Philippine National & Local Emergency Hotlines</h3>
              <p className="text-xs text-slate-400">Direct one-tap lines for rescue operations, ambulance dispatch, and disaster assistance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "National Emergency", num: "911", agency: "PNP, BFP & Ambulance", color: "border-red-500/40 text-red-400" },
                { name: "Philippine Red Cross", num: "143", agency: "Emergency Medical & Blood", color: "border-red-500/40 text-red-400" },
                { name: "Marikina Rescue", num: "161", agency: "River flood & rescue boat dispatch", color: "border-cyan-500/40 text-cyan-400" },
                { name: "NDRRMC Operations", num: "(02) 8911-1406", agency: "Disaster Risk Council", color: "border-blue-500/40 text-blue-400" },
                { name: "PAGASA Weather", num: "(02) 8284-0800", agency: "Severe Typhoon Bulletins", color: "border-teal-500/40 text-teal-400" },
                { name: "Coast Guard Rescue", num: "(02) 8527-8481", agency: "Water search & rescue", color: "border-cyan-500/40 text-cyan-400" },
                { name: "MMDA Metro Command", num: "136", agency: "Flooded road advisories", color: "border-amber-500/40 text-amber-400" },
                { name: "DOH Health Hotline", num: "1555", agency: "Emergency health support", color: "border-emerald-500/40 text-emerald-400" },
              ].map((h, i) => (
                <div key={i} className="bg-[#0D1829] border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400">{h.agency}</span>
                    <h4 className="text-base font-bold text-white mt-1">{h.name}</h4>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className={`text-xl font-black ${h.color}`}>{h.num}</span>
                    <a
                      href={`tel:${h.num}`}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
                    >
                      Call ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 6. Modals */}

      {/* Center Details Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1829] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedCenter.status === "Open" ? "OPEN & ACCEPTING EVACUEES" : "TEMPORARILY FULL"}
                </span>
                <h3 className="text-xl font-black text-white mt-1">{selectedCenter.name}</h3>
                <p className="text-xs text-slate-400">📍 {selectedCenter.barangay}, {selectedCenter.city} · {selectedCenter.elevation}</p>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Occupancy Progress */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-400">Occupancy Usage</span>
                <span className="text-white">{selectedCenter.occupancy} / {selectedCenter.capacity} beds</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${Math.round((selectedCenter.occupancy / selectedCenter.capacity) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Supplies checklist */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">Available Verified Supplies & Relief:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedCenter.supplies.map((s, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800">
              <a
                href={`tel:${selectedCenter.contact}`}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                Call Desk
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.lat},${selectedCenter.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Google Maps ↗
              </a>
              <button
                onClick={() => {
                  setSelectedCenter(null);
                  setActiveTab("radar");
                  setToastMessage(`Routing directions to ${selectedCenter.name} on Live Map!`);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                Live Route Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1829] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Community Safety Desk</span>
                <h3 className="text-xl font-black text-white">Submit Incident Report</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Incident Category</label>
                <select
                  name="category"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="flood">🌊 Rapid Flooding / Rising Water</option>
                  <option value="medical">🚑 Medical Emergency / Stranded Senior</option>
                  <option value="relief">📦 Relief Goods & Potable Water Request</option>
                  <option value="debris">⚠️ Road Blockage / Fallen Tree</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Incident Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Waist-deep water near Katipunan bridge"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Specific Location / Landmark</label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={`${selectedLocation.name}, Marikina River Sector`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Situation Details & People Stranded</label>
                <textarea
                  name="details"
                  required
                  rows={3}
                  placeholder="Describe number of people, current water level, and special medical needs..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Contact Number (Optional)</label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="e.g. 0917-xxx-xxxx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs shadow-md shadow-cyan-500/25 cursor-pointer"
                >
                  Submit to Response Desk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency SOS Confirmation Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13070A] border-2 border-red-500 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <Siren className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white">Broadcast Emergency SOS?</h3>
            <p className="text-xs text-red-200/80 leading-relaxed">
              This triggers a high-priority rescue beacon transmitting your live coordinates to the <strong>Barangay Quick Response Command</strong> and <strong>NDRRMC Rescue Boats</strong>.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleTriggerSos}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm py-3 rounded-xl shadow-lg shadow-red-600/50 transition cursor-pointer"
              >
                CONFIRM RESCUE BEACON
              </button>
              <a
                href="tel:911"
                className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-800 block"
              >
                Direct Call: Dial 911
              </a>
              <button
                onClick={() => setShowSosModal(false)}
                className="text-xs text-slate-400 hover:text-white pt-1 block mx-auto cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
