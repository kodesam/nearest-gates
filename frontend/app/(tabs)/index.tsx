import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { KAABA_LOCATION } from '../../src/data/haramData';
import { formatDistance, bearing, bearingToArrow, haversineDistance } from '../../src/utils/location';
import NotificationBanner from '../../src/components/NotificationBanner';

const COLORS = {
  primary: '#1E3F20',
  secondary: '#C8A951',
  background: '#F9F7F3',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#4B5563',
  online: '#22C55E',
  offline: '#EF4444',
};

const DENSITY_COLORS: Record<string, string> = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  very_high: '#EF4444',
};

function getMapHtml() {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}
html,body,#map{width:100%;height:100%}
.user-dot{background:#2563EB;border:3px solid #fff;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 8px rgba(37,99,235,0.25)}
.gate-dot{border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
.amenity-dot{border:2px solid #fff;border-radius:50%;width:12px;height:12px;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
.kaaba-marker{background:#000;border:2px solid #C8A951;width:16px;height:16px;box-shadow:0 0 0 4px rgba(200,169,81,0.3)}
.leaflet-popup-content{font-family:system-ui;font-size:13px}
.leaflet-popup-content b{color:#1E3F20}
.density-badge{display:inline-block;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:bold;color:#fff;margin-top:4px}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([21.4225,39.8262],17);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd'}).addTo(map);
var kaabaIcon=L.divIcon({className:'',html:'<div class="kaaba-marker"></div>',iconSize:[20,20],iconAnchor:[10,10]});
L.marker([21.4225,39.8262],{icon:kaabaIcon}).addTo(map).bindPopup('<b>The Holy Kaaba</b>');
var userMarker=null,userCircle=null,gateLayer=L.layerGroup().addTo(map),amenityLayer=L.layerGroup().addTo(map),routeLine=null;
var densityColors={low:'#22C55E',medium:'#F59E0B',high:'#F97316',very_high:'#EF4444'};
function updateUser(lat,lng,acc){
  if(userMarker)map.removeLayer(userMarker);
  if(userCircle)map.removeLayer(userCircle);
  var icon=L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[24,24],iconAnchor:[12,12]});
  userMarker=L.marker([lat,lng],{icon:icon,zIndexOffset:1000}).addTo(map);
  if(acc&&acc<500)userCircle=L.circle([lat,lng],{radius:acc,fillColor:'#2563EB',fillOpacity:0.08,stroke:true,color:'#2563EB',weight:1,opacity:0.2}).addTo(map);
}
function setGates(gates,density){
  gateLayer.clearLayers();
  var dMap={};
  if(density)density.forEach(function(d){dMap[d.gate_id]=d});
  gates.forEach(function(g){
    var d=dMap[g.id];
    var color=d?densityColors[d.density_level]||'#1E3F20':'#1E3F20';
    var pct=d?d.density_percentage+'%':'N/A';
    var lvl=d?d.density_level:'unknown';
    var icon=L.divIcon({className:'',html:'<div class="gate-dot" style="background:'+color+'"></div>',iconSize:[18,18],iconAnchor:[9,9]});
    var badgeColor=d?densityColors[d.density_level]:'#999';
    var popup='<b>Gate '+g.number+'</b><br/>'+g.name_en+'<br/><span style="color:#666">'+g.name_ar+'</span><br/><span class="density-badge" style="background:'+badgeColor+'">'+lvl.replace('_',' ')+' ('+pct+')</span>';
    var m=L.marker([g.latitude,g.longitude],{icon:icon}).bindPopup(popup);
    m.on('click',function(){send({type:'gateSelect',gate:g})});
    gateLayer.addLayer(m);
  });
}
function setAmenities(list){
  amenityLayer.clearLayers();
  var colors={restaurant:'#EF4444',grocery:'#22C55E',bus_stop:'#3B82F6',taxi_stand:'#F59E0B',meqat:'#8B5CF6'};
  list.forEach(function(a){
    var c=colors[a.category]||'#C8A951';
    var icon=L.divIcon({className:'',html:'<div class="amenity-dot" style="background:'+c+'"></div>',iconSize:[16,16],iconAnchor:[8,8]});
    L.marker([a.latitude,a.longitude],{icon:icon}).bindPopup('<b>'+a.name+'</b><br/><span style="color:#666">'+a.category.replace(/_/g,' ')+'</span>').addTo(amenityLayer);
  });
}
function centerOn(lat,lng,zoom){map.flyTo([lat,lng],zoom||17,{duration:0.8})}
function showRoute(fLat,fLng,tLat,tLng){
  clearRoute();
  routeLine=L.polyline([[fLat,fLng],[tLat,tLng]],{color:'#3B82F6',weight:4,opacity:0.8,dashArray:'8,8'}).addTo(map);
  map.fitBounds(routeLine.getBounds(),{padding:[50,50]});
}
function clearRoute(){if(routeLine){map.removeLayer(routeLine);routeLine=null}}
var storedGates=[],storedDensity=[];
function handle(m){
  if(m.type==='loc')updateUser(m.lat,m.lng,m.acc);
  if(m.type==='gates'){storedGates=m.data;setGates(storedGates,storedDensity)}
  if(m.type==='density'){storedDensity=m.data;setGates(storedGates,storedDensity)}
  if(m.type==='amenities')setAmenities(m.data);
  if(m.type==='center')centerOn(m.lat,m.lng,m.zoom);
  if(m.type==='route')showRoute(m.fLat,m.fLng,m.tLat,m.tLng);
  if(m.type==='clearRoute')clearRoute();
}
function send(msg){
  try{window.parent.postMessage(JSON.stringify(msg),'*')}catch(e){}
  try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(msg))}catch(e){}
}
window.addEventListener('message',function(e){
  try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;handle(d)}catch(x){}
});
send({type:'ready'});
<\/script></body></html>`;
}

function WebMapView({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<any> }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const html = getMapHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.type) onMessage(data);
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  useEffect(() => {
    mapRef.current = {
      inject: (msg: object) => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), '*');
        }
      },
    };
  }, [mapRef]);

  if (!blobUrl) return null;

  return (
    <iframe
      ref={iframeRef}
      src={blobUrl}
      style={{ width: '100%', height: '100%', border: 'none' } as any}
      allow="geolocation"
    />
  );
}

function MobileMapView({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<any> }) {
  const WebView = require('react-native-webview').WebView;
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    mapRef.current = {
      inject: (msg: object) => {
        webViewRef.current?.injectJavaScript(`handle(${JSON.stringify(msg)});true;`);
      },
    };
  }, [mapRef]);

  return (
    <WebView
      ref={webViewRef}
      source={{ html: getMapHtml() }}
      style={{ flex: 1 }}
      onMessage={(event: any) => {
        try { onMessage(JSON.parse(event.nativeEvent.data)); } catch {}
      }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
    />
  );
}

export default function MapScreen() {
  const { userLocation, nearestGate, gates, amenities, isOnline, isLoading, densityMap, notifications, dismissNotification, recommendation, gatesWithDistance, locationError, retryLocation } = useApp();
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [showRouteVisible, setShowRouteVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  // Top 5 nearest gates
  const nearbyGates = useMemo(() => gatesWithDistance.slice(0, 5), [gatesWithDistance]);

  const inject = useCallback((msg: object) => { mapRef.current?.inject(msg); }, []);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'ready') setMapReady(true);
    if (data.type === 'gateSelect') setSelectedGate(data.gate);
  }, []);

  useEffect(() => {
    if (!mapReady || !userLocation) return;
    inject({ type: 'loc', lat: userLocation.latitude, lng: userLocation.longitude, acc: userLocation.accuracy });
  }, [userLocation, mapReady, inject]);

  useEffect(() => {
    if (!mapReady || gates.length === 0) return;
    inject({ type: 'gates', data: gates });
  }, [gates, mapReady, inject]);

  useEffect(() => {
    if (!mapReady || amenities.length === 0) return;
    inject({ type: 'amenities', data: amenities });
  }, [amenities, mapReady, inject]);

  // Send density data to map for color-coded markers
  useEffect(() => {
    if (!mapReady || Object.keys(densityMap).length === 0) return;
    inject({ type: 'density', data: Object.values(densityMap) });
  }, [densityMap, mapReady, inject]);

  const centerOnUser = () => {
    const loc = userLocation || KAABA_LOCATION;
    inject({ type: 'center', lat: loc.latitude, lng: loc.longitude, zoom: 18 });
  };
  const centerOnKaaba = () => {
    inject({ type: 'center', lat: KAABA_LOCATION.latitude, lng: KAABA_LOCATION.longitude, zoom: 18 });
  };
  const toggleRoute = () => {
    const gate = selectedGate || nearestGate;
    if (!gate) return;
    const fromLoc = userLocation || KAABA_LOCATION;
    if (showRouteVisible) {
      inject({ type: 'clearRoute' }); setShowRouteVisible(false);
    } else {
      inject({ type: 'route', fLat: fromLoc.latitude, fLng: fromLoc.longitude, tLat: gate.latitude, tLng: gate.longitude });
      setShowRouteVisible(true);
    }
  };

  const displayGate = selectedGate || nearestGate;
  const displayDistance = displayGate
    ? (displayGate.distance != null ? displayGate.distance
      : userLocation ? haversineDistance(userLocation.latitude, userLocation.longitude, displayGate.latitude, displayGate.longitude) : 0)
    : 0;
  const displayBearing = displayGate && userLocation
    ? bearing(userLocation.latitude, userLocation.longitude, displayGate.latitude, displayGate.longitude)
    : 0;

  const gateDensity = displayGate ? densityMap[displayGate.id] : null;
  const densityColor = gateDensity ? DENSITY_COLORS[gateDensity.density_level] || COLORS.textSecondary : null;

  const selectNearbyGate = (gate: any) => {
    setSelectedGate(gate);
    setPanelExpanded(false);
    setShowRouteVisible(false);
    inject({ type: 'clearRoute' });
    inject({ type: 'center', lat: gate.latitude, lng: gate.longitude, zoom: 18 });
  };

  // Get the latest unread notification
  const latestNotif = notifications.find((n) => !n.read) || null;

  return (
    <View style={styles.container} testID="map-screen">
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebMapView onMessage={handleMessage} mapRef={mapRef} />
        ) : (
          <MobileMapView onMessage={handleMessage} mapRef={mapRef} />
        )}
      </View>

      {/* Notification Banner */}
      <NotificationBanner
        notification={latestNotif}
        onDismiss={dismissNotification}
        onPress={(n) => {
          if (n.gate) {
            setSelectedGate(n.gate);
            inject({ type: 'center', lat: n.gate.latitude, lng: n.gate.longitude, zoom: 18 });
          }
          dismissNotification(n.id);
        }}
      />

      {/* Status Badge */}
      <SafeAreaView style={styles.statusContainer} edges={['top']}>
        <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]} testID="status-badge">
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.online : COLORS.offline }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </SafeAreaView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity testID="btn-center-user" style={styles.fab} onPress={centerOnUser} activeOpacity={0.8}>
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity testID="btn-center-kaaba" style={[styles.fab, { marginTop: 12 }]} onPress={centerOnKaaba} activeOpacity={0.8}>
          <Ionicons name="compass" size={22} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>

      {/* Location Error Banner */}
      {!userLocation && !isLoading && (
        <View style={styles.locationBanner} testID="location-error-banner">
          <View style={styles.locationBannerContent}>
            <Ionicons name="location-outline" size={20} color="#DC2626" />
            <View style={styles.locationBannerText}>
              <Text style={styles.locationBannerTitle}>Location not available</Text>
              <Text style={styles.locationBannerMsg}>
                {locationError || 'Enable location to see nearest gates from you'}
              </Text>
            </View>
            <TouchableOpacity
              testID="btn-enable-location"
              style={styles.locationBannerBtn}
              onPress={retryLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.locationBannerBtnText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Density Legend */}
      <View style={styles.legendContainer}>
        {['low', 'medium', 'high', 'very_high'].map((lvl) => (
          <View key={lvl} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DENSITY_COLORS[lvl] }]} />
            <Text style={styles.legendText}>{lvl === 'very_high' ? 'Full' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Panel */}
      {displayGate && (
        <View style={[styles.bottomPanel, panelExpanded && styles.bottomPanelExpanded]}>
          <TouchableOpacity
            testID="btn-toggle-panel"
            style={styles.panelDragArea}
            onPress={() => setPanelExpanded(!panelExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.panelDragIndicator} />
          </TouchableOpacity>
          <View style={styles.panelHeader}>
            <Text style={styles.panelLabel}>{selectedGate ? 'Selected Gate' : 'Nearest Gate'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                testID="btn-expand-nearby"
                onPress={() => setPanelExpanded(!panelExpanded)}
                style={styles.expandBtn}
              >
                <Ionicons name={panelExpanded ? 'chevron-down' : 'chevron-up'} size={16} color={COLORS.textSecondary} />
                <Text style={styles.expandBtnText}>{panelExpanded ? 'Less' : 'Nearby'}</Text>
              </TouchableOpacity>
              {selectedGate && (
                <TouchableOpacity testID="btn-clear-selection" onPress={() => { setSelectedGate(null); setShowRouteVisible(false); inject({ type: 'clearRoute' }); }}>
                  <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.panelContent}>
            <View style={[styles.gateIcon, gateDensity && { backgroundColor: densityColor || COLORS.primary }]}>
              <Ionicons name="enter" size={20} color={COLORS.surface} />
            </View>
            <View style={styles.panelMiddle}>
              <Text style={styles.panelGateName} numberOfLines={1}>{displayGate.name_en}</Text>
              <Text style={styles.panelGateArabic} numberOfLines={1}>{displayGate.name_ar} • Gate {displayGate.number}</Text>
              {gateDensity && (
                <View style={[styles.densityBadge, { backgroundColor: (densityColor || '#999') + '20' }]}>
                  <View style={[styles.densityDot, { backgroundColor: densityColor || '#999' }]} />
                  <Text style={[styles.densityText, { color: densityColor || '#999' }]}>
                    {gateDensity.density_level.replace('_', ' ')} ({gateDensity.density_percentage}%)
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.panelRight}>
              <Text style={styles.panelDistance}>{formatDistance(displayDistance)}</Text>
              <Text style={styles.panelDirection}>{bearingToArrow(displayBearing)} {displayGate.side}</Text>
            </View>
          </View>

          {/* Expanded: Nearby Gates List */}
          {panelExpanded && (
            <View style={styles.nearbySection}>
              <Text style={styles.nearbySectionTitle}>Nearest Gates From You</Text>
              <ScrollView style={styles.nearbyScroll} showsVerticalScrollIndicator={false}>
                {nearbyGates.map((gate, idx) => {
                  const gDensity = densityMap[gate.id];
                  const gColor = gDensity ? DENSITY_COLORS[gDensity.density_level] || '#999' : COLORS.primary;
                  const isSelected = displayGate?.id === gate.id;
                  const dir = userLocation
                    ? bearingToArrow(bearing(userLocation.latitude, userLocation.longitude, gate.latitude, gate.longitude))
                    : '';
                  return (
                    <TouchableOpacity
                      key={gate.id}
                      testID={`nearby-gate-${gate.id}`}
                      style={[styles.nearbyItem, isSelected && styles.nearbyItemSelected]}
                      onPress={() => selectNearbyGate(gate)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.nearbyRank}>
                        <Text style={styles.nearbyRankText}>{idx + 1}</Text>
                      </View>
                      <View style={[styles.nearbyDot, { backgroundColor: gColor }]} />
                      <View style={styles.nearbyInfo}>
                        <Text style={styles.nearbyName} numberOfLines={1}>{gate.name_en}</Text>
                        <Text style={styles.nearbyMeta} numberOfLines={1}>
                          Gate {gate.number} • {gate.side}
                          {gDensity ? ` • ${gDensity.density_level.replace('_', ' ')} (${gDensity.density_percentage}%)` : ''}
                        </Text>
                      </View>
                      <View style={styles.nearbyRight}>
                        <Text style={[styles.nearbyDist, { color: gColor }]}>{formatDistance(gate.distance)}</Text>
                        {dir ? <Text style={styles.nearbyDir}>{dir}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Recommendation Banner inside panel */}
          {recommendation && !selectedGate && !panelExpanded && recommendation.id !== nearestGate?.id && (
            <TouchableOpacity
              testID="btn-recommendation"
              style={styles.recBanner}
              onPress={() => {
                setSelectedGate(recommendation);
                inject({ type: 'center', lat: recommendation.latitude, lng: recommendation.longitude, zoom: 18 });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bulb" size={16} color="#F59E0B" />
              <Text style={styles.recText} numberOfLines={1}>
                Better option: {recommendation.name_en} — {recommendation.density_level.replace('_', ' ')} crowd
              </Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity testID="btn-show-route" style={[styles.routeButton, showRouteVisible && styles.routeButtonActive]} onPress={toggleRoute} activeOpacity={0.8}>
            <Ionicons name={showRouteVisible ? 'close' : 'navigate'} size={18} color={showRouteVisible ? COLORS.primary : COLORS.surface} />
            <Text style={[styles.routeButtonText, showRouteVisible && styles.routeButtonTextActive]}>{showRouteVisible ? 'Hide Route' : 'Show Route'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1 },
  statusContainer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 8 },
  statusOnline: { backgroundColor: 'rgba(255,255,255,0.95)' },
  statusOffline: { backgroundColor: 'rgba(255,240,240,0.95)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  fabContainer: { position: 'absolute', right: 16, bottom: 280, zIndex: 10 },
  fab: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  legendContainer: {
    position: 'absolute', left: 12, bottom: 280, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  locationBanner: {
    position: 'absolute', top: 40, left: 12, right: 12, zIndex: 15,
  },
  locationBannerContent: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FECACA', gap: 10,
  },
  locationBannerText: { flex: 1 },
  locationBannerTitle: { fontSize: 13, fontWeight: '700', color: '#991B1B' },
  locationBannerMsg: { fontSize: 11, color: '#B91C1C', marginTop: 2 },
  locationBannerBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3F20',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 4,
  },
  locationBannerBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 12, zIndex: 20, maxHeight: '75%',
  },
  bottomPanelExpanded: { maxHeight: '75%' },
  panelDragArea: { paddingTop: 12, paddingBottom: 8, alignItems: 'center' },
  panelDragIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelLabel: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  expandBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  expandBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  panelContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  panelMiddle: { flex: 1, marginRight: 12 },
  panelGateName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  panelGateArabic: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  densityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  densityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  densityText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  panelRight: { alignItems: 'flex-end' },
  panelDistance: { fontSize: 22, fontWeight: '300', color: COLORS.primary },
  panelDirection: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, gap: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  recText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400E' },
  nearbySection: { marginTop: 4, marginBottom: 10 },
  nearbySectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  nearbyScroll: { maxHeight: 240 },
  nearbyItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 4, backgroundColor: '#F9FAFB',
  },
  nearbyItemSelected: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: COLORS.primary + '40' },
  nearbyRank: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  nearbyRankText: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary },
  nearbyDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  nearbyInfo: { flex: 1, marginRight: 8 },
  nearbyName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  nearbyMeta: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },
  nearbyRight: { alignItems: 'flex-end' },
  nearbyDist: { fontSize: 15, fontWeight: '300' },
  nearbyDir: { fontSize: 11, color: COLORS.textSecondary },
  routeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: 24, paddingVertical: 14, gap: 8,
  },
  routeButtonActive: { backgroundColor: '#E5E7EB' },
  routeButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.surface },
  routeButtonTextActive: { color: COLORS.primary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,247,243,0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 30,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
});
