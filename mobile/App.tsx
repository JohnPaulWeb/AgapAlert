import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  HeartHandshake,
  Home,
  Info,
  Layers,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sliders,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  ActivityIndicator,
} from "react-native";
import {
  setupNotificationHandler,
  requestNotificationPermissions,
} from "./notifications";

import MobileGoogleMap, {
  MobileMapCenter,
  MobileMapIncident,
  MobileMapLocationPreset,
} from "./components/MobileGoogleMap";

// Unified Dark Disaster Palette matching Web Command Center
const C = {
  bgPrimary: "#070F1E",
  bgSurface: "#0D1829",
  bgCard: "#11223A",
  border: "#1E293B",
  borderLight: "#334155",
  cyan: "#06B6D4",
  cyanGlow: "rgba(6, 182, 212, 0.2)",
  teal: "#14B8A6",
  tealPale: "rgba(20, 184, 166, 0.15)",
  red: "#EF4444",
  redPale: "rgba(239, 68, 68, 0.15)",
  redBorder: "rgba(239, 68, 68, 0.35)",
  amber: "#F59E0B",
  amberPale: "rgba(245, 158, 11, 0.15)",
  green: "#10B981",
  greenPale: "rgba(16, 185, 129, 0.15)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  white: "#FFFFFF",
};

export type Role = "resident" | "official";
export type Screen = "radar" | "centers" | "reports" | "settings";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  barangay: string;
  phone?: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  region: string;
  riverName: string;
  riverLevel: number;
  stormSignal: number;
  windSpeed: number;
  rainRate: number;
  status: "Normal" | "Watch" | "Warning" | "Critical";
  lat: number;
  lng: number;
}

// Focused default location: Dalongue, Santa Barbara, Pangasinan (Sinocalan River)
export const LOCATIONS: LocationPreset[] = [
  {
    id: "dalongue",
    name: "Dalongue, Santa Barbara",
    region: "Pangasinan",
    riverName: "Sinocalan River",
    riverLevel: 5.82,
    stormSignal: 2,
    windSpeed: 65,
    rainRate: 35,
    status: "Warning",
    lat: 16.0034,
    lng: 120.3850,
  },
  {
    id: "poblacion_sb",
    name: "Poblacion Sur, Santa Barbara",
    region: "Pangasinan",
    riverName: "Sinocalan River",
    riverLevel: 5.82,
    stormSignal: 2,
    windSpeed: 65,
    rainRate: 35,
    status: "Warning",
    lat: 15.9985,
    lng: 120.4010,
  },
  {
    id: "marikina",
    name: "Marikina City",
    region: "Eastern Metro Manila",
    riverName: "Marikina River",
    riverLevel: 16.4,
    stormSignal: 3,
    windSpeed: 88,
    rainRate: 28,
    status: "Warning",
    lat: 14.6507,
    lng: 121.1029,
  },
  {
    id: "pasig",
    name: "Pasig City",
    region: "Metro Manila Delta",
    riverName: "Pasig Floodway",
    riverLevel: 15.6,
    stormSignal: 3,
    windSpeed: 75,
    rainRate: 22,
    status: "Warning",
    lat: 14.5764,
    lng: 121.0851,
  },
  {
    id: "cagayan",
    name: "Tuguegarao, Cagayan",
    region: "Cagayan Valley",
    riverName: "Cagayan River Basin",
    riverLevel: 18.9,
    stormSignal: 4,
    windSpeed: 140,
    rainRate: 45,
    status: "Critical",
    lat: 17.6132,
    lng: 121.7270,
  },
];

