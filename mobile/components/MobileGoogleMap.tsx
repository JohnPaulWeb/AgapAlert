import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
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
  RotateCcw,
  RotateCw,
} from "lucide-react-native";

export interface MobileMapCenter {
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

export interface MobileMapIncident {
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

export interface MobileMapLocationPreset {
  id: string;
  name: string;
  region: string;
  riverName: string;
  riverLevel: number;
  stormSignal: number;
  lat: number;
  lng: number;
}

interface MobileGoogleMapProps {
  selectedLocation: MobileMapLocationPreset;
  centers: MobileMapCenter[];
  reports: MobileMapIncident[];
  liveRiverLevel: number;
  onSelectCenter: (center: MobileMapCenter) => void;
  onRequestSos?: () => void;
}

// Generate self-contained HTML for MapLibre GL with Google Maps tiles & full touch rotation controls
function generateMapHtml(
  centerLat: number,
  centerLng: number,
  centers: MobileMapCenter[],
  reports: MobileMapIncident[],
  riverLevel: number,
  locationName: string
) {
  const centersJson = JSON.stringify(centers);
  const reportsJson = JSON.stringify(reports);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; background: #070F1E; overflow: hidden; }
    .maplibregl-ctrl-attrib, .maplibregl-ctrl-logo { display: none !important; }
    
    .maplibregl-ctrl-top-right {
      top: 10px;
      right: 10px;
    }
    .maplibregl-ctrl-compass {
      background-color: rgba(15, 23, 42, 0.9) !important;
      border: 1px solid rgba(56, 189, 248, 0.4) !important;
      border-radius: 50% !important;
      width: 38px !important;
      height: 38px !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
    }
    .maplibregl-ctrl-compass .maplibregl-ctrl-icon {
      filter: invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    }
    
    .google-pin {
      position: relative;
      width: 36px;
      height: 46px;
      cursor: pointer;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
      transform: translate(-50%, -100%);
      transition: transform 0.15s ease-out;
    }
    .google-pin:active {
      transform: translate(-50%, -100%) scale(1.15);
    }
    
    .beds-chip {
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #f8fafc;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 9999px;
      white-space: nowrap;
      border: 1px solid #10b981;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .incident-pin {
      position: relative;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transform: translate(-50%, -50%);
      box-shadow: 0 3px 8px rgba(0,0,0,0.6);
      cursor: pointer;
    }

    .user-location-marker {
      width: 32px;
      height: 32px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    }
    .user-pulse-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(66, 133, 244, 0.4);
      animation: pulse 1.6s ease-out infinite;
    }
    .user-dot {
      position: relative;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4285F4;
      border: 2.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <script>
    var currentTileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    
    var map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'google-tiles': {
            type: 'raster',
            tiles: [currentTileUrl],
            tileSize: 256,
            attribution: 'Google Maps'
          }
        },
        layers: [
          {
            id: 'google-tiles-layer',
            type: 'raster',
            source: 'google-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [${centerLng}, ${centerLat}],
      zoom: 14,
      bearing: 0,
      pitch: 0,
      touchZoomRotate: true,
      touchPitch: true,
      dragRotate: true,
      pitchWithRotate: true,
      maxPitch: 65,
      attributionControl: false
    });

