import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Flame,
  HeartHandshake,
  Home,
  Info,
  Layers,
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

// Unified Dark Disaster Palette matching Desktop
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

type Role = "resident" | "official";
type Screen = "radar" | "centers" | "reports" | "settings";

interface LocationPreset {
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

const LOCATIONS: LocationPreset[] = [
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
    id: "qc",
    name: "Quezon City",
    region: "Northern Metro Manila",
    riverName: "Tullahan River",
    riverLevel: 14.8,
    stormSignal: 2,
    windSpeed: 62,
    rainRate: 15,
    status: "Watch",
    lat: 14.6760,
    lng: 121.0437,
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
    supplies: ["Clean Water", "Ready-to-Eat Rice", "Hygiene Packs", "Infant Milk"],
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
    supplies: ["Hot Meals", "Canned Goods", "Flashlights"],
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
    details: "4 families stranded on 2nd floor, water rising 10cm every 15 mins. Rescue boat requested.",
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
    details: "Elderly resident needs ambulance transport to high-ground hospital.",
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
    title: "Fallen tree blocking Tumana Bridge exit",
    location: "Tumana Bridge approach",
    timestamp: "1 hr ago",
    status: "RESOLVED",
    priority: "MEDIUM",
    details: "Barangay clearing crew removed debris. Road is now passable.",
    lat: 14.6575,
    lng: 121.1012,
  },
];