export interface EvacCenter {
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

export const INITIAL_CENTERS: EvacCenter[] = [
  {
    id: "c-dalongue",
    name: "Dalongue Barangay Hall & Covered Court",
    barangay: "Dalongue",
    city: "Santa Barbara, Pangasinan",
    distance: "0.3 km",
    status: "Open",
    occupancy: 45,
    capacity: 180,
    supplies: ["Clean Water", "Ready-to-Eat Rice", "Hygiene Packs", "First Aid Station"],
    features: ["Medical Aid", "High Ground", "Generator Power"],
    contact: "(075) 518-2024",
    elevation: "18m High Ground",
    lat: 16.0045,
    lng: 120.3862,
  },
  {
    id: "c-sb-gym",
    name: "Santa Barbara Central Elementary Gym",
    barangay: "Poblacion Norte",
    city: "Santa Barbara, Pangasinan",
    distance: "1.2 km",
    status: "Open",
    occupancy: 120,
    capacity: 350,
    supplies: ["Potable Water", "Hot Meals", "Thermal Blankets", "Infant Care"],
    features: ["Medical Aid", "Pet Friendly", "Solar Power Backup"],
    contact: "0917-555-4321",
    elevation: "22m High Ground",
    lat: 16.0012,
    lng: 120.4021,
  },
  {
    id: "c-poblacion-sur",
    name: "Poblacion Sur Multi-Purpose Evac Center",
    barangay: "Poblacion Sur",
    city: "Santa Barbara, Pangasinan",
    distance: "1.8 km",
    status: "Open",
    occupancy: 80,
    capacity: 200,
    supplies: ["Emergency Rations", "Drinking Water Purifiers", "Sleeping Mats"],
    features: ["Medical Aid", "High Elevation"],
    contact: "(075) 522-1144",
    elevation: "20m Elevation",
    lat: 15.9985,
    lng: 120.4010,
  },
  {
    id: "c-tuliao",
    name: "Tuliao Barangay Evacuation Center",
    barangay: "Tuliao",
    city: "Santa Barbara, Pangasinan",
    distance: "2.5 km",
    status: "Open",
    occupancy: 35,
    capacity: 150,
    supplies: ["Canned Goods", "Water Packs", "Flashlights"],
    features: ["Pet Friendly", "Safe Route"],
    contact: "0928-333-9900",
    elevation: "19m Elevation",
    lat: 16.0120,
    lng: 120.3710,
  },
  {
    id: "c-marikina-1",
    name: "Marikina Sports Center Complex",
    barangay: "Sto. Niño",
    city: "Marikina City",
    distance: "0.8 km",
    status: "Open",
    occupancy: 54,
    capacity: 220,
    supplies: ["Clean Water", "Ready-to-Eat Rice", "Hygiene Packs"],
    features: ["Medical Aid", "Pet Friendly", "Generator Power"],
    contact: "(02) 8646-1633",
    elevation: "24m High Elevation",
    lat: 14.6343,
    lng: 121.0991,
  },
];

export interface IncidentReport {
  id: string;
  category: "flood" | "relief" | "medical" | "debris" | "sos";
  title: string;
  location: string;
  timestamp: string;
  status: "NEW" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  details: string;
  contact?: string;
  waterDepth?: string;
  strandedCount?: number;
  assignedUnit?: string;
  declineReason?: string;
  lat?: number;
  lng?: number;
}

export const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "rep-sos-1",
    category: "sos",
    title: "CRITICAL SOS: 5 Stranded on Roof Deck near Sinocalan Dike",
    location: "Barangay Dalongue, Santa Barbara",
    timestamp: "2 min ago",
    status: "NEW",
    priority: "CRITICAL",
    details: "Waist to chest level flood water rapidly rising. 2 seniors and 1 child need urgent rescue boat evacuation.",
    waterDepth: "Waist to Chest (1.4m)",
    strandedCount: 5,
    contact: "0917-882-9011",
    lat: 16.0022,
    lng: 120.3842,
  },
  {
    id: "rep-sb-2",
    category: "flood",
    title: "Waist-deep rapid flood near Dalongue Elementary",
    location: "Dalongue Main Road, Santa Barbara",
    timestamp: "12 min ago",
    status: "ACKNOWLEDGED",
    priority: "HIGH",
    details: "Road is unpassable to light vehicles. Residents evacuating towards Dalongue Barangay Hall.",
    waterDepth: "Waist (1.1m)",
    contact: "0920-551-7788",
    lat: 16.0038,
    lng: 120.3855,
  },
  {
    id: "rep-sb-3",
    category: "medical",
    title: "Oxygen supply & senior citizen transport",
    location: "Poblacion Sur, Santa Barbara",
    timestamp: "28 min ago",
    status: "DISPATCHED",
    priority: "HIGH",
    details: "MDRRMO ambulance dispatched to transport senior with portable oxygen unit.",
    assignedUnit: "Santa Barbara MDRRMO Ambulance #1",
    contact: "0919-444-2211",
    lat: 15.9990,
    lng: 120.4015,
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>("resident");
  const [screen, setScreen] = useState<Screen>("radar");
  const [selectedLoc, setSelectedLoc] = useState<LocationPreset>(LOCATIONS[0]);

  // Real-time live disaster telemetry state
  const [liveRiverLevel, setLiveRiverLevel] = useState(LOCATIONS[0].riverLevel);
  const [liveRainRate, setLiveRainRate] = useState(LOCATIONS[0].rainRate);
  const [liveWindSpeed, setLiveWindSpeed] = useState(LOCATIONS[0].windSpeed);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");

  // Centers & Reports State
  const [centers, setCenters] = useState<EvacCenter[]>(INITIAL_CENTERS);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);

  // Modals
  const [selectedCenter, setSelectedCenter] = useState<EvacCenter | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showResponderSosModal, setShowResponderSosModal] = useState<IncidentReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // Go Bag Checklist Items
  const [checklist, setChecklist] = useState([
    { id: "c1", label: "3 days potable water (1 gallon/person/day)", checked: true },
    { id: "c2", label: "Non-perishable canned food & manual opener", checked: true },
    { id: "c3", label: "Power bank, radio & flashlights with batteries", checked: true },
    { id: "c4", label: "Prescription medicines & First Aid kit", checked: false },
    { id: "c5", label: "Important IDs in waterproof ziplock bags", checked: false },
    { id: "c6", label: "Emergency signaling whistle", checked: true },
  ]);

  useEffect(() => {
    initialize();
  }, []);

  // Telemetry heartbeat timer
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.02;
      setLiveRiverLevel((prev) => Math.round((prev + delta) * 100) / 100);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  async function initialize() {
    setupNotificationHandler();
    try {
      const savedUserStr = await AsyncStorage.getItem("@agap_user_session");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser(parsed);
        setRole(parsed.role || "resident");
      }
    } catch {
      // ignore
    }

    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const address = await Location.reverseGeocodeAsync(pos.coords);
        const city = address[0]?.city || address[0]?.subregion || address[0]?.district;
        if (city) {
          await AsyncStorage.setItem("agapalert_city", city);
        }
      }
    } catch {
      // ignore
    }
    await requestNotificationPermissions();
  }

  const handleSaveUser = async (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      setRole(user.role);
      await AsyncStorage.setItem("@agap_user_session", JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem("@agap_user_session");
    }
  };

  // Flood Alarm Level calculation based on river telemetry (Sinocalan warning threshold ~5.8m)
  const alarmInfo = useMemo(() => {
    if (liveRiverLevel >= 6.5) {
      return { level: 3, title: "ALARM 3: FORCED EVACUATION", color: C.red, bg: C.redPale };
    }
    if (liveRiverLevel >= 5.8) {
      return { level: 2, title: "ALARM 2: PREPARATORY EVACUATION", color: C.amber, bg: C.amberPale };
    }
    if (liveRiverLevel >= 5.0) {
      return { level: 1, title: "ALARM 1: WARNING MONITORING", color: "#FACC15", bg: "rgba(250, 204, 21, 0.15)" };
    }
    return { level: 0, title: "NORMAL WATER LEVEL", color: C.green, bg: C.greenPale };
  }, [liveRiverLevel]);

  // Active Critical SOS items
  const activeSosReport = useMemo(() => {
    return reports.find((r) => r.category === "sos" && (r.status === "NEW" || r.status === "ACKNOWLEDGED"));
  }, [reports]);

  // Simulate water level spike
  const triggerSimulationSpike = () => {
    setIsSimulatingSpike(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLiveRiverLevel((prev) => Math.round((prev + 0.18) * 100) / 100);
      setLiveRainRate((prev) => prev + 5);
      if (step >= 5) {
        clearInterval(interval);
        setIsSimulatingSpike(false);
      }
    }, 600);
  };

  const handleCreateReport = (newRep: Omit<IncidentReport, "id" | "timestamp" | "status">) => {
    const latOffset = (Math.random() - 0.5) * 0.006;
    const lngOffset = (Math.random() - 0.5) * 0.006;
    const item: IncidentReport = {
      ...newRep,
      id: `rep-${Date.now()}`,
      timestamp: "Just now",
      status: "NEW",
      lat: newRep.lat || selectedLoc.lat + latOffset,
      lng: newRep.lng || selectedLoc.lng + lngOffset,
    };
    setReports([item, ...reports]);
    setShowReportModal(false);
    setShowSosModal(false);
    Alert.alert(
      "Rescue Signal Transmitted",
      `Your report "${item.title}" has been broadcast to Barangay Quick Response Command.`
    );
  };

  const handleAcceptRescue = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "DISPATCHED",
              assignedUnit: "Santa Barbara MDRRMO Rescue Boat #2",
            }
          : r
      )
    );
    setShowResponderSosModal(null);
    Alert.alert(
      "Rescue Mission Dispatched",
      "Assigned to Santa Barbara MDRRMO Rescue Boat #2. Victim has been alerted that help is en route."
    );
  };

  const handleDeclineOrEscalate = (reportId: string, reason: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "ACKNOWLEDGED",
              declineReason: reason,
              details: `${r.details} [ESCALATED TO PANGASINAN PDRRMO: ${reason}]`,
            }
          : r
      )
    );
    setShowResponderSosModal(null);
    Alert.alert(
      "Escalated to Provincial PDRRMO",
      `Incident escalated to Pangasinan Provincial Operations Center. Reason: ${reason}`
    );
  };

  const handleUpdateStatus = (id: string, newStatus: IncidentReport["status"]) => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    Alert.alert("Status Updated", `Incident report updated to ${newStatus}.`);
  };

  const official = role === "official";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* 1. Top Emergency Storm Signal Banner */}
      <View style={styles.topAdvisoryBar}>
        <View style={styles.pulseBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.pulseText}>PAGASA SIGNAL #{selectedLoc.stormSignal}</Text>
        </View>
        <Text style={styles.advisoryText} numberOfLines={1}>
          {selectedLoc.name} · {selectedLoc.riverName} ({liveRiverLevel}m)
        </Text>
        <Pressable
          style={styles.checklistBtn}
          onPress={() => setShowChecklistModal(true)}
        >
          <CheckCircle2 color="#86EFAC" size={13} />
          <Text style={styles.checklistBtnText}>Go-Bag</Text>
        </Pressable>
      </View>

      {/* 2. Top Command Header with Brand & Auth/Role Badges */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>A</Text>
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.brandTitle}>
                AGAP<Text style={{ color: C.cyan }}>ALERT</Text>
              </Text>
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveChipText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.brandSub}>
              {official ? "BARANGAY INCIDENT OPERATIONS DESK" : "COMMUNITY SAFETY & EVACUATION"}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* User Profile / Sign In Pill */}
          <Pressable
            style={styles.userBadgeBtn}
            onPress={() => setShowAuthModal(true)}
          >
            <Users color={C.cyan} size={13} />
            <Text style={styles.userBadgeText} numberOfLines={1}>
              {currentUser ? currentUser.fullName.split(" ")[0] : "Sign In"}
            </Text>
          </Pressable>

          {/* Role Switcher */}
          <Pressable
            style={[styles.roleSwitchBtn, official && styles.roleSwitchBtnOfficial]}
            onPress={() => setShowRoleModal(true)}
          >
            {official ? <ShieldCheck color={C.white} size={14} /> : <Users color={C.cyan} size={14} />}
            <Text style={[styles.roleSwitchText, official && { color: C.white }]}>
              {official ? "OFFICIAL" : "RESIDENT"}
            </Text>
          </Pressable>

          {/* Quick SOS Header Button */}
          <Pressable
            style={styles.quickSosBtn}
            onPress={() => setShowSosModal(true)}
          >
            <Siren color={C.white} size={15} />
            <Text style={styles.quickSosText}>SOS</Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Top Active SOS Broadcast Banner */}
      {activeSosReport && (
        <Pressable
          style={styles.sosBannerBar}
          onPress={() => {
            if (official) {
              setShowResponderSosModal(activeSosReport);
            } else {
              setScreen("reports");
            }
          }}
        >
          <View style={styles.sosBannerIconBox}>
            <Siren color={C.white} size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosBannerTitle}>🚨 ACTIVE SOS BEACON IN DALONGUE</Text>
            <Text style={styles.sosBannerDesc} numberOfLines={1}>
              {activeSosReport.title} ({activeSosReport.waterDepth || "Rising Flood"})
            </Text>
          </View>
          <View style={styles.sosBannerAction}>
            <Text style={styles.sosBannerActionText}>{official ? "RESPOND" : "VIEW"}</Text>
          </View>
        </Pressable>
      )}

      {/* 4. Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        scrollEnabled={isScrollEnabled}
      >
        {/* Monitored Sector Selector & Simulation Trigger */}
        <View style={styles.sectorBar}>
          <Pressable
            style={styles.sectorPicker}
            onPress={() => setShowSectorModal(true)}
          >
            <Compass color={C.cyan} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.microLabel}>MONITORED SECTOR</Text>
              <Text style={styles.sectorName}>{selectedLoc.name}</Text>
            </View>
            <ChevronRight color={C.textMuted} size={16} />
          </Pressable>

          <Pressable
            style={[styles.simSpikeBtn, isSimulatingSpike && { opacity: 0.6 }]}
            onPress={triggerSimulationSpike}
            disabled={isSimulatingSpike}
          >
            <Flame color={C.amber} size={14} />
            <Text style={styles.simSpikeText}>
              {isSimulatingSpike ? "Rising..." : "Water Surge Test"}
            </Text>
          </Pressable>
        </View>

        {/* Live Telemetry Cards */}
        <View style={styles.telemetryGrid}>
          {/* River Water Level Card */}
          <View style={[styles.telemetryCard, { flex: 1 }]}>
            <View style={styles.cardHead}>
              <Waves color={C.cyan} size={16} />
              <Text style={styles.cardTag}>RIVER GAUGE</Text>
              <Text style={[styles.alarmPill, { color: alarmInfo.color, backgroundColor: alarmInfo.bg }]}>
                ALARM {alarmInfo.level}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricNumber}>{liveRiverLevel}</Text>
              <Text style={styles.metricUnit}>meters</Text>
            </View>

            <View style={styles.gaugeTrack}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${Math.min(((liveRiverLevel - 3) / (8 - 3)) * 100, 100)}%`,
                    backgroundColor: alarmInfo.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.cardSub}>{selectedLoc.riverName}</Text>
          </View>

          {/* Typhoon Wind & Rain Card */}
          <View style={[styles.telemetryCard, { flex: 1 }]}>
            <View style={styles.cardHead}>
              <Wind color={C.teal} size={16} />
              <Text style={styles.cardTag}>WIND & RAIN</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricNumber}>{liveWindSpeed}</Text>
              <Text style={styles.metricUnit}>km/h</Text>
            </View>

            <View style={styles.miniDetailRow}>
              <Radio color={C.cyan} size={12} />
              <Text style={styles.miniDetailText}>Rain: {liveRainRate} mm/hr</Text>
            </View>
            <Text style={styles.cardSub}>Signal #{selectedLoc.stormSignal} Force</Text>
          </View>
        </View>

        {/* TAB 1: Live Radar & Google Map */}
        {screen === "radar" && (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 8 }}>
              <View style={styles.radarHead}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Crosshair color={C.cyan} size={16} />
                  <Text style={styles.radarTitle}>Santa Barbara Hazard & Safe Zones</Text>
                </View>
                <Text style={styles.syncText}>Synced {lastSyncTime}</Text>
              </View>

              <MobileGoogleMap
                selectedLocation={selectedLoc}
                centers={centers}
                reports={reports}
                liveRiverLevel={liveRiverLevel}
                onSelectCenter={(c) => setSelectedCenter(c as any)}
                onRequestSos={() => setShowSosModal(true)}
                onTouchMap={(active) => setIsScrollEnabled(!active)}
              />
            </View>

            {/* Critical Flood Alert Card */}
            <View style={styles.warningCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <AlertTriangle color={C.red} size={16} />
                <Text style={styles.warningTag}>{alarmInfo.title}</Text>
              </View>
              <Text style={styles.warningHeading}>{selectedLoc.riverName} Level at {liveRiverLevel}m</Text>
              <Text style={styles.warningBody}>
                Low-lying riverside communities in Barangay Dalongue and nearby Santa Barbara corridors are advised to evacuate immediately to Dalongue Barangay Hall or Central Elementary Gym.
              </Text>

              <View style={styles.actionBtnRow}>
                <Pressable
                  style={styles.primaryActionBtn}
                  onPress={() => setSelectedCenter(centers[0])}
                >
                  <Navigation color={C.bgPrimary} size={15} />
                  <Text style={styles.primaryActionText}>Route to Dalongue Hall</Text>
                </Pressable>

                <Pressable
                  style={styles.sosActionBtn}
                  onPress={() => setShowSosModal(true)}
                >
                  <Siren color={C.white} size={15} />
                  <Text style={styles.sosActionText}>Emergency SOS</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: Evacuation Centers */}
        {screen === "centers" && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Santa Barbara Evacuation Centers</Text>
              <Text style={styles.sectionMeta}>{centers.filter((c) => c.status === "Open").length} Open</Text>
            </View>

            {centers.map((center) => {
              const pct = Math.round((center.occupancy / center.capacity) * 100);
              const isFull = center.status === "Full" || pct >= 98;
              const barColor = pct >= 85 ? C.red : pct >= 60 ? C.amber : C.green;

              return (
                <Pressable
                  key={center.id}
                  style={styles.centerItemCard}
                  onPress={() => setSelectedCenter(center)}
                >
                  <View style={styles.centerCardHead}>
                    <Text
                      style={[
                        styles.statusPill,
                        isFull
                          ? { color: C.red, backgroundColor: C.redPale }
                          : { color: C.green, backgroundColor: C.greenPale },
                      ]}
                    >
                      {isFull ? "AT CAPACITY" : "OPEN"}
                    </Text>
                    <Text style={styles.distTag}>{center.distance} away</Text>
                  </View>

                  <Text style={styles.centerCardTitle}>{center.name}</Text>
                  <Text style={styles.centerCardLoc}>📍 {center.barangay}, {center.city} · {center.elevation}</Text>

                  {/* Capacity Bar */}
                  <View style={styles.capRow}>
                    <Text style={styles.capLabel}>Occupancy</Text>
                    <Text style={styles.capValue}>
                      {center.occupancy} / {center.capacity} ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.capTrack}>
                    <View style={[styles.capFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
                  </View>

                  <View style={styles.suppliesRow}>
                    <Package color={C.textMuted} size={13} />
                    <Text style={styles.suppliesText} numberOfLines={1}>
                      {center.supplies.join(" · ")}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* TAB 3: Incident Reports & Official Queue */}
        {screen === "reports" && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {official ? "Barangay Incident Queue" : "Community Reports"}
              </Text>
              {!official && (
                <Pressable
                  style={styles.newReportBtn}
                  onPress={() => setShowReportModal(true)}
                >
                  <Plus color={C.bgPrimary} size={14} />
                  <Text style={styles.newReportBtnText}>New Report</Text>
                </Pressable>
              )}
            </View>

            {reports.map((rep) => (
              <Pressable
                key={rep.id}
                style={[
                  styles.reportItemCard,
                  rep.category === "sos" && { borderColor: C.redBorder, backgroundColor: "rgba(127, 29, 29, 0.15)" },
                ]}
                onPress={() => {
                  if (rep.category === "sos" && official) {
                    setShowResponderSosModal(rep);
                  }
                }}
              >
                <View style={styles.reportCardHead}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {rep.category === "sos" && (
                      <View style={styles.sosMiniBadge}>
                        <Siren color={C.white} size={12} />
                        <Text style={styles.sosMiniText}>SOS BEACON</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.statusPill,
                        rep.status === "NEW"
                          ? { color: C.red, backgroundColor: C.redPale }
                          : rep.status === "ACKNOWLEDGED"
                          ? { color: C.amber, backgroundColor: C.amberPale }
                          : { color: C.green, backgroundColor: C.greenPale },
                      ]}
                    >
                      {rep.status}
                    </Text>
                  </View>
                  <Text style={styles.timeTag}>{rep.timestamp}</Text>
                </View>

                <Text style={styles.reportTitle}>{rep.title}</Text>
                <Text style={styles.reportLoc}>📍 {rep.location}</Text>

                {rep.waterDepth && (
                  <View style={styles.reportMetaRow}>
                    <Text style={styles.reportMetaPill}>🌊 Flood: {rep.waterDepth}</Text>
                    {rep.strandedCount && (
                      <Text style={[styles.reportMetaPill, { borderColor: C.redBorder, color: "#FCA5A5" }]}>
                        👥 {rep.strandedCount} Stranded
                      </Text>
                    )}
                  </View>
                )}

                <Text style={styles.reportDetails}>{rep.details}</Text>

                {rep.assignedUnit && (
                  <View style={styles.assignedBox}>
                    <LifeBuoy color={C.cyan} size={13} />
                    <Text style={styles.assignedText}>Assigned: {rep.assignedUnit}</Text>
                  </View>
                )}

                {official && (
                  <View style={styles.officialBtnRow}>
                    {rep.category === "sos" && rep.status !== "DISPATCHED" && (
                      <Pressable
                        style={styles.sosActionRespondBtn}
                        onPress={() => setShowResponderSosModal(rep)}
                      >
                        <Siren color={C.white} size={13} />
                        <Text style={styles.sosActionRespondText}>Review SOS (Accept/Decline)</Text>
                      </Pressable>
                    )}

                    {rep.status === "NEW" && rep.category !== "sos" && (
                      <Pressable
                        style={styles.ackBtn}
                        onPress={() => handleUpdateStatus(rep.id, "ACKNOWLEDGED")}
                      >
                        <Text style={styles.ackBtnText}>Acknowledge</Text>
                      </Pressable>
                    )}
                    {rep.status === "ACKNOWLEDGED" && rep.category !== "sos" && (
                      <Pressable
                        style={styles.dispatchBtn}
                        onPress={() => handleUpdateStatus(rep.id, "DISPATCHED")}
                      >
                        <Text style={styles.dispatchBtnText}>Dispatch Team</Text>
                      </Pressable>
                    )}
                    {rep.status === "DISPATCHED" && (
                      <Pressable
                        style={styles.resolveBtn}
                        onPress={() => handleUpdateStatus(rep.id, "RESOLVED")}
                      >
                        <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* TAB 4: Emergency Hotlines & Contacts */}
        {screen === "settings" && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Santa Barbara & Emergency Hotlines</Text>
            </View>

            <View style={styles.hotlinesCard}>
              <HotlineItem num="(075) 518-2024" name="Santa Barbara MDRRMO" desc="Municipal Disaster Command & Boat Rescue" />
              <HotlineItem num="0917-882-9011" name="Dalongue Barangay Quick Desk" desc="Barangay Captain & First Responders" />
              <HotlineItem num="(075) 522-1144" name="Poblacion Sur Command Post" desc="Central evacuation assistance" />
              <HotlineItem num="143" name="Philippine Red Cross" desc="Disaster response & ambulance" />
              <HotlineItem num="911" name="National Emergency Hotline" desc="Police, Fire, Medical, Rescue" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* 5. Floating Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavBtn
          icon={<Radio size={19} color={screen === "radar" ? C.cyan : C.textMuted} />}
          label="Live Radar"
          active={screen === "radar"}
          onPress={() => setScreen("radar")}
        />
        <NavBtn
          icon={<Home size={19} color={screen === "centers" ? C.cyan : C.textMuted} />}
          label="Evac Centers"
          active={screen === "centers"}
          onPress={() => setScreen("centers")}
        />

        {/* Center Emergency SOS Button */}
        <Pressable
          style={styles.centerSosBtn}
          onPress={() => setShowSosModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS Trigger"
        >
          <View style={styles.centerSosIconCircle}>
            <Siren color={C.white} size={22} />
          </View>
          <Text style={styles.centerSosLabel}>SOS</Text>
        </Pressable>

        <NavBtn
          icon={<Layers size={19} color={screen === "reports" ? C.cyan : C.textMuted} />}
          label={official ? "Queue" : "Reports"}
          active={screen === "reports"}
          badge={reports.filter((r) => r.status === "NEW").length}
          onPress={() => setScreen("reports")}
        />
        <NavBtn
          icon={<Phone size={19} color={screen === "settings" ? C.cyan : C.textMuted} />}
          label="Hotlines"
          active={screen === "settings"}
          onPress={() => setScreen("settings")}
        />
      </View>

      {/* 6. Authentication Modal (Sign In / Sign Up) */}
      <Modal visible={showAuthModal} transparent animationType="slide">
        <AuthModal
          currentUser={currentUser}
          onClose={() => setShowAuthModal(false)}
          onSaveUser={handleSaveUser}
        />
      </Modal>

      {/* 7. Resident Emergency SOS Modal with Live GPS Location & Flood Depth */}
      <Modal visible={showSosModal} transparent animationType="slide">
        <EmergencySosModal
          selectedLocation={selectedLoc}
          onClose={() => setShowSosModal(false)}
          onSubmit={handleCreateReport}
        />
      </Modal>

      {/* 8. Responder SOS Modal (Accept Rescue or Decline / Escalate) */}
      <Modal visible={!!showResponderSosModal} transparent animationType="fade">
        {showResponderSosModal && (
          <ResponderSosModal
            report={showResponderSosModal}
            onClose={() => setShowResponderSosModal(null)}
            onAccept={() => handleAcceptRescue(showResponderSosModal.id)}
            onDecline={(reason) => handleDeclineOrEscalate(showResponderSosModal.id, reason)}
          />
        )}
      </Modal>

      {/* 9. Evac Center Details Modal */}
      <Modal visible={!!selectedCenter} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTag}>VERIFIED EVACUATION CENTER</Text>
                <Text style={styles.modalTitle}>{selectedCenter?.name}</Text>
                <Text style={styles.modalSub}>📍 {selectedCenter?.barangay}, {selectedCenter?.city}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setSelectedCenter(null)}>
                <X color={C.textPrimary} size={18} />
              </Pressable>
            </View>

            <View style={styles.capModalBox}>
              <Text style={styles.capModalNum}>
                {selectedCenter?.occupancy} <Text style={{ fontSize: 12, color: C.textMuted }}>/ {selectedCenter?.capacity} Beds</Text>
              </Text>
              <Text style={{ color: C.cyan, fontWeight: "900", fontSize: 15 }}>
                {Math.round(((selectedCenter?.occupancy || 0) / (selectedCenter?.capacity || 1)) * 100)}%
              </Text>
            </View>

            <Text style={styles.modalSectionTitle}>VERIFIED RELIEF SUPPLIES:</Text>
            <View style={styles.suppliesGrid}>
              {selectedCenter?.supplies.map((s, i) => (
                <View key={i} style={styles.supplyPill}>
                  <CheckCircle2 color={C.cyan} size={13} />
                  <Text style={styles.supplyPillText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.outlineActionBtn}
                onPress={() => {
                  if (selectedCenter?.contact) {
                    Linking.openURL(`tel:${selectedCenter.contact}`);
                  }
                }}
              >
                <Phone color={C.cyan} size={14} />
                <Text style={styles.outlineActionText}>Call Desk</Text>
              </Pressable>

              <Pressable
                style={[styles.outlineActionBtn, { borderColor: "#4285F4" }]}
                onPress={() => {
                  if (selectedCenter) {
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedCenter.lat},${selectedCenter.lng}`);
                  }
                }}
              >
                <Navigation color="#4285F4" size={14} />
                <Text style={[styles.outlineActionText, { color: "#4285F4" }]}>Google Maps ↗</Text>
              </Pressable>

              <Pressable
                style={styles.primaryActionBtnModal}
                onPress={() => {
                  setSelectedCenter(null);
                  setScreen("radar");
                }}
              >
                <Compass color={C.bgPrimary} size={14} />
                <Text style={styles.primaryActionTextModal}>Live Map</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10. Go-Bag Checklist Modal */}
      <Modal visible={showChecklistModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTag}>DISASTER PREPAREDNESS</Text>
                <Text style={styles.modalTitle}>Go-Bag Essentials Checklist</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowChecklistModal(false)}>
                <X color={C.textPrimary} size={18} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {checklist.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.checkItemRow}
                  onPress={() => {
                    setChecklist(
                      checklist.map((c) => (c.id === item.id ? { ...c, checked: !c.checked } : c))
                    );
                  }}
                >
                  <CheckCircle2 color={item.checked ? C.cyan : C.textMuted} size={18} />
                  <Text style={[styles.checkItemLabel, item.checked && { color: C.textPrimary }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.primaryActionBtnModal, { marginTop: 12 }]}
              onPress={() => setShowChecklistModal(false)}
            >
              <Text style={styles.primaryActionTextModal}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 11. Sector Picker Modal */}
      <Modal visible={showSectorModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Select Monitored Sector</Text>
              <Pressable style={styles.closeBtn} onPress={() => setShowSectorModal(false)}>
                <X color={C.textPrimary} size={18} />
              </Pressable>
            </View>

            {LOCATIONS.map((loc) => (
              <Pressable
                key={loc.id}
                style={[
                  styles.sectorOption,
                  selectedLoc.id === loc.id && { borderColor: C.cyan, backgroundColor: C.cyanGlow },
                ]}
                onPress={() => {
                  setSelectedLoc(loc);
                  setLiveRiverLevel(loc.riverLevel);
                  setLiveWindSpeed(loc.windSpeed);
                  setLiveRainRate(loc.rainRate);
                  setShowSectorModal(false);
                }}
              >
                <Compass color={C.cyan} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectorOptionTitle}>{loc.name}</Text>
                  <Text style={styles.sectorOptionSub}>{loc.riverName} · {loc.region}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* 12. Role Switcher Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Switch Workspace Role</Text>
              <Pressable style={styles.closeBtn} onPress={() => setShowRoleModal(false)}>
                <X color={C.textPrimary} size={18} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.roleOption, role === "resident" && styles.roleOptionActive]}
              onPress={() => {
                setRole("resident");
                setShowRoleModal(false);
              }}
            >
              <Users color={C.cyan} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.roleOptionTitle}>Resident / Community</Text>
                <Text style={styles.roleOptionSub}>View live radar, open evacuation beds, and transmit GPS SOS beacon.</Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.roleOption, role === "official" && styles.roleOptionActive]}
              onPress={() => {
                setRole("official");
                setShowRoleModal(false);
              }}
            >
              <ShieldCheck color={C.teal} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.roleOptionTitle}>Barangay Official Desk</Text>
                <Text style={styles.roleOptionSub}>Accept/decline rescue missions, dispatch boat teams & update shelter beds.</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 13. New Standard Incident Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <CreateReportModal
          locationName={selectedLoc.name}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleCreateReport}
        />
      </Modal>
    </SafeAreaView>
  );
}