    // Native interactive compass
    map.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: false,
      visualizePitch: true
    }), 'top-right');

    var centersData = ${centersJson};
    var reportsData = ${reportsJson};
    var centerMarkers = [];
    var reportMarkers = [];
    var userLocationMarker = null;

    // Report rotation / pitch back to React Native
    function sendBearingUpdate() {
      var bearing = Math.round(map.getBearing());
      var pitch = Math.round(map.getPitch());
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MAP_ROTATION_UPDATE',
          bearing: bearing,
          pitch: pitch
        }));
      }
    }

    map.on('rotate', sendBearingUpdate);
    map.on('pitch', sendBearingUpdate);
    map.on('rotateend', sendBearingUpdate);

    // Setup GeoJSON layers once map style loads
    map.on('load', function() {
      // 1. Hazard Zones Polygon
      var hazardPolygon = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [${centerLng} - 0.003, ${centerLat} + 0.012],
            [${centerLng} + 0.002, ${centerLat} + 0.006],
            [${centerLng} + 0.005, ${centerLat} - 0.004],
            [${centerLng} - 0.001, ${centerLat} - 0.006],
            [${centerLng} - 0.007, ${centerLat} + 0.003],
            [${centerLng} - 0.003, ${centerLat} + 0.012]
          ]]
        }
      };

      map.addSource('hazard-zone-src', {
        type: 'geojson',
        data: hazardPolygon
      });

      map.addLayer({
        id: 'hazard-zone-fill',
        type: 'fill',
        source: 'hazard-zone-src',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.22
        }
      });

      map.addLayer({
        id: 'hazard-zone-line',
        type: 'line',
        source: 'hazard-zone-src',
        paint: {
          'line-color': '#ef4444',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // 2. Safe High-Ground Route Polyline
      var safeRoute = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [${centerLng} - 0.004, ${centerLat} - 0.015],
            [${centerLng} + 0.005, ${centerLat} - 0.005],
            [${centerLng} + 0.012, ${centerLat} + 0.002]
          ]
        }
      };

      map.addSource('safe-route-src', {
        type: 'geojson',
        data: safeRoute
      });

      map.addLayer({
        id: 'safe-route-line',
        type: 'line',
        source: 'safe-route-src',
        paint: {
          'line-color': '#0F9D58',
          'line-width': 4.5,
          'line-dasharray': [4, 3],
          'line-opacity': 0.85
        }
      });

      // 3. Dynamic Navigation Active Route
      map.addSource('nav-route-src', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.addLayer({
        id: 'nav-route-glow',
        type: 'line',
        source: 'nav-route-src',
        paint: {
          'line-color': '#1a73e8',
          'line-width': 9,
          'line-opacity': 0.45
        }
      });

      map.addLayer({
        id: 'nav-route-line',
        type: 'line',
        source: 'nav-route-src',
        paint: {
          'line-color': '#4285F4',
          'line-width': 6,
          'line-opacity': 0.95
        }
      });

      renderCenters(centersData);
      renderReports(reportsData);
      sendBearingUpdate();
    });

    // Render Centers
    function renderCenters(data) {
      centerMarkers.forEach(function(m) { m.remove(); });
      centerMarkers = [];

      data.forEach(function(c) {
        if (!c.lat || !c.lng) return;
        var isOpen = c.status === 'Open' && c.occupancy < c.capacity;
        var color = isOpen ? '#0F9D58' : '#EA4335';
        var beds = c.capacity - c.occupancy;

        var el = document.createElement('div');
        el.className = 'google-pin';
        el.innerHTML =
          '<svg width="36" height="46" viewBox="0 0 38 48" fill="none">' +
          '<path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48C19 48 38 31.5 38 19C38 8.5 29.5 0 19 0Z" fill="' + color + '"/>' +
          '<circle cx="19" cy="18" r="14" fill="#ffffff"/>' +
          '<text x="19" y="22" font-size="13" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="' + color + '">⌂</text>' +
          '</svg>' +
          '<div class="beds-chip" style="border-color:' + color + '">' + beds + ' beds</div>';

        el.addEventListener('click', function(e) {
          e.stopPropagation();
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_CENTER', centerId: c.id }));
          }
        });

        var marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([c.lng, c.lat])
          .addTo(map);

        centerMarkers.push(marker);
      });
    }

    // Render Incident Pins
    function renderReports(data) {
      reportMarkers.forEach(function(m) { m.remove(); });
      reportMarkers = [];

      data.forEach(function(r) {
        if (!r.lat || !r.lng) return;
        var isSos = r.category === 'sos' || r.priority === 'CRITICAL';
        var symbol = isSos ? '🚨' : '⚠️';

        var el = document.createElement('div');
        el.className = 'incident-pin';
        el.style.backgroundColor = isSos ? '#ef4444' : '#f59e0b';
        el.innerHTML = symbol;

        var marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([r.lng, r.lat])
          .addTo(map);

        reportMarkers.push(marker);
      });
    }

    // Update User GPS Marker
    function setUserLocation(lat, lng) {
      if (userLocationMarker) {
        userLocationMarker.setLngLat([lng, lat]);
      } else {
        var el = document.createElement('div');
        el.className = 'user-location-marker';
        el.innerHTML = '<div class="user-pulse-ring"></div><div class="user-dot"></div>';
        userLocationMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);
      }
    }

    // Messaging handler from React Native
    window.handleNativeMessage = function(msg) {
      try {
        var data = JSON.parse(msg);
        if (data.type === 'FLY_TO') {
          map.flyTo({ center: [data.lng, data.lat], zoom: 15, duration: 1000 });
        } else if (data.type === 'SET_BEARING') {
          map.easeTo({ bearing: data.bearing, duration: 400 });
        } else if (data.type === 'ROTATE_BY') {
          var targetBearing = map.getBearing() + data.delta;
          map.easeTo({ bearing: targetBearing, duration: 400 });
        } else if (data.type === 'RESET_NORTH') {
          map.easeTo({ bearing: 0, pitch: 0, duration: 500 });
        } else if (data.type === 'TOGGLE_PITCH') {
          var currentPitch = map.getPitch();
          var targetPitch = currentPitch > 20 ? 0 : 55;
          map.easeTo({ pitch: targetPitch, duration: 500 });
        } else if (data.type === 'SET_USER_POS') {
          setUserLocation(data.lat, data.lng);
          map.flyTo({ center: [data.lng, data.lat], zoom: 16, duration: 1000 });
        } else if (data.type === 'CHANGE_LAYER') {
          var url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
          if (data.layer === 'satellite' || data.layer === 'hybrid') {
            url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
          } else if (data.layer === 'terrain') {
            url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
          }
          currentTileUrl = url;
          if (map.getSource('google-tiles')) {
            map.removeLayer('google-tiles-layer');
            map.removeSource('google-tiles');
            map.addSource('google-tiles', {
              type: 'raster',
              tiles: [currentTileUrl],
              tileSize: 256
            });
            var firstLayerId = map.getLayer('hazard-zone-fill') ? 'hazard-zone-fill' : undefined;
            map.addLayer({
              id: 'google-tiles-layer',
              type: 'raster',
              source: 'google-tiles',
              minzoom: 0,
              maxzoom: 22
            }, firstLayerId);
          }
        } else if (data.type === 'DRAW_ROUTE') {
          var points = [
            [data.startLng, data.startLat],
            [(data.startLng + data.endLng)/2 - 0.0018, (data.startLat + data.endLat)/2 + 0.0015],
            [data.endLng, data.endLat]
          ];
          var src = map.getSource('nav-route-src');
          if (src) {
            src.setData({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: points
              }
            });
          }
          var minLng = Math.min(data.startLng, data.endLng) - 0.005;
          var maxLng = Math.max(data.startLng, data.endLng) + 0.005;
          var minLat = Math.min(data.startLat, data.endLat) - 0.005;
          var maxLat = Math.max(data.startLat, data.endLat) + 0.005;
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1000 });
        } else if (data.type === 'FILTER_CENTERS') {
          renderCenters(data.centers);
        }
      } catch(e) {}
    };

    document.addEventListener('message', function(e) { window.handleNativeMessage(e.data); });
    window.addEventListener('message', function(e) { window.handleNativeMessage(e.data); });
  </script>
