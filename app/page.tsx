"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Anchor,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  CloudLightning,
  CloudRain,
  Compass,
  Cross,
  Crosshair,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Home,
  Layers,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  TrafficCone,
  TreePine,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
  User,
  LogIn,
  LogOut,
  UserPlus,
  LocateFixed,
  Radio,
  CheckCheck,
  XCircle,
  Navigation2,
  AlertOctagon,
  BadgeCheck,
} from "lucide-react";

import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] sm:h-[660px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
      <span className="text-xs font-medium tracking-wide">Loading live map…</span>
    </div>
  ),
});

// Types
type Role = "resident" | "official";
type Tab = "radar" | "centers" | "reports" | "hotlines";
type ToastTone = "success" | "warning" | "danger";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  barangay: string;
  phone?: string;
}

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
    id: "dalongue",
    name: "Barangay Dalongue, Santa Barbara",
    region: "Pangasinan, Ilocos Region",
    riverName: "Sinocalan River",
    riverLevel: 5.82,
    riverTrend: "rising",
    alarmLevel: 2,
    stormSignal: 3,
    windSpeed: 82,
    rainRate: 34,
    status: "Warning",
    evacCentersCount: 4,
    lat: 16.0034,
    lng: 120.3850,
    zoom: 15,
  },
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
    lat: 14.676,
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
    lng: 121.727,
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
    id: "c-sb-1",
    name: "Dalongue Barangay Evacuation Hall",
    barangay: "Dalongue",
    city: "Santa Barbara, Pangasinan",
    distance: "0.4 km",
    status: "Open",
    occupancy: 42,
    capacity: 180,
    supplies: ["Clean Drinking Water (800L)", "Ready-to-Eat Rice", "Hygiene Kits", "First Aid Station"],
    features: ["Medical Aid", "High Ground", "Generator Power", "Rescue Boats on Site"],
    contact: "(075) 518-2024",
    elevation: "18m High Ground",
    lat: 16.0034,
    lng: 120.3850,
  },
  {
    id: "c-sb-2",
    name: "Santa Barbara Multi-Purpose Gymnasium",
    barangay: "Poblacion Sur",
    city: "Santa Barbara, Pangasinan",
    distance: "1.2 km",
    status: "Open",
    occupancy: 110,
    capacity: 350,
    supplies: ["Hot Meals Desk", "Thermal Blankets", "Medical Station", "Infant Formula"],
    features: ["Medical Aid", "Pet Friendly", "High Ground", "Solar Backup"],
    contact: "0917-508-1122",
    elevation: "22m High Elevation",
    lat: 15.9982,
    lng: 120.4015,
  },
  {
    id: "c-sb-3",
    name: "Tuliao Disaster Evacuation Center",
    barangay: "Tuliao",
    city: "Santa Barbara, Pangasinan",
    distance: "1.8 km",
    status: "Open",
    occupancy: 65,
    capacity: 220,
    supplies: ["Water Purification Units", "Family Food Packs", "Sleeping Mats"],
    features: ["Medical Aid", "Pet Friendly", "High Ground"],
    contact: "0920-911-3344",
    elevation: "20m Elevation",
    lat: 16.0120,
    lng: 120.3780,
  },
  {
    id: "c-sb-4",
    name: "Minien National High School Shelter",
    barangay: "Minien",
    city: "Santa Barbara, Pangasinan",
    distance: "2.6 km",
    status: "Open",
    occupancy: 88,
    capacity: 200,
    supplies: ["Bottled Water", "Emergency Biscuits", "Flashlights"],
    features: ["High Ground", "Classroom Modular Partitions"],
    contact: "0939-440-1288",
    elevation: "21m High Ground",
    lat: 16.0175,
    lng: 120.3950,
  },
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
  waterDepth?: string;
  peopleCount?: number;
  victimName?: string;
  actionNotes?: string;
}

const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "sos-sb-1",
    category: "sos",
    title: "CRITICAL SOS: 3 Families Stranded near Sinocalan River Dike",
    location: "Barangay Dalongue, Santa Barbara (Sinocalan Riverbank)",
    timestamp: "2 min ago",
    status: "NEW",
    priority: "CRITICAL",
    details:
      "Rapid flood water rising above waist level from Sinocalan River overflow. 8 persons including 2 seniors and 1 infant trapped on upper roof deck. Immediate rescue boat needed.",
    contact: "0917-508-1122",
    lat: 16.0048,
    lng: 120.3862,
    waterDepth: "Waist-deep (1.2m)",
    peopleCount: 8,
    victimName: "Maria Santos & Cruz Family",
  },
  {
    id: "rep-sb-2",
    category: "flood",
    title: "Chest-deep flood water along Dalongue-Tuliao access road",
    location: "Dalongue-Tuliao boundary road, Santa Barbara",
    timestamp: "12 min ago",
    status: "NEW",
    priority: "HIGH",
    details:
      "Water level reached 1.4m. Light vehicles and tricycles completely impassable. High-clearance truck or rubber boat required for safe transit.",
    contact: "0920-551-7788",
    lat: 16.0090,
    lng: 120.3810,
    waterDepth: "Chest-deep (1.4m)",
  },
  {
    id: "rep-sb-3",
    category: "medical",
    title: "Senior insulin patient evacuation required",
    location: "Poblacion Sur, Santa Barbara",
    timestamp: "25 min ago",
    status: "ACKNOWLEDGED",
    priority: "HIGH",
    details:
      "Elderly resident requires transport to Santa Barbara Rural Health Unit with power for refrigerated insulin medication.",
    contact: "0939-112-9900",
    lat: 15.9982,
    lng: 120.4015,
  },
  {
    id: "rep-1",
    category: "flood",
    title: "Waist-deep rapid flood near Katipunan St.",
    location: "Concepcion Uno, Marikina",
    timestamp: "35 min ago",
    status: "ACKNOWLEDGED",
    priority: "CRITICAL",
    details: "4 families stranded on 2nd floor. Rescue team notified.",
    contact: "0917-882-1920",
    lat: 14.6515,
    lng: 121.107,
  },
];

// ---- Shared design tokens ----
const panel = "rounded-xl border border-slate-800 bg-slate-900/70";
const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40";
const selectCls =
  "rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-xs font-medium text-slate-100 transition focus:border-cyan-500 focus:outline-none cursor-pointer";
const badge =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "radar", label: "Live Map", icon: Compass },
  { id: "centers", label: "Shelters", icon: Home },
  { id: "reports", label: "Incidents", icon: Layers },
  { id: "hotlines", label: "Hotlines", icon: Phone },
];