export default function App() {
  const [role, setRole] = useState<Role>("resident");
  const [screen, setScreen] = useState<Screen>("radar");
  const [selectedLoc, setSelectedLoc] = useState<LocationPreset>(LOCATIONS[0]);
  
  // Real-time live disaster simulation state
  const [liveRiverLevel, setLiveRiverLevel] = useState(LOCATIONS[0].riverLevel);
  const [liveRainRate, setLiveRainRate] = useState(LOCATIONS[0].rainRate);
  const [liveWindSpeed, setLiveWindSpeed] = useState(LOCATIONS[0].windSpeed);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");

  // Centers & Reports State
  const [centers, setCenters] = useState<EvacCenter[]>(INITIAL_CENTERS);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS);

  // Modals & Drawers
  const [selectedCenter, setSelectedCenter] = useState<EvacCenter | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

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
      const delta = (Math.random() - 0.48) * 0.04;
      setLiveRiverLevel((prev) => Math.round((prev + delta) * 100) / 100);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  async function initialize() {
    setupNotificationHandler();
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const address = await Location.reverseGeocodeAsync(pos.coords);
        const city = address[0]?.city || address[0]?.district;
        if (city) {
          await AsyncStorage.setItem("agapalert_city", city);
        }
      }
    } catch {
      // ignore
    }
    await requestNotificationPermissions();
  }

  // Flood Alarm Level calculation based on river telemetry
  const alarmInfo = useMemo(() => {
    if (liveRiverLevel >= 18.0) {
      return { level: 3, title: "ALARM 3: FORCED EVACUATION", color: C.red, bg: C.redPale };
    }
    if (liveRiverLevel >= 16.0) {
      return { level: 2, title: "ALARM 2: PREPARATORY EVACUATION", color: C.amber, bg: C.amberPale };
    }
    if (liveRiverLevel >= 15.0) {
      return { level: 1, title: "ALARM 1: WARNING MONITORING", color: "#FACC15", bg: "rgba(250, 204, 21, 0.15)" };
    }
    return { level: 0, title: "NORMAL WATER LEVEL", color: C.green, bg: C.greenPale };
  }, [liveRiverLevel]);

  // Simulate water level spike
  const triggerSimulationSpike = () => {
    setIsSimulatingSpike(true);
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

  const handleCreateReport = (newRep: Omit<IncidentReport, "id" | "timestamp" | "status">) => {
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
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
    Alert.alert("Report Transmitted", "Your incident report has been queued and plotted on the Live Google Map.");
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

      {/* 2. Top Command Header */}
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
          <Pressable
            style={[styles.roleSwitchBtn, official && styles.roleSwitchBtnOfficial]}
            onPress={() => setShowRoleModal(true)}
          >
            {official ? <ShieldCheck color={C.white} size={14} /> : <Users color={C.cyan} size={14} />}
            <Text style={[styles.roleSwitchText, official && { color: C.white }]}>
              {official ? "OFFICIAL" : "RESIDENT"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.quickSosBtn}
            onPress={() => setShowSosModal(true)}
          >
            <Siren color={C.white} size={15} />
            <Text style={styles.quickSosText}>SOS</Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Main Scrollable View */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Sector Selector & Simulation Trigger */}
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
              {isSimulatingSpike ? "Rising..." : "Test Water Surge"}
            </Text>
          </Pressable>
        </View>

        {/* 4. Live Disaster Telemetry Cards */}
        <View style={styles.telemetryGrid}>
          {/* River Water Gauge Card */}
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

            {/* Gauge Progress Bar */}
            <View style={styles.gaugeTrack}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${Math.min(((liveRiverLevel - 13) / (20 - 13)) * 100, 100)}%`,
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
            <Text style={styles.cardSub}>Signal #{selectedLoc.stormSignal} Storm Force</Text>
          </View>
        </View>

        {/* 5. Tab Views */}
        {screen === "radar" && (
          <View style={{ gap: 14 }}>
            {/* Live Interactive Google Map */}
            <View style={{ gap: 8 }}>
              <View style={styles.radarHead}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Crosshair color={C.cyan} size={16} />
                  <Text style={styles.radarTitle}>Live Hazard & Evacuation Map</Text>
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
              />
            </View>

            {/* Critical Alert Warning Card */}
            <View style={styles.warningCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <AlertTriangle color={C.red} size={16} />
                <Text style={styles.warningTag}>{alarmInfo.title}</Text>
              </View>
              <Text style={styles.warningHeading}>Marikina River Alert Active</Text>
              <Text style={styles.warningBody}>
                Water level is at {liveRiverLevel}m. Residents in low-lying river corridors are advised to evacuate to designated centers immediately.
              </Text>

              <View style={styles.actionBtnRow}>
                <Pressable
                  style={styles.primaryActionBtn}
                  onPress={() => setSelectedCenter(centers[0])}
                >
                  <Navigation color={C.bgPrimary} size={15} />
                  <Text style={styles.primaryActionText}>Route to Sports Center</Text>
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

        {/* TAB: Centers */}
        {screen === "centers" && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Safe Evacuation Centers</Text>
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

        {/* TAB: Reports */}
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
              <View key={rep.id} style={styles.reportItemCard}>
                <View style={styles.reportCardHead}>
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
                  <Text style={styles.timeTag}>{rep.timestamp}</Text>
                </View>

                <Text style={styles.reportTitle}>{rep.title}</Text>
                <Text style={styles.reportLoc}>📍 {rep.location}</Text>
                <Text style={styles.reportDetails}>{rep.details}</Text>

                {official && (
                  <View style={styles.officialBtnRow}>
                    {rep.status === "NEW" && (
                      <Pressable
                        style={styles.ackBtn}
                        onPress={() => handleUpdateStatus(rep.id, "ACKNOWLEDGED")}
                      >
                        <Text style={styles.ackBtnText}>Acknowledge</Text>
                      </Pressable>
                    )}
                    {rep.status === "ACKNOWLEDGED" && (
                      <Pressable
                        style={styles.dispatchBtn}
                        onPress={() => handleUpdateStatus(rep.id, "DISPATCHED")}
                      >
                        <Text style={styles.dispatchBtnText}>Dispatch Rescue</Text>
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
              </View>
            ))}
          </View>
        )}

        {/* TAB: Settings & Hotlines */}
        {screen === "settings" && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Hotlines & System</Text>
            </View>

            <View style={styles.hotlinesCard}>
              <HotlineItem num="911" name="National Emergency" desc="Police, Fire, Medical Rescue" />
              <HotlineItem num="143" name="Philippine Red Cross" desc="Disaster response & ambulance" />
              <HotlineItem num="161" name="Marikina Rescue" desc="River flood & boat dispatch" />
              <HotlineItem num="(02) 8911-1406" name="NDRRMC Command" desc="National warning center" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* 6. Floating Bottom Navigation */}
      <View style={styles.bottomNav}>
        <NavBtn
          icon={<Radio size={20} color={screen === "radar" ? C.cyan : C.textMuted} />}
          label="Live Radar"
          active={screen === "radar"}
          onPress={() => setScreen("radar")}
        />
        <NavBtn
          icon={<Home size={20} color={screen === "centers" ? C.cyan : C.textMuted} />}
          label="Evac Centers"
          active={screen === "centers"}
          onPress={() => setScreen("centers")}
        />
        <NavBtn
          icon={<Layers size={20} color={screen === "reports" ? C.cyan : C.textMuted} />}
          label={official ? "Queue" : "Reports"}
          active={screen === "reports"}
          badge={reports.filter((r) => r.status === "NEW").length}
          onPress={() => setScreen("reports")}
        />
        <NavBtn
          icon={<Phone size={20} color={screen === "settings" ? C.cyan : C.textMuted} />}
          label="Hotlines"
          active={screen === "settings"}
          onPress={() => setScreen("settings")}
        />
      </View>

      {/* 7. Center Details Modal */}
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

            {/* Occupancy info */}
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

      {/* 8. Emergency SOS Confirmation Modal */}
      <Modal visible={showSosModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { borderColor: C.red, borderWidth: 1.5 }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={[styles.modalTag, { color: C.red }]}>EMERGENCY SOS BEACON</Text>
                <Text style={styles.modalTitle}>Broadcast Rescue Beacon?</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowSosModal(false)}>
                <X color={C.textPrimary} size={18} />
              </Pressable>
            </View>

            <View style={styles.sosAlertBox}>
              <Siren color={C.red} size={30} />
              <Text style={styles.sosAlertTitle}>Immediate Rescue Beacon</Text>
              <Text style={styles.sosAlertDesc}>
                This sends your live GPS coordinates directly to the Barangay Quick Response Command and rescue boat operators.
              </Text>
            </View>

            <Pressable
              style={styles.confirmSosBtn}
              onPress={() => {
                setShowSosModal(false);
                handleCreateReport({
                  category: "sos",
                  title: "CRITICAL SOS: Rescue Beacon Activated",
                  location: selectedLoc.name,
                  priority: "CRITICAL",
                  details: "Resident activated emergency SOS beacon requesting immediate rescue dispatch.",
                });
              }}
            >
              <Siren color={C.white} size={18} />
              <Text style={styles.confirmSosText}>CONFIRM RESCUE BEACON</Text>
            </Pressable>

            <Pressable
              style={styles.dial911Btn}
              onPress={() => Alert.alert("Emergency Dial", "Dialing 911...")}
            >
              <Phone color={C.red} size={15} />
              <Text style={styles.dial911Text}>Call 911 Direct</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 9. Go-Bag Checklist Modal */}
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

            <ScrollView style={{ maxHeight: 320 }}>
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
              style={styles.primaryActionBtnModal}
              onPress={() => setShowChecklistModal(false)}
            >
              <Text style={styles.primaryActionTextModal}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 10. Sector Picker Modal */}
      <Modal visible={showSectorModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Select Monitoring Sector</Text>
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

      {/* 11. Role Switcher Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Switch Workspace</Text>
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
                <Text style={styles.roleOptionSub}>View live radar, open evacuation beds, and submit SOS reports.</Text>
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
                <Text style={styles.roleOptionSub}>Manage live incident queue, update relief stock & center capacity.</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 12. New Report Modal */}
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
// Sub-components
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
              if (!title) setTitle("Rising flood water");
            }}
          >
            <Text style={[styles.chipText, category === "flood" && { color: C.bgPrimary }]}>🌊 Flood</Text>
          </Pressable>
          <Pressable
            style={[styles.chipBtn, category === "medical" && styles.chipBtnActive]}
            onPress={() => {
              setCategory("medical");
              if (!title) setTitle("Medical evacuation needed");
            }}
          >
            <Text style={[styles.chipText, category === "medical" && { color: C.bgPrimary }]}>🚑 Medical</Text>
          </Pressable>
          <Pressable
            style={[styles.chipBtn, category === "relief" && styles.chipBtnActive]}
            onPress={() => {
              setCategory("relief");
              if (!title) setTitle("Relief goods request");
            }}
          >
            <Text style={[styles.chipText, category === "relief" && { color: C.bgPrimary }]}>📦 Relief</Text>
          </Pressable>
        </View>

        <Text style={styles.modalLabel}>TITLE</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Waist-deep water near Katipunan St."
          placeholderTextColor={C.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.modalLabel, { marginTop: 8 }]}>LOCATION / LANDMARK</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Concepcion Uno, near bridge"
          placeholderTextColor={C.textMuted}
          value={loc}
          onChangeText={setLoc}
        />

        <Text style={[styles.modalLabel, { marginTop: 8 }]}>DETAILS</Text>
        <TextInput
          style={[styles.textInput, { height: 70, textAlignVertical: "top" }]}
          placeholder="Number of stranded people, water depth..."
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
        onPress={() => Alert.alert("Hotline", `Calling ${num}...`)}
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
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 99,
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
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
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
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
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
    letterSpacing: 1.2,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
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
  roleSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.cyanGlow,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleSwitchBtnOfficial: {
    backgroundColor: "rgba(30, 58, 138, 0.5)",
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  roleSwitchText: {
    color: C.cyan,
    fontSize: 10.5,
    fontWeight: "800",
  },
  quickSosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.red,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  quickSosText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "900",
  },
  scroll: {
    padding: 16,
    paddingBottom: 110,
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
    fontSize: 14,
    fontWeight: "800",
    marginTop: 1,
  },
  simSpikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.amberPale,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
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
    padding: 13,
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
    fontSize: 26,
    fontWeight: "900",
    color: C.textPrimary,
  },
  metricUnit: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: "600",
  },
  gaugeTrack: {
    height: 5,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: "hidden",
    marginVertical: 6,
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
  // Radar Box
  radarBox: {
    backgroundColor: C.bgSurface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 14,
  },
  radarHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  radarTitle: {
    color: C.textPrimary,
    fontWeight: "800",
    fontSize: 13,
  },
  syncText: {
    color: C.textMuted,
    fontSize: 10,
  },
  mapCanvas: {
    height: 180,
    backgroundColor: "#050B14",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  mapRiverFlow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "40%",
    width: 28,
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    transform: [{ skewX: "-15deg" }],
  },
  mapPin: {
    position: "absolute",
  },
  pinCenterBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  pinCenterText: {
    color: C.bgPrimary,
    fontWeight: "900",
    fontSize: 13,
  },
  pinHazardBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.red,
    alignItems: "center",
    justifyContent: "center",
  },
  safeRouteBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(7, 15, 30, 0.85)",
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  safeRouteText: {
    color: C.cyan,
    fontSize: 9.5,
    fontWeight: "800",
  },
  // Warning Card
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
    marginBottom: 4,
  },
  warningBody: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: C.cyan,
    paddingVertical: 10,
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
    paddingVertical: 10,
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
  // Centers Tab
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
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
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  distTag: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  centerCardTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  centerCardLoc: {
    color: C.textSecondary,
    fontSize: 11.5,
    marginBottom: 10,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
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
    height: 5,
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
  // Reports Tab
  newReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.cyan,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
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
  },
  reportCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  timeTag: {
    color: C.textMuted,
    fontSize: 10.5,
  },
  reportTitle: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  reportLoc: {
    color: C.textSecondary,
    fontSize: 11.5,
    marginBottom: 4,
  },
  reportDetails: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  officialBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  ackBtn: {
    backgroundColor: C.amberPale,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  ackBtnText: {
    color: C.amber,
    fontSize: 11,
    fontWeight: "800",
  },
  dispatchBtn: {
    backgroundColor: C.cyanGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dispatchBtnText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  resolveBtn: {
    backgroundColor: C.greenPale,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resolveBtnText: {
    color: C.green,
    fontSize: 11,
    fontWeight: "800",
  },
  // Hotlines
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
    fontSize: 13,
    fontWeight: "800",
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
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callBtnText: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: "800",
  },
  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: "#060D1A",
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  navBtn: {
    alignItems: "center",
    width: 70,
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
    fontWeight: "700",
    marginTop: 3,
  },
  // Modals
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
    marginTop: 2,
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
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  supplyPillText: {
    color: C.textSecondary,
    fontSize: 11,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  outlineActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.borderLight,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  outlineActionText: {
    color: C.cyan,
    fontWeight: "800",
    fontSize: 12.5,
  },
  primaryActionBtnModal: {
    flex: 1.3,
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
  // SOS Modal
  sosAlertBox: {
    backgroundColor: C.redPale,
    borderWidth: 1,
    borderColor: C.redBorder,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginVertical: 10,
  },
  sosAlertTitle: {
    color: C.red,
    fontWeight: "900",
    fontSize: 15,
    marginTop: 6,
  },
  sosAlertDesc: {
    color: "#FECACA",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },
  confirmSosBtn: {
    backgroundColor: C.red,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  confirmSosText: {
    color: C.white,
    fontWeight: "900",
    fontSize: 13,
  },
  dial911Btn: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
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
  // Options
  sectorOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectorOptionTitle: {
    color: C.textPrimary,
    fontWeight: "800",
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
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    marginBottom: 10,
  },
  roleOptionActive: {
    borderColor: C.cyan,
    backgroundColor: C.cyanGlow,
  },
  roleOptionTitle: {
    color: C.textPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  roleOptionSub: {
    color: C.textMuted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  // Inputs
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
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 7,
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.textPrimary,
    fontSize: 12.5,
  },
});