</body>
</html>
  `;
}

export default function MobileGoogleMap({
  selectedLocation,
  centers,
  reports,
  liveRiverLevel,
  onSelectCenter,
  onRequestSos,
}: MobileGoogleMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Map state
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid" | "terrain">("standard");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChipFilter, setActiveChipFilter] = useState<"all" | "open" | "medical" | "pets" | "highground">("all");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showRotateMenu, setShowRotateMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);
  const [mapPitch, setMapPitch] = useState(0);

  // Selected place / active navigation route
  const [selectedCenter, setSelectedCenter] = useState<MobileMapCenter | null>(null);
  const [activeRouteCenter, setActiveRouteCenter] = useState<MobileMapCenter | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Generate HTML
  const mapHtml = useMemo(() => {
    return generateMapHtml(
      selectedLocation.lat,
      selectedLocation.lng,
      centers,
      reports,
      liveRiverLevel,
      selectedLocation.name
    );
  }, [selectedLocation.id]);

  // Send message to WebView
  const postToWeb = (msg: object) => {
    const json = JSON.stringify(msg);
    if (webViewRef.current) {
      webViewRef.current.postMessage(json);
      webViewRef.current.injectJavaScript(`if (window.handleNativeMessage) { window.handleNativeMessage('${json}'); } true;`);
    }
  };

  // Fly to location when sector changes
  useEffect(() => {
    postToWeb({
      type: "FLY_TO",
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    });
  }, [selectedLocation]);

  // Filter Centers by search & chips
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchQuery =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.barangay.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;

      if (activeChipFilter === "all") return true;
      if (activeChipFilter === "open") return c.status === "Open" && c.occupancy < c.capacity;
      if (activeChipFilter === "medical") return c.features.includes("Medical Aid");
      if (activeChipFilter === "pets") return c.features.includes("Pet Friendly");
      if (activeChipFilter === "highground") return c.features.includes("High Ground");
      return true;
    });
  }, [centers, searchQuery, activeChipFilter]);

  // Update filtered centers in webview
  useEffect(() => {
    postToWeb({
      type: "FILTER_CENTERS",
      centers: filteredCenters,
    });
  }, [filteredCenters]);

  // Rotation and Perspective controls
  const handleResetNorth = () => {
    postToWeb({ type: "RESET_NORTH" });
    setMapBearing(0);
    setMapPitch(0);
  };

  const handleRotateBy = (delta: number) => {
    postToWeb({ type: "ROTATE_BY", delta });
  };

  const handleTogglePitch = () => {
    postToWeb({ type: "TOGGLE_PITCH" });
  };

  // Request & Fetch User GPS Location
  const handleLocateMe = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(pos);
      setIsLocating(false);

      postToWeb({
        type: "SET_USER_POS",
        lat: pos.latitude,
        lng: pos.longitude,
      });
    } catch (e) {
      setIsLocating(false);
    }
  };

  // Draw Navigation Route to Center
  const handleStartRoute = (center: MobileMapCenter) => {
    setActiveRouteCenter(center);
    setSelectedCenter(center);

    const startPos = userLocation || { latitude: selectedLocation.lat, longitude: selectedLocation.lng };

    postToWeb({
      type: "DRAW_ROUTE",
      startLat: startPos.latitude,
      startLng: startPos.longitude,
      endLat: center.lat,
      endLng: center.lng,
    });
  };

  const handleOpenGoogleMaps = (center: MobileMapCenter) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${center.lat},${center.lng}(${encodeURIComponent(center.name)})`,
      android: `google.navigation:q=${center.lat},${center.lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`,
    });
    Linking.openURL(url || `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "SELECT_CENTER") {
        const found = centers.find((c) => c.id === data.centerId);
        if (found) {
          setSelectedCenter(found);
        }
      } else if (data.type === "MAP_ROTATION_UPDATE") {
        setMapBearing(data.bearing || 0);
        setMapPitch(data.pitch || 0);
      }
    } catch (e) {}
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* 1. Google Maps WebView Engine */}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={StyleSheet.absoluteFill}
        onMessage={handleMessage}
        onLoadEnd={() => setMapLoaded(true)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />

      {/* 2. Top Google Search Card & Filter Chips */}
      <View style={styles.topHudContainer}>
        {/* Floating Google Maps Style Search Card */}
        <View style={styles.searchCard}>
          <Search color="#06B6D4" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${selectedLocation.name} shelters...`}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} style={styles.iconButtonSmall}>
              <X color="#94A3B8" size={16} />
            </Pressable>
          ) : null}
          <View style={styles.searchDivider} />
          <Pressable onPress={handleLocateMe} style={styles.iconButtonSmall}>
            <Navigation color="#4285F4" size={18} />
          </Pressable>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.chipsRow}>
          {[
            { id: "all", label: `All (${centers.length})` },
            { id: "open", label: "Open Beds" },
            { id: "medical", label: "Medical Aid" },
            { id: "pets", label: "Pet Friendly" },
            { id: "highground", label: "High Ground" },
          ].map((chip) => (
            <Pressable
              key={chip.id}
              onPress={() => setActiveChipFilter(chip.id as any)}
              style={[
                styles.chip,
                activeChipFilter === chip.id ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  activeChipFilter === chip.id ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 3. Bottom Right Action Controls & Dynamic Compass */}
      <View style={styles.fabColumn}>
        {/* Dynamic Compass / Bearing Reset FAB */}
        <Pressable
          style={[
            styles.fab,
            (mapBearing !== 0 || mapPitch !== 0) && styles.fabActive,
          ]}
          onPress={handleResetNorth}
          onLongPress={() => setShowRotateMenu(!showRotateMenu)}
        >
          <View style={{ transform: [{ rotate: `${-mapBearing}deg` }] }}>
            <Compass
              color={mapBearing !== 0 || mapPitch !== 0 ? "#EF4444" : "#38BDF8"}
              size={20}
            />
          </View>
          {mapBearing !== 0 && (
            <View style={styles.bearingBadge}>
              <Text style={styles.bearingBadgeText}>{Math.abs(mapBearing)}°</Text>
            </View>
          )}
        </Pressable>

        {/* Rotate & 3D Tilt HUD Toggle */}
        <Pressable
          style={[styles.fab, showRotateMenu && styles.fabActive]}
          onPress={() => setShowRotateMenu(!showRotateMenu)}
        >
          <RotateCw color="#38BDF8" size={17} />
        </Pressable>

        {/* Fullscreen Toggle */}
        <Pressable
          style={styles.fab}
          onPress={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 color="#38BDF8" size={18} /> : <Maximize2 color="#38BDF8" size={18} />}
        </Pressable>

        {/* Layers Picker */}
        <Pressable
          style={[styles.fab, showLayerMenu && styles.fabActive]}
          onPress={() => setShowLayerMenu(!showLayerMenu)}
        >
          <Layers color="#38BDF8" size={18} />
        </Pressable>

        {/* Locate Me GPS */}
        <Pressable
          style={[styles.fab, isLocating && { opacity: 0.6 }]}
          onPress={handleLocateMe}
        >
          <LocateFixed color="#4285F4" size={20} />
        </Pressable>
      </View>

      {/* 4. Interactive Rotation & 3D Tilt HUD */}
      {showRotateMenu && (
        <View style={styles.rotateHudCard}>
          <View style={styles.rotateHudHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Compass color="#38BDF8" size={14} />
              <Text style={styles.rotateHudTitle}>
                Map Orientation ({mapBearing !== 0 ? `${mapBearing > 0 ? "+" : ""}${mapBearing}°` : "True North"})
              </Text>
            </View>
            <Pressable onPress={() => setShowRotateMenu(false)}>
              <X color="#94A3B8" size={15} />
            </Pressable>
          </View>

          <Text style={styles.rotateHintText}>
            Twist with 2 fingers or tap controls below:
          </Text>

          <View style={styles.rotateButtonsRow}>
            <Pressable
              style={styles.rotateBtn}
              onPress={() => handleRotateBy(-45)}
            >
              <RotateCcw color="#38BDF8" size={14} />
              <Text style={styles.rotateBtnText}>-45° Left</Text>
            </Pressable>

            <Pressable
              style={[styles.rotateBtn, mapBearing === 0 && styles.rotateBtnActive]}
              onPress={handleResetNorth}
            >
              <Compass color={mapBearing === 0 ? "#10B981" : "#EF4444"} size={14} />
              <Text style={[styles.rotateBtnText, mapBearing === 0 && { color: "#10B981" }]}>
                North 0°
              </Text>
            </Pressable>

            <Pressable
              style={styles.rotateBtn}
              onPress={() => handleRotateBy(45)}
            >
              <RotateCw color="#38BDF8" size={14} />
              <Text style={styles.rotateBtnText}>+45° Right</Text>
            </Pressable>

            <Pressable
              style={[styles.rotateBtn, mapPitch > 0 && styles.rotateBtnActive]}
              onPress={handleTogglePitch}
            >
              <Text style={[styles.rotateBtnText, mapPitch > 0 && { color: "#38BDF8" }]}>
                {mapPitch > 0 ? "2D Flat" : "3D Tilt (55°)"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 5. Layer Switcher Menu */}
      {showLayerMenu && (
        <View style={styles.layerPickerCard}>
          <View style={styles.layerPickerHeader}>
            <Text style={styles.layerPickerTitle}>Google Map Layer</Text>
            <Pressable onPress={() => setShowLayerMenu(false)}>
              <X color="#94A3B8" size={16} />
            </Pressable>
          </View>

          <View style={styles.layerButtonsRow}>
            {[
              { id: "standard", label: "Standard" },
              { id: "satellite", label: "Satellite" },
              { id: "terrain", label: "Terrain" },
            ].map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  setMapType(t.id as any);
                  postToWeb({ type: "CHANGE_LAYER", layer: t.id });
                  setShowLayerMenu(false);
                }}
                style={[
                  styles.layerBtn,
                  mapType === t.id && styles.layerBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.layerBtnText,
                    mapType === t.id && styles.layerBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 5. Turn-by-Turn Route Direction Card */}
      {activeRouteCenter && (
        <View style={styles.routeCard}>
          <View style={styles.routeCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.routeIconBadge}>
                <Navigation color="#FFFFFF" size={14} />
              </View>
              <View>
                <Text style={styles.routeMicroTag}>HIGH-GROUND NAVIGATION</Text>
                <Text style={styles.routeCenterName} numberOfLines={1}>
                  {activeRouteCenter.name}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setActiveRouteCenter(null)}>
              <X color="#94A3B8" size={16} />
            </Pressable>
          </View>

          <View style={styles.routeMetricsRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Footprints color="#10B981" size={14} />
              <Text style={styles.routeMetricText}>
                ~{Math.max(5, Math.round(parseFloat(activeRouteCenter.distance) * 11))} min walk
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Car color="#38BDF8" size={14} />
              <Text style={styles.routeMetricText}>
                ~{Math.max(3, Math.round(parseFloat(activeRouteCenter.distance) * 4))} min drive
              </Text>
            </View>
            <Text style={styles.routeDistanceText}>{activeRouteCenter.distance}</Text>
          </View>
        </View>
      )}

      {/* 6. Selected Center Place Bottom Sheet */}
      {selectedCenter && (
        <View style={styles.placeSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.sheetBadgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        selectedCenter.status === "Open"
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      borderColor:
                        selectedCenter.status === "Open" ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: selectedCenter.status === "Open" ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {selectedCenter.status === "Open" ? "OPEN & READY" : "FULL CAPACITY"}
                  </Text>
                </View>
                <Text style={styles.sheetDistance}>{selectedCenter.distance} away</Text>
              </View>

              <Text style={styles.sheetTitle}>{selectedCenter.name}</Text>
              <Text style={styles.sheetSub}>
                📍 {selectedCenter.barangay}, {selectedCenter.city} · {selectedCenter.elevation}
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedCenter(null)}
              style={styles.sheetCloseBtn}
            >
              <X color="#94A3B8" size={18} />
            </Pressable>
          </View>

          {/* Occupancy bar */}
          <View style={styles.sheetOccupancyBox}>
            <View style={styles.sheetOccupancyRow}>
              <Text style={styles.sheetOccupancyLabel}>Shelter Occupancy</Text>
              <Text style={styles.sheetOccupancyValue}>
                {selectedCenter.occupancy} / {selectedCenter.capacity} beds (
                {Math.round((selectedCenter.occupancy / selectedCenter.capacity) * 100)}%)
              </Text>
            </View>
            <View style={styles.sheetTrack}>
              <View
                style={[
                  styles.sheetFill,
                  {
                    width: `${Math.min(
                      (selectedCenter.occupancy / selectedCenter.capacity) * 100,
                      100
                    )}%`,
                    backgroundColor:
                      selectedCenter.status === "Open" ? "#10B981" : "#EF4444",
                  },
                ]}
              />
            </View>
          </View>

          {/* Action buttons: Directions, Google Maps, Call */}
          <View style={styles.sheetActionsRow}>
            <Pressable
              style={styles.primaryDirectionBtn}
              onPress={() => handleStartRoute(selectedCenter)}
            >
              <Navigation color="#FFFFFF" size={15} />
              <Text style={styles.primaryDirectionText}>Directions</Text>
            </Pressable>

            <Pressable
              style={styles.googleMapsBtn}
              onPress={() => handleOpenGoogleMaps(selectedCenter)}
            >
              <ExternalLink color="#38BDF8" size={15} />
              <Text style={styles.googleMapsBtnText}>Google Maps ↗</Text>
            </Pressable>
          </View>

          <View style={styles.sheetFooterRow}>
            <Pressable onPress={() => onSelectCenter(selectedCenter)}>
              <Text style={styles.sheetFooterLink}>View Full Inventory & Details →</Text>
            </Pressable>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              onPress={() => Linking.openURL(`tel:${selectedCenter.contact}`)}
            >
              <Phone color="#10B981" size={13} />
              <Text style={styles.sheetCallText}>Call Desk</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading Google Maps Telemetry...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 380,
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#070F1E",
    borderWidth: 1,
    borderColor: "#1E293B",
    position: "relative",
  },
  fullscreenContainer: {
    height: Dimensions.get("window").height - 120,
    borderRadius: 0,
    borderWidth: 0,
  },
  topHudContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    gap: 8,
  },
  searchCard: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 2,
  },
  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#334155",
  },
  iconButtonSmall: {
    padding: 4,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: "#2563EB",
  },
  chipInactive: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "#334155",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  chipTextInactive: {
    color: "#94A3B8",
  },
  fabColumn: {
    position: "absolute",
    bottom: 16,
    right: 14,
    zIndex: 20,
    gap: 8,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    position: "relative",
  },
  fabActive: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(14, 165, 233, 0.15)",
  },
  bearingBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  bearingBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },
  rotateHudCard: {
    position: "absolute",
    bottom: 64,
    right: 14,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 12,
    width: 230,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    zIndex: 35,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
  },
  rotateHudHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rotateHudTitle: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "800",
  },
  rotateHintText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "500",
  },
  rotateButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rotateBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1E293B",
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  rotateBtnActive: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38BDF8",
  },
  rotateBtnText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  layerPickerCard: {
    position: "absolute",
    bottom: 64,
    right: 14,
    backgroundColor: "#0F172A",
    borderRadius: 18,
    padding: 12,
    width: 200,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 30,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    gap: 8,
  },
  layerPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layerPickerTitle: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },
  layerButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  layerBtn: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1E293B",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  layerBtnActive: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderColor: "#2563EB",
  },
  layerBtnText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  layerBtnTextActive: {
    color: "#60A5FA",
  },
  routeCard: {
    position: "absolute",
    top: 96,
    left: 12,
    right: 12,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(66, 133, 244, 0.5)",
    zIndex: 25,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    gap: 6,
  },
  routeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  routeMicroTag: {
    color: "#60A5FA",
    fontSize: 8,
    fontWeight: "900",
  },
  routeCenterName: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },
  routeMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  routeMetricText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "700",
  },
  routeDistanceText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "900",
  },
  placeSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0B1728",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    zIndex: 40,
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    gap: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },
  sheetDistance: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },
  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  sheetSub: {
    color: "#94A3B8",
    fontSize: 10,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetOccupancyBox: {
    backgroundColor: "#11223A",
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  sheetOccupancyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetOccupancyLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  sheetOccupancyValue: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
  },
  sheetTrack: {
    height: 5,
    backgroundColor: "#1E293B",
    borderRadius: 3,
    overflow: "hidden",
  },
  sheetFill: {
    height: "100%",
    borderRadius: 3,
  },
  sheetActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryDirectionBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryDirectionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  googleMapsBtn: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  googleMapsBtnText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "800",
  },
  sheetFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  sheetFooterLink: {
    color: "#06B6D4",
    fontSize: 11,
    fontWeight: "700",
  },
  sheetCallText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#070F1E",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
});