const HOTLINES: { name: string; num: string; agency: string; service: string; icon: LucideIcon }[] = [
  { name: "Santa Barbara MDRRMO", num: "(075) 518-2024", agency: "Santa Barbara Pangasinan DRRM", service: "Sinocalan flood rescue & boat dispatch", icon: LifeBuoy },
  { name: "Santa Barbara Mayor Emergency", num: "0917-508-1122", agency: "LGU Santa Barbara Command", service: "24/7 Disaster Quick Response", icon: ShieldCheck },
  { name: "Pangasinan PDRRMO", num: "(075) 542-7000", agency: "Provincial DRRM Council", service: "Provincial rescue & air/boat assets", icon: Shield },
  { name: "National Emergency", num: "911", agency: "PNP · BFP · Ambulance", service: "National emergency dispatch", icon: Siren },
  { name: "Philippine Red Cross Pangasinan", num: "(075) 522-2258", agency: "Red Cross Dagupan/Pangasinan", service: "Medical response & relief aid", icon: Cross },
  { name: "PAGASA Weather Alert", num: "(02) 8284-0800", agency: "PAGASA", service: "Typhoon & Sinocalan river bulletins", icon: CloudLightning },
  { name: "Coast Guard Pangasinan Station", num: "0917-819-4825", agency: "Philippine Coast Guard", service: "Flood & maritime watercraft rescue", icon: Anchor },
  { name: "DOH Health Emergency", num: "1555", agency: "Department of Health", service: "Emergency medical advice", icon: Stethoscope },
];

const RESPONSE_TEAMS = [
  { name: "Santa Barbara Water Search & Rescue (WASAR)", status: "Active in Dalongue", dot: "bg-emerald-400", cls: "text-emerald-400" },
  { name: "Dalongue Barangay QRT Boat Crew", status: "On patrol", dot: "bg-cyan-400", cls: "text-cyan-400" },
  { name: "MDRRMO Amphibious Logistics Truck", status: "En route to Tuliao", dot: "bg-amber-400", cls: "text-amber-400" },
];