// --------------------------------------------------------------------------
// Sub-components: Authentication Modal (Sign In & Sign Up)
// --------------------------------------------------------------------------
function AuthModal({
  currentUser,
  onClose,
  onSaveUser,
}: {
  currentUser: UserProfile | null;
  onClose: () => void;
  onSaveUser: (u: UserProfile | null) => void;
}) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("resident");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [barangay, setBarangay] = useState("Dalongue, Santa Barbara");
  const [phone, setPhone] = useState("");

  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName: fullName || email.split("@")[0],
      role,
      barangay: barangay || "Dalongue, Santa Barbara",
      phone,
    };
    onSaveUser(user);
    onClose();
    Alert.alert("Signed In", `Welcome back, ${user.fullName}!`);
  };

  const handleSignUp = () => {
    if (!fullName || !email || !password) {
      Alert.alert("Missing Fields", "Please complete Full Name, Email, and Password.");
      return;
    }
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      role,
      barangay,
      phone,
    };
    onSaveUser(user);
    onClose();
    Alert.alert("Registration Complete", `Account registered for ${user.fullName} (${user.role.toUpperCase()}).`);
  };

  const handleQuickDemoResident = () => {
    const user: UserProfile = {
      id: "demo-res-1",
      email: "resident.dalongue@agapalert.ph",
      fullName: "Juan Dela Cruz",
      role: "resident",
      barangay: "Dalongue, Santa Barbara",
      phone: "0917-555-0199",
    };
    onSaveUser(user);
    onClose();
    Alert.alert("Demo Resident Mode", "Logged in as Juan Dela Cruz (Dalongue Resident).");
  };

  const handleQuickDemoOfficial = () => {
    const user: UserProfile = {
      id: "demo-off-1",
      email: "mdrmo.santabarbara@pangasinan.gov.ph",
      fullName: "Officer R. Mendoza",
      role: "official",
      barangay: "Santa Barbara Command Desk",
      phone: "0918-999-4400",
    };
    onSaveUser(user);
    onClose();
    Alert.alert("Demo Official Mode", "Logged in as Officer R. Mendoza (MDRRMO Santa Barbara).");
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modalSheet, { maxHeight: "90%" }]}>
        <View style={styles.modalHead}>
          <View>
            <Text style={styles.modalTag}>ACCOUNT & CREDENTIALS</Text>
            <Text style={styles.modalTitle}>
              {currentUser ? "User Profile" : tab === "signin" ? "Sign In to AgapAlert" : "Create Resident Account"}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X color={C.textPrimary} size={18} />
          </Pressable>
        </View>

        {currentUser ? (
          <View style={{ gap: 12 }}>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{currentUser.fullName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{currentUser.fullName}</Text>
                <Text style={styles.profileEmail}>{currentUser.email}</Text>
                <View style={styles.profileRoleBadge}>
                  <Text style={styles.profileRoleText}>{currentUser.role.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileInfoBox}>
              <Text style={styles.profileInfoLabel}>ASSIGNED BARANGAY / SECTOR</Text>
              <Text style={styles.profileInfoVal}>{currentUser.barangay || "Dalongue, Santa Barbara"}</Text>
            </View>

            <Pressable
              style={styles.logoutBtn}
              onPress={() => {
                onSaveUser(null);
                Alert.alert("Signed Out", "You have been signed out.");
              }}
            >
              <LogOut color={C.red} size={15} />
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Tab Selector */}
            <View style={styles.authTabRow}>
              <Pressable
                style={[styles.authTabBtn, tab === "signin" && styles.authTabBtnActive]}
                onPress={() => setTab("signin")}
              >
                <Text style={[styles.authTabText, tab === "signin" && styles.authTabTextActive]}>Sign In</Text>
              </Pressable>
              <Pressable
                style={[styles.authTabBtn, tab === "signup" && styles.authTabBtnActive]}
                onPress={() => setTab("signup")}
              >
                <Text style={[styles.authTabText, tab === "signup" && styles.authTabTextActive]}>Sign Up</Text>
              </Pressable>
            </View>

            {/* Role Picker */}
            <Text style={styles.modalLabel}>SELECT ROLE</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <Pressable
                style={[styles.roleSelectChip, role === "resident" && styles.roleSelectChipActive]}
                onPress={() => setRole("resident")}
              >
                <Users color={role === "resident" ? C.bgPrimary : C.cyan} size={14} />
                <Text style={[styles.roleSelectText, role === "resident" && { color: C.bgPrimary }]}>
                  Resident / Citizen
                </Text>
              </Pressable>
              <Pressable
                style={[styles.roleSelectChip, role === "official" && styles.roleSelectChipActive]}
                onPress={() => setRole("official")}
              >
                <ShieldCheck color={role === "official" ? C.bgPrimary : C.teal} size={14} />
                <Text style={[styles.roleSelectText, role === "official" && { color: C.bgPrimary }]}>
                  Barangay Official
                </Text>
              </Pressable>
            </View>

            {tab === "signup" && (
              <>
                <Text style={styles.modalLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Maria Santos"
                  placeholderTextColor={C.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text style={[styles.modalLabel, { marginTop: 8 }]}>BARANGAY / COMMUNITY</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dalongue, Santa Barbara"
                  placeholderTextColor={C.textMuted}
                  value={barangay}
                  onChangeText={setBarangay}
                />
              </>
            )}

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. resident@dalongue.ph"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>PASSWORD</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Action Button */}
            <Pressable
              style={[styles.primaryActionBtnModal, { marginTop: 14 }]}
              onPress={tab === "signin" ? handleSignIn : handleSignUp}
            >
              <Text style={styles.primaryActionTextModal}>
                {tab === "signin" ? "Sign In to AgapAlert" : "Create Account & Start"}
              </Text>
            </Pressable>

            {/* Quick Demo Shortcuts */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>OR INSTANT 1-TAP DEMO LOGIN:</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <Pressable style={styles.demoBtn} onPress={handleQuickDemoResident}>
                  <Text style={styles.demoBtnText}>⚡ Demo Resident</Text>
                </Pressable>
                <Pressable style={[styles.demoBtn, { borderColor: "rgba(20, 184, 166, 0.4)" }]} onPress={handleQuickDemoOfficial}>
                  <Text style={[styles.demoBtnText, { color: C.teal }]}>⚡ Demo Official</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Sub-components: Resident Emergency SOS Modal with GPS Location Permission
// --------------------------------------------------------------------------
function EmergencySosModal({
  selectedLocation,
  onClose,
  onSubmit,
}: {
  selectedLocation: LocationPreset;
  onClose: () => void;
  onSubmit: (r: {
    category: IncidentReport["category"];
    title: string;
    location: string;
    priority: IncidentReport["priority"];
    details: string;
    waterDepth?: string;
    strandedCount?: number;
    contact?: string;
    lat?: number;
    lng?: number;
  }) => void;
}) {
  const [allowLocation, setAllowLocation] = useState(true);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [waterDepth, setWaterDepth] = useState("Waist (1.1m)");
  const [strandedCount, setStrandedCount] = useState(4);
  const [landmark, setLandmark] = useState("Near Sinocalan River dike");
  const [contactPhone, setContactPhone] = useState("0917-882-9011");

  useEffect(() => {
    fetchGps();
  }, []);

  const fetchGps = async () => {
    setIsLocating(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else {
        setUserGps({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      }
    } catch {
      setUserGps({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    } finally {
      setIsLocating(false);
    }
  };

  const depthOptions = [
    { label: "Ankle (0.3m)", icon: "🦶" },
    { label: "Knee (0.6m)", icon: "🦵" },
    { label: "Waist (1.1m)", icon: "🌊" },
    { label: "Chest (1.5m)", icon: "🏊" },
    { label: "Roof Level (>2m)", icon: "🏠" },
  ];

  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modalSheet, { borderColor: C.red, borderWidth: 1.5 }]}>
        <View style={styles.modalHead}>
          <View>
            <Text style={[styles.modalTag, { color: C.red }]}>EMERGENCY RESCUE BEACON</Text>
            <Text style={styles.modalTitle}>Broadcast Flood SOS</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X color={C.textPrimary} size={18} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {/* Location Permission Box */}
          <View style={styles.sosLocationBox}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MapPin color={allowLocation ? C.cyan : C.textMuted} size={16} />
                <Text style={styles.sosLocationTitle}>Share Live GPS Coordinates</Text>
              </View>
              <Pressable
                style={[styles.toggleBtn, allowLocation && styles.toggleBtnActive]}
                onPress={() => setAllowLocation(!allowLocation)}
              >
                <Text style={[styles.toggleBtnText, allowLocation && { color: C.bgPrimary }]}>
                  {allowLocation ? "ALLOWED" : "OFF"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sosLocationSub}>
              {allowLocation
                ? userGps
                  ? `📍 Pinpointed: ${userGps.lat.toFixed(4)}° N, ${userGps.lng.toFixed(4)}° E (Dalongue / Santa Barbara)`
                  : isLocating
                  ? "Locating GPS precision..."
                  : `📍 Target: ${selectedLocation.lat}° N, ${selectedLocation.lng}° E`
                : "⚠️ Location sharing disabled. Responders will rely on your manual text landmark."}
            </Text>
          </View>

          {/* Water Depth Selector */}
          <Text style={styles.modalLabel}>CURRENT FLOOD WATER DEPTH</Text>
          <View style={styles.depthGrid}>
            {depthOptions.map((opt) => (
              <Pressable
                key={opt.label}
                style={[styles.depthChip, waterDepth === opt.label && styles.depthChipActive]}
                onPress={() => setWaterDepth(opt.label)}
              >
                <Text style={styles.depthChipIcon}>{opt.icon}</Text>
                <Text style={[styles.depthChipText, waterDepth === opt.label && { color: C.bgPrimary }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stranded Count */}
          <Text style={[styles.modalLabel, { marginTop: 10 }]}>STRANDED PERSONS COUNT</Text>
          <View style={styles.countRow}>
            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
              <Pressable
                key={n}
                style={[styles.countChip, strandedCount === n && styles.countChipActive]}
                onPress={() => setStrandedCount(n)}
              >
                <Text style={[styles.countChipText, strandedCount === n && { color: C.bgPrimary }]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          {/* Landmark & Contact */}
          <Text style={[styles.modalLabel, { marginTop: 10 }]}>LANDMARK / HOUSE NUMBER</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Near Dalongue Elementary, 2-storey roof deck"
            placeholderTextColor={C.textMuted}
            value={landmark}
            onChangeText={setLandmark}
          />

          <Text style={[styles.modalLabel, { marginTop: 8 }]}>CONTACT NUMBER</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0917-XXX-XXXX"
            placeholderTextColor={C.textMuted}
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />

          {/* Transmit Beacon Button */}
          <Pressable
            style={styles.confirmSosBtn}
            onPress={() => {
              onSubmit({
                category: "sos",
                title: `CRITICAL SOS: ${strandedCount} Stranded in ${waterDepth} flood`,
                location: `Barangay Dalongue (${landmark})`,
                priority: "CRITICAL",
                details: `${strandedCount} residents stranded with ${waterDepth} flood water rising. Contact: ${contactPhone}.`,
                waterDepth,
                strandedCount,
                contact: contactPhone,
                lat: allowLocation && userGps ? userGps.lat : selectedLocation.lat,
                lng: allowLocation && userGps ? userGps.lng : selectedLocation.lng,
              });
            }}
          >
            <Siren color={C.white} size={18} />
            <Text style={styles.confirmSosText}>TRANSMIT RESCUE BEACON</Text>
          </Pressable>

          <Pressable
            style={styles.dial911Btn}
            onPress={() => {
              Linking.openURL("tel:911");
            }}
          >
            <Phone color={C.red} size={15} />
            <Text style={styles.dial911Text}>Call 911 Emergency Directly</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Sub-components: Responder SOS Modal (Accept / Decline Rescue)
// --------------------------------------------------------------------------
function ResponderSosModal({
  report,
  onClose,
  onAccept,
  onDecline,
}: {
  report: IncidentReport;
  onClose: () => void;
  onAccept: () => void;
  onDecline: (reason: string) => void;
}) {
  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modalSheet, { borderColor: C.cyan, borderWidth: 1.5 }]}>
        <View style={styles.modalHead}>
          <View>
            <Text style={[styles.modalTag, { color: C.cyan }]}>RESPONDER ACTION DESK</Text>
            <Text style={styles.modalTitle}>Incoming SOS Mission</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X color={C.textPrimary} size={18} />
          </Pressable>
        </View>

        <View style={styles.responderSosCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Siren color={C.red} size={16} />
            <Text style={{ color: C.red, fontWeight: "900", fontSize: 13 }}>URGENT FLOOD RESCUE</Text>
          </View>
          <Text style={styles.responderSosTitle}>{report.title}</Text>
          <Text style={styles.responderSosLoc}>📍 {report.location}</Text>

          <View style={styles.reportMetaRow}>
            {report.waterDepth && (
              <Text style={styles.reportMetaPill}>🌊 {report.waterDepth}</Text>
            )}
            {report.strandedCount && (
              <Text style={[styles.reportMetaPill, { color: "#FCA5A5", borderColor: C.redBorder }]}>
                👥 {report.strandedCount} Stranded Persons
              </Text>
            )}
          </View>

          <Text style={styles.responderSosDetails}>{report.details}</Text>

          {report.contact && (
            <Pressable
              style={styles.callVictimBtn}
              onPress={() => Linking.openURL(`tel:${report.contact}`)}
            >
              <Phone color={C.cyan} size={14} />
              <Text style={styles.callVictimText}>Call Victim: {report.contact}</Text>
            </Pressable>
          )}
        </View>

        {/* Accept / Decline Action Buttons */}
        <View style={styles.responderActionGrid}>
          <Pressable
            style={styles.acceptRescueBtn}
            onPress={onAccept}
          >
            <Check color={C.bgPrimary} size={16} />
            <Text style={styles.acceptRescueText}>ACCEPT RESCUE (Dispatch Boat)</Text>
          </Pressable>

          <Pressable
            style={styles.declineRescueBtn}
            onPress={() => {
              Alert.alert(
                "Decline & Escalate",
                "Choose escalation reason for Pangasinan PDRRMO:",
                [
                  { text: "Boat Capacity Full", onPress: () => onDecline("Local boat capacity full") },
                  { text: "Requires Amphibious Truck", onPress: () => onDecline("Requires Heavy Amphibious Truck") },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }}
          >
            <X color={C.textMuted} size={14} />
            <Text style={styles.declineRescueText}>DECLINE / ESCALATE (To Provincial)</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Sub-components: Standard Incident Report Modal
// --------------------------------------------------------------------------
function CreateReportModal({
  locationName,
  onClose,
  onSubmit,
}: {
  locationName: string;
  onClose: () => void;
  onSubmit: (r: {
    category: IncidentReport["category"];
    title: string;
    location: string;
    priority: IncidentReport["priority"];
    details: string;
  }) => void;
}) {
  const [category, setCategory] = useState<IncidentReport["category"]>("flood");
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState(locationName);
  const [details, setDetails] = useState("");

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHead}>
          <Text style={styles.modalTitle}>Submit Incident Report</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X color={C.textPrimary} size={18} />
          </Pressable>
        </View>

        <Text style={styles.modalLabel}>INCIDENT TYPE</Text>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
          <Pressable
            style={[styles.chipBtn, category === "flood" && styles.chipBtnActive]}
            onPress={() => {
              setCategory("flood");
              if (!title) setTitle("Rising flood water near Dalongue");
            }}
          >
            <Text style={[styles.chipText, category === "flood" && { color: C.bgPrimary }]}>🌊 Flood</Text>
          </Pressable>
          <Pressable
            style={[styles.chipBtn, category === "medical" && styles.chipBtnActive]}
            onPress={() => {
              setCategory("medical");
              if (!title) setTitle("Medical evacuation assistance");
            }}
          >
            <Text style={[styles.chipText, category === "medical" && { color: C.bgPrimary }]}>🚑 Medical</Text>
          </Pressable>
          <Pressable
            style={[styles.chipBtn, category === "relief" && styles.chipBtnActive]}
            onPress={() => {
              setCategory("relief");
              if (!title) setTitle("Relief goods & potable water");
            }}
          >
            <Text style={[styles.chipText, category === "relief" && { color: C.bgPrimary }]}>📦 Relief</Text>
          </Pressable>
        </View>

        <Text style={styles.modalLabel}>TITLE</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Waist-deep flood near Dalongue Elementary"
          placeholderTextColor={C.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.modalLabel, { marginTop: 8 }]}>LOCATION / LANDMARK</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Dalongue, Santa Barbara"
          placeholderTextColor={C.textMuted}
          value={loc}
          onChangeText={setLoc}
        />

        <Text style={[styles.modalLabel, { marginTop: 8 }]}>DETAILS</Text>
        <TextInput
          style={[styles.textInput, { height: 70, textAlignVertical: "top" }]}
          placeholder="Number of families, flood depth, urgent needs..."
          placeholderTextColor={C.textMuted}
          multiline
          value={details}
          onChangeText={setDetails}
        />

        <Pressable
          style={[styles.primaryActionBtnModal, { marginTop: 14 }]}
          onPress={() => {
            if (!title || !details) {
              Alert.alert("Missing Details", "Please enter a title and details.");
              return;
            }
            onSubmit({
              category,
              title,
              location: loc,
              priority: "HIGH",
              details,
            });
          }}
        >
          <Text style={styles.primaryActionTextModal}>Submit to Response Desk</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HotlineItem({ num, name, desc }: { num: string; name: string; desc: string }) {
  return (
    <View style={styles.hotlineRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.hotlineNum}>{num}</Text>
        <Text style={styles.hotlineName}>{name}</Text>
        <Text style={styles.hotlineDesc}>{desc}</Text>
      </View>
      <Pressable
        style={styles.callBtn}
        onPress={() => Linking.openURL(`tel:${num.replace(/[^0-9+]/g, "")}`)}
      >
        <Phone color={C.cyan} size={15} />
        <Text style={styles.callBtnText}>Call</Text>
      </Pressable>
    </View>
  );
}

function NavBtn({ icon, label, active, badge, onPress }: any) {
  return (
    <Pressable style={styles.navBtn} onPress={onPress}>
      <View style={[styles.navIconBox, active && styles.navIconBoxActive]}>
        {icon}
        {badge ? (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.navLabel, active && { color: C.cyan, fontWeight: "900" }]}>{label}</Text>
    </Pressable>
  );
}

// --------------------------------------------------------------------------
// Stylesheet
// --------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgPrimary,
  },
  topAdvisoryBar: {
    backgroundColor: "#7F1D1D",
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pulseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F87171",
  },
  pulseText: {
    color: "#FECACA",
    fontSize: 9.5,
    fontWeight: "900",
  },
  advisoryText: {
    flex: 1,
    color: C.white,
    fontSize: 11,
    fontWeight: "600",
  },
  checklistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  checklistBtnText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "800",
  },
  header: {
    backgroundColor: C.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  brandIconText: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 18,
  },
  brandTitle: {
    color: C.white,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.3,
  },
  brandSub: {
    color: C.textMuted,
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.greenPale,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.green,
  },
  liveChipText: {
    color: C.green,
    fontSize: 8.5,
    fontWeight: "900",
  },
  userBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },
  userBadgeText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
    maxWidth: 60,
  },
  roleSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.cyanGlow,
    borderWidth: 1.5,
    borderColor: "rgba(6, 182, 212, 0.4)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },
  roleSwitchBtnOfficial: {
    backgroundColor: "rgba(30, 58, 138, 0.5)",
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  roleSwitchText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
  },
  quickSosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.red,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  quickSosText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
  },
  sosBannerBar: {
    backgroundColor: "#991B1B",
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.4)",
  },
  sosBannerIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBannerTitle: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  sosBannerDesc: {
    color: "#FECACA",
    fontSize: 10,
    marginTop: 1,
  },
  sosBannerAction: {
    backgroundColor: C.white,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  sosBannerActionText: {
    color: "#991B1B",
    fontSize: 10,
    fontWeight: "900",
  },
  scroll: {
    padding: 16,
    paddingBottom: 120,
  },
  sectorBar: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectorPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  microLabel: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  sectorName: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  simSpikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.amberPale,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
  },
  simSpikeText: {
    color: C.amber,
    fontSize: 10.5,
    fontWeight: "800",
  },
  telemetryGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  telemetryCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTag: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  alarmPill: {
    fontSize: 8.5,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: C.textPrimary,
  },
  metricUnit: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: "600",
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
    marginVertical: 8,
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 99,
  },
  cardSub: {
    color: C.textSecondary,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  miniDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  miniDetailText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "700",
  },
  radarHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  radarTitle: {
    color: C.textPrimary,
    fontWeight: "900",
    fontSize: 14,
  },
  syncText: {
    color: C.textMuted,
    fontSize: 10,
  },
  warningCard: {
    backgroundColor: "rgba(127, 29, 29, 0.25)",
    borderWidth: 1,
    borderColor: C.redBorder,
    borderRadius: 18,
    padding: 14,
  },
  warningTag: {
    color: C.red,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  warningHeading: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  warningBody: {
    color: "#CBD5E1",
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: C.cyan,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  primaryActionText: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 12,
  },
  sosActionBtn: {
    flex: 1,
    backgroundColor: C.red,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  sosActionText: {
    color: C.white,
    fontWeight: "900",
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionMeta: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  centerItemCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  centerCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  statusPill: {
    fontSize: 9.5,
    fontWeight: "900",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  distTag: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  centerCardTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 3,
  },
  centerCardLoc: {
    color: C.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  capLabel: {
    color: C.textMuted,
    fontSize: 11,
  },
  capValue: {
    color: C.textPrimary,
    fontSize: 11.5,
    fontWeight: "800",
  },
  capTrack: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 10,
  },
  capFill: {
    height: "100%",
    borderRadius: 99,
  },
  suppliesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  suppliesText: {
    color: C.textMuted,
    fontSize: 11,
    flex: 1,
  },
  newReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.cyan,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newReportBtnText: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 11,
  },
  reportItemCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  reportCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sosMiniBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.red,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  sosMiniText: {
    color: C.white,
    fontSize: 8.5,
    fontWeight: "900",
  },
  timeTag: {
    color: C.textMuted,
    fontSize: 10.5,
  },
  reportTitle: {
    color: C.textPrimary,
    fontSize: 14.5,
    fontWeight: "900",
    marginBottom: 3,
  },
  reportLoc: {
    color: C.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  reportMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  reportMetaPill: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: C.cyan,
    fontSize: 10.5,
    fontWeight: "800",
  },
  reportDetails: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  assignedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.cyanGlow,
    padding: 7,
    borderRadius: 7,
    marginTop: 8,
  },
  assignedText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  officialBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  sosActionRespondBtn: {
    backgroundColor: C.red,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sosActionRespondText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
  },
  ackBtn: {
    backgroundColor: C.amberPale,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  ackBtnText: {
    color: C.amber,
    fontSize: 11,
    fontWeight: "800",
  },
  dispatchBtn: {
    backgroundColor: C.cyanGlow,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  dispatchBtnText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  resolveBtn: {
    backgroundColor: C.greenPale,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  resolveBtnText: {
    color: C.green,
    fontSize: 11,
    fontWeight: "800",
  },
  hotlinesCard: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 6,
  },
  hotlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  hotlineNum: {
    color: C.cyan,
    fontSize: 16,
    fontWeight: "900",
  },
  hotlineName: {
    color: C.textPrimary,
    fontSize: 13.5,
    fontWeight: "900",
  },
  hotlineDesc: {
    color: C.textMuted,
    fontSize: 10.5,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  callBtnText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 74,
    backgroundColor: "#060D1A",
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 8,
  },
  navBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
  },
  centerSosBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    width: 64,
  },
  centerSosIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3.5,
    borderColor: "#060D1A",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  centerSosLabel: {
    color: "#F87171",
    fontSize: 9.5,
    fontWeight: "900",
    marginTop: 2,
  },
  navIconBox: {
    padding: 4,
    position: "relative",
  },
  navIconBoxActive: {
    backgroundColor: C.cyanGlow,
    borderRadius: 8,
  },
  navBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: C.red,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  navBadgeText: {
    color: C.white,
    fontSize: 8.5,
    fontWeight: "900",
  },
  navLabel: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.bgSurface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.borderLight,
    maxHeight: "85%",
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalTag: {
    color: C.cyan,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  modalTitle: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  modalSub: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  capModalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.bgCard,
    padding: 13,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.2)",
  },
  capModalNum: {
    fontSize: 16,
    fontWeight: "900",
    color: C.textPrimary,
  },
  modalSectionTitle: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 6,
    marginBottom: 8,
  },
  suppliesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  supplyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.2)",
  },
  supplyPillText: {
    color: C.textSecondary,
    fontSize: 11,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  outlineActionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.borderLight,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(6, 182, 212, 0.08)",
  },
  outlineActionText: {
    color: C.cyan,
    fontWeight: "800",
    fontSize: 12,
  },
  primaryActionBtnModal: {
    flex: 1.2,
    backgroundColor: C.cyan,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  primaryActionTextModal: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 12.5,
  },
  // Auth Modal Styles
  authTabRow: {
    flexDirection: "row",
    backgroundColor: C.bgCard,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  authTabBtnActive: {
    backgroundColor: C.cyan,
  },
  authTabText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  authTabTextActive: {
    color: C.bgPrimary,
  },
  roleSelectChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 8,
    borderRadius: 10,
  },
  roleSelectChipActive: {
    backgroundColor: C.cyan,
    borderColor: C.cyan,
  },
  roleSelectText: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  demoSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  demoLabel: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.4)",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  demoBtnText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bgCard,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    color: C.bgPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  profileName: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  profileEmail: {
    color: C.textMuted,
    fontSize: 11.5,
    marginTop: 1,
  },
  profileRoleBadge: {
    alignSelf: "flex-start",
    backgroundColor: C.cyanGlow,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 4,
  },
  profileRoleText: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: "900",
  },
  profileInfoBox: {
    backgroundColor: C.bgCard,
    padding: 12,
    borderRadius: 10,
  },
  profileInfoLabel: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "900",
  },
  profileInfoVal: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.redPale,
    borderWidth: 1,
    borderColor: C.redBorder,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  logoutText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "800",
  },
  // SOS Location Permission Box
  sosLocationBox: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sosLocationTitle: {
    color: C.textPrimary,
    fontSize: 12.5,
    fontWeight: "900",
  },
  sosLocationSub: {
    color: C.textSecondary,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
  },
  toggleBtn: {
    backgroundColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: C.cyan,
  },
  toggleBtnText: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "900",
  },
  depthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  depthChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  depthChipActive: {
    backgroundColor: C.cyan,
    borderColor: C.cyan,
  },
  depthChipIcon: {
    fontSize: 13,
  },
  depthChipText: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  countRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  countChip: {
    width: 38,
    height: 34,
    borderRadius: 8,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  countChipActive: {
    backgroundColor: C.cyan,
    borderColor: C.cyan,
  },
  countChipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "900",
  },
  confirmSosBtn: {
    backgroundColor: C.red,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  confirmSosText: {
    color: C.white,
    fontWeight: "900",
    fontSize: 13,
  },
  dial911Btn: {
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.redBorder,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  dial911Text: {
    color: C.red,
    fontWeight: "800",
    fontSize: 12,
  },
  // Responder SOS Modal Styles
  responderSosCard: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  responderSosTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  responderSosLoc: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  responderSosDetails: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  callVictimBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.cyanGlow,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.4)",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  callVictimText: {
    color: C.cyan,
    fontSize: 11.5,
    fontWeight: "800",
  },
  responderActionGrid: {
    gap: 8,
  },
  acceptRescueBtn: {
    backgroundColor: C.cyan,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptRescueText: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 13,
  },
  declineRescueBtn: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  declineRescueText: {
    color: C.textMuted,
    fontWeight: "800",
    fontSize: 12,
  },
  // Checklist Modal
  checkItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  checkItemLabel: {
    color: C.textMuted,
    fontSize: 12,
    flex: 1,
  },
  sectorOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: C.bgCard,
  },
  sectorOptionTitle: {
    color: C.textPrimary,
    fontWeight: "900",
    fontSize: 14,
  },
  sectorOptionSub: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: C.bgCard,
  },
  roleOptionActive: {
    borderColor: C.cyan,
    backgroundColor: C.cyanGlow,
  },
  roleOptionTitle: {
    color: C.textPrimary,
    fontWeight: "900",
    fontSize: 15,
  },
  roleOptionSub: {
    color: C.textMuted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  modalLabel: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  chipBtn: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  chipBtnActive: {
    backgroundColor: C.cyan,
    borderColor: C.cyan,
  },
  chipText: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  textInput: {
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: C.textPrimary,
    fontSize: 12.5,
  },
});