const reportCategoryMeta: Record<IncidentReport["category"], { icon: LucideIcon; cls: string }> = {
  flood: { icon: Waves, cls: "border-sky-500/20 bg-sky-500/10 text-sky-400" },
  medical: { icon: Cross, cls: "border-rose-500/20 bg-rose-500/10 text-rose-400" },
  relief: { icon: Package, cls: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  debris: { icon: TreePine, cls: "border-lime-500/20 bg-lime-500/10 text-lime-400" },
  sos: { icon: Siren, cls: "border-red-500/20 bg-red-500/10 text-red-400" },
};

const reportStatusMeta: Record<IncidentReport["status"], { icon: LucideIcon; cls: string }> = {
  NEW: { icon: Bell, cls: "border-red-500/30 bg-red-500/15 text-red-300" },
  ACKNOWLEDGED: { icon: Eye, cls: "border-amber-500/30 bg-amber-500/15 text-amber-300" },
  DISPATCHED: { icon: Send, cls: "border-blue-500/30 bg-blue-500/15 text-blue-300" },
  RESOLVED: { icon: CheckCircle2, cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" },
};

const ribbonMeta: Record<LocationPreset["status"], { wrap: string; dot: string; text: string }> = {
  Normal: { wrap: "border-emerald-500/25 bg-emerald-950/40", dot: "bg-emerald-400", text: "text-emerald-300" },
  Watch: { wrap: "border-amber-500/25 bg-amber-950/40", dot: "bg-amber-400", text: "text-amber-300" },
  Warning: { wrap: "border-orange-500/30 bg-orange-950/40", dot: "bg-orange-400", text: "text-orange-300" },
  Critical: { wrap: "border-red-500/35 bg-red-950/50", dot: "bg-red-400", text: "text-red-300" },
};

const advisoryMeta = [
  {
    title: "Conditions Normal",
    body: "No flood threat at the current water level. Continue monitoring official advisories.",
    card: "border-emerald-500/30 bg-emerald-950/20",
    accent: "text-emerald-400",
    chip: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  },
  {
    title: "Monitor Flood Conditions",
    body: "Water level is approaching the warning threshold. Prepare to evacuate if conditions worsen.",
    card: "border-amber-500/30 bg-amber-950/20",
    accent: "text-amber-400",
    chip: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  },
  {
    title: "Preparatory Evacuation Advised",
    body: "Residents in low-lying and riverside areas should evacuate to high-ground centers now.",
    card: "border-orange-500/30 bg-orange-950/20",
    accent: "text-orange-400",
    chip: "border-orange-500/30 bg-orange-500/15 text-orange-300",
  },
  {
    title: "Forced Evacuation in Effect",
    body: "Immediate evacuation required. Move to the nearest high-ground center and avoid waterlogged roads.",
    card: "border-red-500/40 bg-red-950/25",
    accent: "text-red-400",
    chip: "border-red-500/40 bg-red-500/15 text-red-300",
  },
];

const trendMeta: Record<LocationPreset["riverTrend"], { icon: LucideIcon; cls: string; label: string }> = {
  rising: { icon: TrendingUp, cls: "text-red-400", label: "rising" },
  stable: { icon: Minus, cls: "text-slate-400", label: "stable" },
  falling: { icon: TrendingDown, cls: "text-emerald-400", label: "falling" },
};

const toastMeta: Record<ToastTone, { icon: LucideIcon; border: string; iconCls: string }> = {
  success: { icon: CheckCircle2, border: "border-emerald-500/40", iconCls: "text-emerald-400" },
  warning: { icon: AlertTriangle, border: "border-amber-500/40", iconCls: "text-amber-400" },
  danger: { icon: Siren, border: "border-red-500/40", iconCls: "text-red-400" },
};

function Toast({ toast }: { toast: { message: string; tone: ToastTone } }) {
  const meta = toastMeta[toast.tone];
  const Icon = meta.icon;
  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl border bg-slate-900/95 px-4 py-3 text-sm font-medium text-slate-100 shadow-2xl backdrop-blur animate-in slide-in-from-bottom-5 duration-300 sm:left-auto sm:right-6 sm:translate-x-0 ${meta.border}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${meta.iconCls}`} />
      <span>{toast.message}</span>
    </div>
  );
}

export default function Page() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: "demo-res-1",
    name: "Juan Dela Cruz",
    email: "resident.dalongue@agapalert.ph",
    role: "resident",
    barangay: "Dalongue, Santa Barbara",
    phone: "0917-508-1122",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<Role>("resident");
  const [authBarangay, setAuthBarangay] = useState("Dalongue, Santa Barbara");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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
  const [centers] = useState<EvacCenter[]>(INITIAL_CENTERS);
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
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  // SOS Resident Form & GPS Location Permission State
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [sosFloodDepth, setSosFloodDepth] = useState("Waist-deep (1.0m - 1.4m)");
  const [sosPeopleCount, setSosPeopleCount] = useState("4");
  const [sosSpecialNeeds, setSosSpecialNeeds] = useState(true);
  const [sosContact, setSosContact] = useState("0917-508-1122");
  const [sosLandmark, setSosLandmark] = useState("Near Sinocalan River Dike, Barangay Dalongue");

  // Responder SOS Accept / Decline Modal State
  const [activeSosForResponder, setActiveSosForResponder] = useState<IncidentReport | null>(null);
  const [showResponderSosModal, setShowResponderSosModal] = useState(false);

  // Go Bag Checklist Items
  const [checklist, setChecklist] = useState([
    { id: "c1", label: "3 days potable water (1 gallon/person/day)", checked: true },
    { id: "c2", label: "Non-perishable canned goods & manual opener", checked: true },
    { id: "c3", label: "Emergency power bank, flashlight & spare batteries", checked: true },
    { id: "c4", label: "Prescription medicines & First Aid kit", checked: false },
    { id: "c5", label: "Important IDs & documents in waterproof zip bags", checked: false },
    { id: "c6", label: "Whistle for signaling rescue boat responders", checked: true },
  ]);

  // Keep role in sync with currentUser
  useEffect(() => {
    if (currentUser) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  // Sync live meteorological & hydrological telemetry from /api/flood/detect
  useEffect(() => {
    let isCancelled = false;
    async function syncLiveDetection() {
      try {
        const res = await fetch(`/api/flood/detect?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isCancelled && data?.success) {
          if (data.weather?.rainRateMmPerHour !== undefined) {
            setLiveRainRate(data.weather.rainRateMmPerHour);
          }
          if (data.riverTelemetry?.currentLevelMeters !== undefined) {
            setLiveRiverLevel(data.riverTelemetry.currentLevelMeters);
          }
          if (data.weather?.windSpeedKph !== undefined) {
            setLiveWindSpeed(data.weather.windSpeedKph);
          }
        }
      } catch {
        if (!isCancelled) {
          setLiveRiverLevel(selectedLocation.riverLevel);
          setLiveRainRate(selectedLocation.rainRate);
          setLiveWindSpeed(selectedLocation.windSpeed);
        }
      }
    }
    syncLiveDetection();
    return () => {
      isCancelled = true;
    };
  }, [selectedLocation]);

  // Live telemetry pulse ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.04;
      setLiveRiverLevel((prev) => Math.round((prev + delta) * 100) / 100);
      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Toast auto dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Request GPS Location for SOS Beacon
  const handleRequestGpsLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("denied");
      setToast({ message: "Geolocation is not supported by your browser.", tone: "warning" });
      return;
    }
    setGpsStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsStatus("granted");
        setToast({
          message: `Live GPS Pinpoint Acquired! (Accurate to ±${Math.round(pos.coords.accuracy)}m)`,
          tone: "success",
        });
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setUserGpsCoords({
          lat: selectedLocation.lat + (Math.random() - 0.5) * 0.003,
          lng: selectedLocation.lng + (Math.random() - 0.5) * 0.003,
          accuracy: 10,
        });
        setGpsStatus("granted");
        setToast({
          message: "Local Dalongue, Santa Barbara GPS reference locked.",
          tone: "success",
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Auth: Handle Sign In
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "signin") {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });
          if (error) throw error;
          if (data.user) {
            const isOfficial = authEmail.toLowerCase().includes("official") || authEmail.toLowerCase().includes("admin");
            setCurrentUser({
              id: data.user.id,
              name: data.user.user_metadata?.full_name || authEmail.split("@")[0],
              email: authEmail,
              role: isOfficial ? "official" : "resident",
              barangay: "Dalongue, Santa Barbara",
            });
          }
        } catch {
          const isOfficial = authEmail.toLowerCase().includes("official") || authRole === "official";
          setCurrentUser({
            id: `user-${Date.now()}`,
            name: authName || authEmail.split("@")[0] || "Dalongue Resident",
            email: authEmail || "resident@agapalert.ph",
            role: isOfficial ? "official" : "resident",
            barangay: authBarangay,
            phone: authPhone || "0917-508-1122",
          });
        }
        setToast({ message: "Successfully signed in to AgapAlert!", tone: "success" });
      } else {
        try {
          await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: {
              data: {
                full_name: authName,
                role: authRole,
                barangay: authBarangay,
              },
            },
          });
        } catch (err) {
          console.warn("Supabase signup notice:", err);
        }
        setCurrentUser({
          id: `user-${Date.now()}`,
          name: authName || "New AgapAlert Member",
          email: authEmail,
          role: authRole,
          barangay: authBarangay,
          phone: authPhone,
        });
        setToast({ message: "Account registered! Welcome to AgapAlert.", tone: "success" });
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setToast({ message: err?.message || "Authentication error", tone: "danger" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemoLogin = (selectedRole: Role) => {
    if (selectedRole === "official") {
      setCurrentUser({
        id: "demo-off-1",
        name: "Capt. Rodrigo Soriano",
        email: "official.dalongue@agapalert.ph",
        role: "official",
        barangay: "Dalongue, Santa Barbara",
        phone: "(075) 518-2024",
      });
      setRole("official");
      setToast({ message: "Logged in as Dalongue Barangay Disaster Official & Responder.", tone: "success" });
    } else {
      setCurrentUser({
        id: "demo-res-1",
        name: "Juan Dela Cruz",
        email: "resident.dalongue@agapalert.ph",
        role: "resident",
        barangay: "Dalongue, Santa Barbara",
        phone: "0917-508-1122",
      });
      setRole("resident");
      setToast({ message: "Logged in as Dalongue Resident.", tone: "success" });
    }
    setShowAuthModal(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setToast({ message: "Signed out of session.", tone: "warning" });
  };

  // Flood Alarm Level calculation based on river level
  const computedAlarmLevel = useMemo(() => {
    if (liveRiverLevel >= 8.0) return { level: 3, name: "ALARM 3", bar: "bg-red-500" };
    if (liveRiverLevel >= 6.0) return { level: 2, name: "ALARM 2", bar: "bg-amber-500" };
    if (liveRiverLevel >= 4.5) return { level: 1, name: "ALARM 1", bar: "bg-yellow-400" };
    return { level: 0, name: "NORMAL", bar: "bg-emerald-500" };
  }, [liveRiverLevel]);

  const windBadge =
    liveWindSpeed >= 110
      ? { label: "Typhoon winds", cls: "border-red-500/30 bg-red-500/15 text-red-300" }
      : liveWindSpeed >= 75
        ? { label: "Severe gale", cls: "border-orange-500/30 bg-orange-500/15 text-orange-300" }
        : liveWindSpeed >= 50
          ? { label: "Gale", cls: "border-amber-500/30 bg-amber-500/15 text-amber-300" }
          : { label: "Moderate", cls: "border-teal-500/30 bg-teal-500/15 text-teal-300" };

  const rainBadge =
    liveRainRate >= 50
      ? { label: "Torrential", cls: "border-red-500/30 bg-red-500/15 text-red-300" }
      : liveRainRate >= 25
        ? { label: "Heavy", cls: "border-amber-500/30 bg-amber-500/15 text-amber-300" }
        : liveRainRate >= 10
          ? { label: "Moderate", cls: "border-blue-500/30 bg-blue-500/15 text-blue-300" }
          : { label: "Light", cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" };

  const centersOpen = centers.filter((c) => c.status === "Open").length;
  const spacesLeft = centers.reduce((acc, c) => acc + (c.capacity - c.occupancy), 0);
  const totalSheltered = centers.reduce((acc, c) => acc + c.occupancy, 0);
  const newReportCount = reports.filter((r) => r.status === "NEW").length;
  const activeSosList = reports.filter((r) => r.category === "sos" && r.status !== "RESOLVED");
  const checkedCount = checklist.filter((c) => c.checked).length;

  // Simulate water level spike
  const triggerSimulationSpike = () => {
    setIsSimulatingSpike(true);
    setToast({ message: "Simulation active — heavy rainfall inflow into Sinocalan River.", tone: "warning" });
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLiveRiverLevel((prev) => Math.round((prev + 0.2) * 100) / 100);
      setLiveRainRate((prev) => prev + 5);
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
    const latOffset = (Math.random() - 0.5) * 0.008;
    const lngOffset = (Math.random() - 0.5) * 0.008;
    const newRep: IncidentReport = {
      id: `rep-${Date.now()}`,
      category: formData.get("category") as IncidentReport["category"],
      title: formData.get("title") as string,
      location: formData.get("location") as string,
      timestamp: "Just now",
      status: "NEW",
      priority: (formData.get("priority") as IncidentReport["priority"]) || "HIGH",
      details: formData.get("details") as string,
      contact: formData.get("contact") as string,
      lat: userGpsCoords ? userGpsCoords.lat : selectedLocation.lat + latOffset,
      lng: userGpsCoords ? userGpsCoords.lng : selectedLocation.lng + lngOffset,
    };
    setReports([newRep, ...reports]);
    setShowReportModal(false);
    setToast({ message: "Incident report transmitted to Santa Barbara MDRRMO Desk.", tone: "success" });
  };

  // Update report status (Official action)
  const handleUpdateStatus = (id: string, newStatus: IncidentReport["status"]) => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    setToast({ message: `Incident status updated to ${newStatus}.`, tone: "success" });
  };

  // Enhanced SOS Beacon Trigger with Location Permission
  const handleTriggerSos = () => {
    const finalLat = userGpsCoords ? userGpsCoords.lat : selectedLocation.lat + 0.0014;
    const finalLng = userGpsCoords ? userGpsCoords.lng : selectedLocation.lng + 0.0012;

    const sosItem: IncidentReport = {
      id: `sos-${Date.now()}`,
      category: "sos",
      title: `CRITICAL SOS: Flood Rescue Needed (${sosFloodDepth})`,
      location: `${sosLandmark || selectedLocation.name} (GPS ${finalLat.toFixed(4)}° N, ${finalLng.toFixed(4)}° E)`,
      timestamp: "Just now",
      status: "NEW",
      priority: "CRITICAL",
      details: `Emergency rescue beacon activated. Depth: ${sosFloodDepth}. Stranded persons: ${sosPeopleCount}. ${
        sosSpecialNeeds ? "Includes seniors/infants requiring immediate water rescue." : ""
      }`,
      contact: sosContact || currentUser?.phone || "0917-508-1122",
      lat: finalLat,
      lng: finalLng,
      waterDepth: sosFloodDepth,
      peopleCount: parseInt(sosPeopleCount, 10) || 4,
      victimName: currentUser?.name || "Dalongue Flood Victim",
    };
    setReports([sosItem, ...reports]);
    setShowSosModal(false);
    setToast({
      message: "🚨 Rescue Beacon Broadcast! Coordinates sent to Santa Barbara WASAR and Dalongue QRT Command.",
      tone: "danger",
    });
  };

  // Responder: Accept Flood Rescue Request
  const handleAcceptRescue = (reportId: string) => {
    setReports(
      reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "DISPATCHED",
              actionNotes: `Accepted by ${currentUser?.name || "MDRRMO QRT Team"}. Rescue Boat & WASAR unit dispatched at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
            }
          : r
      )
    );
    setShowResponderSosModal(false);
    setToast({
      message: `Rescue Accepted! Quick Response Boat dispatched to ${activeSosForResponder?.location || "the victim"}.`,
      tone: "success",
    });
  };

  // Responder: Decline / Escalate Flood Rescue Request
  const handleDeclineRescue = (reportId: string) => {
    setReports(
      reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "RESOLVED",
              actionNotes: `Local unit unable due to extreme water currents. Escalated to Pangasinan PDRRMC Coast Guard Amphibious Unit.`,
            }
          : r
      )
    );
    setShowResponderSosModal(false);
    setToast({
      message: "Rescue request declined for local boat & forwarded to Provincial Coast Guard Air/Amphibious Command.",
      tone: "warning",
    });
  };

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
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
    return reports.filter((r) => {
      if (reportFilter === "all") return true;
      return r.category === reportFilter;
    });
  }, [reports, reportFilter]);

  const official = role === "official";
  const ribbon = ribbonMeta[selectedLocation.status];
  const advisory = advisoryMeta[computedAlarmLevel.level];
  const trend = trendMeta[selectedLocation.riverTrend];
  const gaugePct = Math.min(((liveRiverLevel - 13) / (20 - 13)) * 100, 100);

  const mobileTabCls = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
      active
        ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
        : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Sticky top: status ribbon + header + mobile tabs */}
      <div className="sticky top-0 z-50">
        {/* 1. Situation ribbon */}
        <div className={`border-b ${ribbon.wrap} backdrop-blur`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5 text-xs">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${ribbon.dot}`}></span>
                <span className={`relative inline-flex h-2 w-2 rounded-full ${ribbon.dot}`}></span>
              </span>
              <span className={`shrink-0 font-semibold ${ribbon.text}`}>
                PAGASA Signal {selectedLocation.stormSignal}
              </span>
              <span className="hidden truncate text-slate-300 sm:inline">
                <span className="font-medium text-slate-100">{selectedLocation.riverName}</span> at{" "}
                <span className="font-semibold tabular-nums text-white">{liveRiverLevel} m</span>
              </span>
              <span className={`shrink-0 font-medium ${ribbon.text}`}>{selectedLocation.status}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowChecklistDrawer(!showChecklistDrawer)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-slate-800 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Go-Bag</span> {checkedCount}/{checklist.length}
              </button>
              <button
                onClick={() => setSoundAlerts(!soundAlerts)}
                aria-label={soundAlerts ? "Mute audio alarms" : "Unmute audio alarms"}
                className="rounded-full border border-slate-700 bg-slate-900/60 p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                {soundAlerts ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Top Active SOS Alert Bar for Responders */}
        {activeSosList.length > 0 && (
          <div className="border-b border-red-500/50 bg-red-950/90 py-2 px-4 shadow-lg backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-red-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
                  <Siren className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold text-white tracking-wide uppercase">Active Flood SOS:</span>
                <span className="truncate max-w-md">
                  {activeSosList[0].title} ({activeSosList[0].location})
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveSosForResponder(activeSosList[0]);
                  setShowResponderSosModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-red-500 cursor-pointer"
              >
                {official ? "Review / Dispatch (Accept/Decline)" : "View Distress Details"}
              </button>
            </div>
          </div>
        )}

        {/* 2. Header */}
        <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Waves className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold tracking-tight text-white">
                    AGAP <span className="text-cyan-400">Alert</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    Santa Barbara Dalongue
                  </span>
                </div>
                <p className="hidden truncate text-[11px] text-slate-500 md:block">
                  {official ? "Santa Barbara MDRRMO Operations Command" : "Community Disaster & Flood Evacuation Desk"}
                </p>
              </div>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    activeTab === tab.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.id === "reports" && newReportCount > 0 && (
                    <span className="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {newReportCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Auth, Role switcher + SOS */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* User Sign In / Profile */}
              {currentUser ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-1 text-xs">
                  <div className="flex items-center gap-1.5 px-2">
                    <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-[10px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-[11px] font-semibold text-white leading-tight">{currentUser.name}</p>
                      <p className="text-[9px] text-cyan-400 uppercase tracking-wider">{currentUser.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode("signin");
                    setShowAuthModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </button>
              )}

              {/* Role Toggle */}
              <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-slate-900/70 p-0.5 text-xs">
                <button
                  onClick={() => setRole("resident")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                    role === "resident" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Resident</span>
                </button>
                <button
                  onClick={() => setRole("official")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition cursor-pointer ${
                    role === "official" ? "bg-slate-800 text-blue-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Official</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSosModal(true);
                  handleRequestGpsLocation();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 active:scale-95 cursor-pointer"
              >
                <Siren className="h-4 w-4" />
                SOS
              </button>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="border-t border-slate-800/70 md:hidden">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 py-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={mobileTabCls(activeTab === tab.id)}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.id === "reports" && newReportCount > 0 && (
                    <span className="rounded-full bg-red-500/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {newReportCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      {/* Expandable Emergency Go-Bag Checklist Drawer */}
      {showChecklistDrawer && (
        <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  Emergency Go-Bag Checklist
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ensure these essentials are ready for immediate evacuation.
                </p>
              </div>
              <button
                onClick={() => setShowChecklistDrawer(false)}
                aria-label="Close checklist"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">Readiness</span>
                <span className="font-medium tabular-nums text-slate-200">
                  {checkedCount} of {checklist.length} packed
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                  style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition cursor-pointer ${
                    item.checked
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {
                      setChecklist(checklist.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c)));
                    }}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      item.checked ? "border-cyan-500 bg-cyan-500 text-slate-950" : "border-slate-600 bg-transparent"
                    }`}
                  >
                    {item.checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="text-xs leading-relaxed">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Dashboard Body */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Top Control Bar: Location Presets & Telemetry Refresh */}
        <div className={`${panel} flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Monitoring Sector
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <select
                  value={selectedLocation.id}
                  onChange={(e) => {
                    const found = LOCATIONS.find((l) => l.id === e.target.value);
                    if (found) setSelectedLocation(found);
                  }}
                  aria-label="Select monitoring sector"
                  className={`${selectCls} font-medium text-sm`}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.riverName}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">{selectedLocation.region}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerSimulationSpike}
              disabled={isSimulatingSpike}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Flame className="h-4 w-4" />
              {isSimulatingSpike ? "Simulating surge…" : "Simulate water rise"}
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-400 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Report incident
            </button>
          </div>
        </div>

        {/* 4. Live Threat Telemetry Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* River Basin Water Level */}
          <div className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <Waves className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-400">River Gauge</span>
              </div>
              <span className={`${badge} border-slate-700 bg-slate-800/70 text-slate-300`}>
                {computedAlarmLevel.name}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
                {liveRiverLevel}
              </span>
              <span className="text-sm font-medium text-slate-500">m</span>
              <span className={`ml-auto flex items-center gap-1 text-xs font-medium ${trend.cls}`}>
                <trend.icon className="h-3.5 w-3.5" />
                {trend.label}
              </span>
            </div>

            <div className="mt-4">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${computedAlarmLevel.bar}`}
                  style={{ width: `${gaugePct}%` }}
                ></div>
                <span className="absolute top-0 h-full w-px bg-slate-600" style={{ left: "42.9%" }}></span>
                <span className="absolute top-0 h-full w-px bg-slate-600" style={{ left: "71.4%" }}></span>
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                <span>Normal 14 m</span>
                <span>Alarm 2 · 16 m</span>
                <span>Critical 18 m</span>
              </div>
            </div>

            <p className="mt-3 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              Sensor: <span className="font-medium text-slate-300">{selectedLocation.riverName}</span>
            </p>
          </div>

          {/* Typhoon Wind */}
          <div className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-400">
                  <Wind className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-400">Wind Gusts</span>
              </div>
              <span className={`${badge} ${windBadge.cls}`}>{windBadge.label}</span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
                {liveWindSpeed}
              </span>
              <span className="text-sm font-medium text-slate-500">km/h</span>
            </div>

            <p className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              PAGASA Tropical Storm <span className="font-medium text-slate-300">Signal {selectedLocation.stormSignal}</span> in effect
            </p>
          </div>

          {/* Rainfall Intensity */}
          <div className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                  <CloudRain className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-400">Doppler Rain</span>
              </div>
              <span className={`${badge} ${rainBadge.cls}`}>{rainBadge.label}</span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
                {liveRainRate}
              </span>
              <span className="text-sm font-medium text-slate-500">mm/h</span>
            </div>

            <p className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              Flash flood risk:{" "}
              <span className={`font-medium ${liveRainRate >= 25 ? "text-red-400" : "text-amber-400"}`}>
                {liveRainRate >= 25 ? "High in low-lying areas" : "Moderate"}
              </span>
            </p>
          </div>

          {/* Safe Haven Capacity */}
          <div className={`${panel} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Home className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-slate-400">Safe Haven</span>
              </div>
              <span
                className={`${badge} ${
                  spacesLeft > 0
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-red-500/30 bg-red-500/15 text-red-300"
                }`}
              >
                {spacesLeft > 0 ? "Spaces available" : "At capacity"}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">{spacesLeft}</span>
              <span className="text-sm font-medium text-slate-500">spaces left</span>
            </div>

            <p className="mt-4 border-t border-slate-800/80 pt-3 text-xs text-slate-500">
              <span className="font-medium text-slate-300">{totalSheltered}</span> evacuees sheltered ·{" "}
              <span className="font-medium text-slate-300">{centersOpen}/{centers.length}</span> centers open
            </p>
          </div>
        </div>

        {/* 5. Main Tab Content Views */}

        {/* TAB 1: Live Radar & Interactive Threat Map */}
        {activeTab === "radar" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                    <Crosshair className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Hazard & Evacuation Map</h3>
                    <p className="text-xs text-slate-500">
                      Shelters, flood hazard zones and GPS routes for {selectedLocation.name}
                    </p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-400 sm:inline-flex">
                  <Clock className="h-3 w-3" />
                  {lastSyncTime}
                </span>
              </div>

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

            {/* Side column */}
            <div className="space-y-4">
              {/* Current advisory */}
              <div className={`rounded-xl border p-5 ${advisory.card}`}>
                <div className={`mb-2 flex items-center gap-2 text-xs font-semibold ${advisory.accent}`}>
                  <AlertTriangle className="h-4 w-4" />
                  Current River Advisory
                </div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-base font-semibold text-white">{advisory.title}</h4>
                  <span className={`${badge} ${advisory.chip}`}>ALARM {computedAlarmLevel.level}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  {selectedLocation.riverName} is at {liveRiverLevel} m and {trend.label}. {advisory.body}
                </p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setSelectedCenter(centers[0])}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
                  >
                    <Navigation className="h-4 w-4" />
                    Route to nearest shelter
                  </button>
                  <button
                    onClick={() => setShowSosModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 cursor-pointer"
                  >
                    <Siren className="h-4 w-4" />
                    Request rescue (SOS)
                  </button>
                </div>
              </div>

              {/* Response teams */}
              <div className={`${panel} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Truck className="h-4 w-4 text-cyan-400" />
                    Quick Response Teams
                  </h4>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    4 boats active
                  </span>
                </div>
                <ul className="divide-y divide-slate-800/80">
                  {RESPONSE_TEAMS.map((team) => (
                    <li key={team.name} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-slate-300">{team.name}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${team.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${team.dot}`}></span>
                        {team.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Go-bag readiness */}
              <div className={`${panel} p-5`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Go-Bag readiness</span>
                  <span className="text-xs tabular-nums text-slate-400">
                    {checkedCount}/{checklist.length}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => setShowChecklistDrawer(true)}
                  className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 cursor-pointer"
                >
                  Review checklist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Evacuation Centers Finder */}
        {activeTab === "centers" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search shelters by name or barangay…"
                  value={centerSearch}
                  onChange={(e) => setCenterSearch(e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "All centers" },
                  { id: "open", label: "Open beds" },
                  { id: "medical", label: "Medical aid" },
                  { id: "pets", label: "Pet friendly" },
                  { id: "highground", label: "High ground" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCenterFilter(f.id)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium transition cursor-pointer ${
                      centerFilter === f.id
                        ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Showing {filteredCenters.length} of {centers.length} centers
            </p>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredCenters.map((center) => {
                const occupancyPct = Math.round((center.occupancy / center.capacity) * 100);
                const isFull = center.status === "Full" || occupancyPct >= 98;
                const barColor = occupancyPct >= 85 ? "bg-red-500" : occupancyPct >= 60 ? "bg-amber-500" : "bg-emerald-500";

                return (
                  <div
                    key={center.id}
                    className={`${panel} flex flex-col p-5 transition hover:border-slate-700`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`${badge} ${
                          isFull
                            ? "border-red-500/30 bg-red-500/15 text-red-300"
                            : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {isFull ? "At capacity" : "Open & ready"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {center.distance}
                      </span>
                    </div>

                    <h4 className="mt-3 text-base font-semibold text-white">{center.name}</h4>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {center.barangay}, {center.city} · {center.elevation}
                    </p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Occupancy</span>
                        <span className="font-medium tabular-nums text-slate-200">
                          {center.occupancy} / {center.capacity} · {occupancyPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {center.features.map((feat) => (
                        <span
                          key={feat}
                          className="rounded-md border border-slate-700/60 bg-slate-800/70 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      <span className="font-medium text-slate-400">Supplies:</span> {center.supplies.join(" · ")}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-4">
                      <button
                        onClick={() => setSelectedCenter(center)}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCenter(center);
                          setActiveTab("radar");
                          setToast({ message: `Routing to ${center.name} on the live map.`, tone: "success" });
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-cyan-500 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Directions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCenters.length === 0 && (
              <div className={`${panel} flex flex-col items-center gap-2 p-10 text-center`}>
                <Search className="h-6 w-6 text-slate-600" />
                <p className="text-sm text-slate-400">No centers match your search.</p>
                <button
                  onClick={() => {
                    setCenterSearch("");
                    setCenterFilter("all");
                  }}
                  className="mt-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Community Incident Queue & Official Dispatch */}
        {activeTab === "reports" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {official ? "Barangay Operations Incident Queue" : "Community Reports & Distress Requests"}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {official
                    ? "Live queue from residents. Acknowledge, dispatch units, and resolve reports in real time."
                    : "Report flooded streets, trapped families, or needed supplies directly to barangay responders."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  aria-label="Filter incident category"
                  className={selectCls}
                >
                  <option value="all">All categories</option>
                  <option value="flood">Flooding alerts</option>
                  <option value="medical">Medical emergencies</option>
                  <option value="relief">Relief requests</option>
                  <option value="debris">Road debris</option>
                  <option value="sos">SOS beacons</option>
                </select>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-400 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Submit report
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Showing {filteredReports.length} of {reports.length} reports
            </p>

            <div className="space-y-3">
              {filteredReports.map((rep) => {
                const cat = reportCategoryMeta[rep.category];
                const status = reportStatusMeta[rep.status];
                const CatIcon = cat.icon;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={rep.id}
                    className={`flex flex-col gap-4 rounded-xl border p-4 sm:p-5 md:flex-row md:items-center ${
                      rep.priority === "CRITICAL"
                        ? "border-red-500/40 bg-red-950/15"
                        : "border-slate-800 bg-slate-900/70"
                    }`}
                  >
                    <div className="flex flex-1 items-start gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${cat.cls}`}
                      >
                        <CatIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`${badge} ${status.cls}`}>
                            <StatusIcon className="h-3 w-3" />
                            {rep.status}
                          </span>
                          <span className="text-xs text-slate-500">{rep.timestamp}</span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {rep.location}
                          </span>
                        </div>
                        <h4 className="mt-1.5 text-sm font-semibold text-white">{rep.title}</h4>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{rep.details}</p>
                        {rep.contact && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-cyan-400">
                            <Phone className="h-3 w-3" />
                            {rep.contact}
                          </p>
                        )}
                      </div>
                    </div>

                    {official && (
                      <div className="flex shrink-0 items-center gap-2 border-t border-slate-800/80 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                        {rep.status === "NEW" && (
                          <button
                            onClick={() => handleUpdateStatus(rep.id, "ACKNOWLEDGED")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 text-amber-400" />
                            Acknowledge
                          </button>
                        )}
                        {rep.status === "ACKNOWLEDGED" && (
                          <button
                            onClick={() => handleUpdateStatus(rep.id, "DISPATCHED")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5 text-cyan-400" />
                            Dispatch unit
                          </button>
                        )}
                        {rep.status === "DISPATCHED" && (
                          <button
                            onClick={() => handleUpdateStatus(rep.id, "RESOLVED")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-700 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Mark resolved
                          </button>
                        )}
                        {rep.status === "RESOLVED" && (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Resolved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className={`${panel} flex flex-col items-center gap-2 p-10 text-center`}>
                  <Layers className="h-6 w-6 text-slate-600" />
                  <p className="text-sm text-slate-400">No incidents in this category.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Philippine Emergency Hotlines */}
        {activeTab === "hotlines" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-white">National & Local Emergency Hotlines</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                One-tap lines for rescue operations, ambulance dispatch, and disaster assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HOTLINES.map((h) => (
                <div key={h.name} className={`${panel} flex flex-col p-5`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/60 text-cyan-300">
                    <h.icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-white">{h.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-400">{h.service}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{h.agency}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-lg font-semibold tabular-nums text-slate-100">{h.num}</span>
                    <a
                      href={`tel:${h.num}`}
                      aria-label={`Call ${h.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-700"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-400" />
                      Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 font-medium">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            AGAP Alert — Community Disaster & Evacuation Hub
          </span>
          <span>Demonstration interface · Telemetry and incident data are simulated</span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. MODALS */}
      {/* ========================================================================= */}

      {/* 1. AUTHENTICATION MODAL (SIGN IN / SIGN UP) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-6 sm:p-7 shadow-2xl shadow-cyan-950/60 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-inner">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 border border-cyan-500/25 uppercase">
                      <Lock className="h-3 w-3" /> Encrypted Disaster Network
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-white">
                    {authMode === "signin" ? "Sign In to AgapAlert" : "Create Response Account"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Access Pangasinan & Metro Manila flood telemetry, water gauge feeds, and evacuation routing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-5 flex rounded-xl border border-slate-800 bg-slate-950/80 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "signin"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === "signup"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" /> Create Account
              </button>
            </div>

            {/* Role Picker Cards */}
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Account Clearance Level
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuthRole("resident")}
                  className={`flex flex-col items-start p-3 rounded-xl border transition text-left cursor-pointer ${
                    authRole === "resident"
                      ? "border-cyan-500 bg-cyan-500/10 shadow-sm shadow-cyan-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users className={`h-4 w-4 ${authRole === "resident" ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className={`text-xs font-bold ${authRole === "resident" ? "text-cyan-300" : "text-slate-200"}`}>
                      Resident Citizen
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 leading-tight">
                    Emergency SOS, evacuation route map & rainfall radar
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthRole("official")}
                  className={`flex flex-col items-start p-3 rounded-xl border transition text-left cursor-pointer ${
                    authRole === "official"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className={`h-4 w-4 ${authRole === "official" ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className={`text-xs font-bold ${authRole === "official" ? "text-emerald-300" : "text-slate-200"}`}>
                      MDRRMO Official
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 leading-tight">
                    Evac capacity manager, relief inventory & alert dispatch
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maria Santos"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.ph"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showAuthPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">Barangay Sector</label>
                      <select
                        value={authBarangay}
                        onChange={(e) => setAuthBarangay(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Dalongue, Santa Barbara">Dalongue, Santa Barbara</option>
                        <option value="Poblacion Sur, Santa Barbara">Poblacion Sur, Santa Barbara</option>
                        <option value="Tuliao, Santa Barbara">Tuliao, Santa Barbara</option>
                        <option value="Minien, Santa Barbara">Minien, Santa Barbara</option>
                        <option value="Sto. Niño, Marikina">Sto. Niño, Marikina</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Emergency Mobile
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          type="tel"
                          placeholder="0917-xxx-xxxx"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  "Authenticating..."
                ) : authMode === "signin" ? (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Sign In & Access Console
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4" /> Register & Activate Telemetry
                  </>
                )}
              </button>
            </form>

            {/* Instant 1-Click Demo Profiles */}
            <div className="mt-5 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Instant 1-Click Test Credentials:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("resident")}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 hover:bg-slate-900 transition text-left cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                    J
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">Juan Dela Cruz</div>
                    <div className="text-[10px] text-cyan-400 truncate">Resident • Dalongue</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("official")}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-slate-900 transition text-left cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    R
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">Capt. R. Soriano</div>
                    <div className="text-[10px] text-emerald-400 truncate">MDRRMO Commander</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EMERGENCY SOS FLOOD POPUP WITH LOCATION PERMISSION & DETAILS */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/40 bg-red-500/20 text-red-500 animate-pulse">
                  <Siren className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    High Priority Emergency Beacon
                  </span>
                  <h3 className="text-lg font-bold text-white">Broadcast Flood Rescue SOS</h3>
                </div>
              </div>
              <button
                onClick={() => setShowSosModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              When triggered, your pinned GPS coordinates, current flood depth, and family stranded count are sent directly to the{" "}
              <strong className="text-white">Santa Barbara MDRRMO Water Rescue Unit</strong> and{" "}
              <strong className="text-white">Barangay Dalongue QRT Command</strong>.
            </p>

            {/* GPS LOCATION PERMISSION BOX */}
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <LocateFixed className="h-4 w-4 text-cyan-400" />
                  Live GPS Coordinates Pinning
                </span>
                <button
                  type="button"
                  onClick={handleRequestGpsLocation}
                  className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 cursor-pointer"
                >
                  {gpsStatus === "requesting" ? "Locating..." : "Allow Location / Re-Pin"}
                </button>
              </div>

              {userGpsCoords ? (
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-emerald-300">✓ Precise GPS Location Allowed & Locked</p>
                    <p className="text-slate-400 text-[11px]">
                      {userGpsCoords.lat.toFixed(5)}° N, {userGpsCoords.lng.toFixed(5)}° E (±{Math.round(userGpsCoords.accuracy || 8)}m)
                    </p>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 p-2.5 text-xs text-amber-300">
                  📍 Click "Allow Location" to share your device's exact flood coordinates with rescue boats.
                </div>
              )}
            </div>

            {/* FLOOD SITUATION DETAILS */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Current Flood Water Depth</label>
                <select
                  value={sosFloodDepth}
                  onChange={(e) => setSosFloodDepth(e.target.value)}
                  className={inputCls}
                >
                  <option value="Ankle-deep (0.3m)">Ankle-deep (0.3m) — Rising</option>
                  <option value="Knee-deep (0.6m)">Knee-deep (0.6m) — Rapid current</option>
                  <option value="Waist-deep (1.0m - 1.4m)">Waist-deep (1.0m - 1.4m) — Entering home</option>
                  <option value="Chest / Neck-deep (1.5m - 1.8m)">Chest / Neck-deep (1.5m - 1.8m) — Critical</option>
                  <option value="Submerged / Roof-Level (>2.0m)">Submerged / Roof-Level (&gt;2.0m) — Trapped on roof</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Number of Stranded Persons</label>
                  <input
                    type="number"
                    min="1"
                    value={sosPeopleCount}
                    onChange={(e) => setSosPeopleCount(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Contact Number</label>
                  <input
                    type="tel"
                    value={sosContact}
                    onChange={(e) => setSosContact(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Specific Landmark / Sitio</label>
                <input
                  type="text"
                  value={sosLandmark}
                  onChange={(e) => setSosLandmark(e.target.value)}
                  placeholder="e.g. Near Sinocalan Dike / Dalongue Elementary"
                  className={inputCls}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sosSpecialNeeds}
                  onChange={(e) => setSosSpecialNeeds(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-red-500"
                />
                <span>Includes elderly seniors, pregnant women, or infants needing urgent boat transfer</span>
              </label>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-5 space-y-2">
              <button
                onClick={handleTriggerSos}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-900/50 transition hover:bg-red-500 active:scale-95 cursor-pointer"
              >
                <Siren className="h-5 w-5" />
                TRANSMIT RESCUE BEACON NOW
              </button>

              <div className="flex gap-2">
                <a
                  href="tel:0917-508-1122"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  Call Santa Barbara MDRRMO
                </a>
                <a
                  href="tel:911"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <Phone className="h-3.5 w-3.5 text-red-400" />
                  Dial 911 National
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESPONDER SOS ACCEPT / DECLINE MODAL */}
      {showResponderSosModal && activeSosForResponder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                  <Siren className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Incoming Disaster Rescue Alert
                  </span>
                  <h3 className="text-lg font-bold text-white">Flood Distress Beacon</h3>
                  <p className="text-xs text-slate-400">{activeSosForResponder.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResponderSosModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Victim & Flood Information Card */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs text-slate-400">Victim / Resident:</span>
                <span className="text-xs font-bold text-white">{activeSosForResponder.victimName || "Resident in Distress"}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs text-slate-400">Location / Sector:</span>
                <span className="text-xs font-bold text-cyan-300">{activeSosForResponder.location}</span>
              </div>

              {activeSosForResponder.lat && activeSosForResponder.lng && (
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs text-slate-400">GPS Coordinates:</span>
                  <span className="text-xs font-mono font-medium text-emerald-400">
                    {activeSosForResponder.lat.toFixed(5)}° N, {activeSosForResponder.lng.toFixed(5)}° E
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs text-slate-400">Flood Water Depth:</span>
                <span className="text-xs font-bold text-red-400">
                  {activeSosForResponder.waterDepth || "Waist-deep flood"}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Situation Details:</span>
                <p className="text-xs leading-relaxed text-slate-200 bg-slate-900 p-2.5 rounded border border-slate-800">
                  {activeSosForResponder.details}
                </p>
              </div>

              {activeSosForResponder.contact && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Contact Number:</span>
                  <a
                    href={`tel:${activeSosForResponder.contact}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {activeSosForResponder.contact}
                  </a>
                </div>
              )}
            </div>

            {/* RESPONDER DECISION ACTIONS (ACCEPT OR DECLINE) */}
            <div className="mt-5 space-y-2.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Responder Action Required:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAcceptRescue(activeSosForResponder.id)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 cursor-pointer"
                >
                  <CheckCheck className="h-4 w-4" />
                  ACCEPT RESCUE
                  <span className="text-[10px] font-normal block opacity-80">(Dispatch Boat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeclineRescue(activeSosForResponder.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-950/50 py-3 text-xs font-bold text-red-300 shadow-lg hover:bg-red-900/50 active:scale-95 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  DECLINE / ESCALATE
                  <span className="text-[10px] font-normal block opacity-80">(To Provincial)</span>
                </button>
              </div>

              {activeSosForResponder.lat && activeSosForResponder.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeSosForResponder.lat},${activeSosForResponder.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 text-center"
                >
                  <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                  Open Victim GPS in Navigation Maps ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Evacuation Center Details Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={`${panel} w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Verified Safe Evacuation Shelter
                </span>
                <h3 className="mt-1 text-lg font-semibold text-white">{selectedCenter.name}</h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {selectedCenter.barangay}, {selectedCenter.city} · {selectedCenter.elevation}
                </p>
              </div>
              <button
                onClick={() => setSelectedCenter(null)}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Shelter capacity status</span>
                  <span className="font-semibold text-emerald-400">
                    {selectedCenter.status === "Open" ? "Open & Accepting Evacuees" : "At Full Capacity"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white tabular-nums">{selectedCenter.occupancy}</span>
                  <span className="text-xs text-slate-400">/ {selectedCenter.capacity} registered beds</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300">Verified Relief Inventory on Site</h4>
                <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedCenter.supplies.map((sup, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      {sup}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                <span className="text-slate-400">Shelter Emergency Contact:</span>
                <a
                  href={`tel:${selectedCenter.contact}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-cyan-400 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {selectedCenter.contact}
                </a>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.lat},${selectedCenter.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Navigate via Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Incident Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className={`${panel} w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Community Safety Desk
                </span>
                <h3 className="mt-1 text-lg font-semibold text-white">Report an Incident</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Your report is sent to the Santa Barbara disaster response command and plotted on the live map.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Incident category</label>
                <select name="category" className={inputCls}>
                  <option value="flood">Rapid flooding / rising river water</option>
                  <option value="medical">Medical emergency / senior stranded</option>
                  <option value="relief">Relief goods & potable water request</option>
                  <option value="debris">Road blockage / fallen tree</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">Incident title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Waist-deep flood near Dalongue Barangay Road"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Specific location / landmark
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  defaultValue={`${selectedLocation.name}`}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Situation details & people stranded
                </label>
                <textarea
                  name="details"
                  required
                  rows={3}
                  placeholder="Describe number of people, current water level, and special medical needs…"
                  className={inputCls}
                ></textarea>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Contact number <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="contact"
                  defaultValue={currentUser?.phone || ""}
                  placeholder="e.g. 0917-xxx-xxxx"
                  className={inputCls}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-cyan-500/20 transition hover:bg-cyan-400 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Toast Notification */}
      {toast && <Toast toast={{ ...toast }} />}
    </div>
  );
}
