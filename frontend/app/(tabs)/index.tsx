import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { KAABA_LOCATION } from '../../src/data/haramData';
import { formatDistance, bearing, bearingToArrow, haversineDistance } from '../../src/utils/location';

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
.gate-dot{background:#1E3F20;border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
.amenity-dot{border:2px solid #fff;border-radius:50%;width:12px;height:12px;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
.kaaba-marker{background:#000;border:2px solid #C8A951;width:16px;height:16px;box-shadow:0 0 0 4px rgba(200,169,81,0.3)}
.leaflet-popup-content{font-family:system-ui;font-size:13px}
.leaflet-popup-content b{color:#1E3F20}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([21.4225,39.8262],17);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd'}).addTo(map);
var kaabaIcon=L.divIcon({className:'',html:'<div class="kaaba-marker"></div>',iconSize:[20,20],iconAnchor:[10,10]});
L.marker([21.4225,39.8262],{icon:kaabaIcon}).addTo(map).bindPopup('<b>The Holy Kaaba</b>');
var userMarker=null,userCircle=null,gateLayer=L.layerGroup().addTo(map),amenityLayer=L.layerGroup().addTo(map),routeLine=null;
function updateUser(lat,lng,acc){
  if(userMarker)map.removeLayer(userMarker);
  if(userCircle)map.removeLayer(userCircle);
  var icon=L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[24,24],iconAnchor:[12,12]});
  userMarker=L.marker([lat,lng],{icon:icon,zIndexOffset:1000}).addTo(map);
  if(acc&&acc<500)userCircle=L.circle([lat,lng],{radius:acc,fillColor:'#2563EB',fillOpacity:0.08,stroke:true,color:'#2563EB',weight:1,opacity:0.2}).addTo(map);
}
function setGates(gates){
  gateLayer.clearLayers();
  gates.forEach(function(g){
    var icon=L.divIcon({className:'',html:'<div class="gate-dot"></div>',iconSize:[18,18],iconAnchor:[9,9]});
    var m=L.marker([g.latitude,g.longitude],{icon:icon}).bindPopup('<b>Gate '+g.number+'</b><br/>'+g.name_en+'<br/><span style="color:#666">'+g.name_ar+'</span>');
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
function handle(m){
  if(m.type==='loc')updateUser(m.lat,m.lng,m.acc);
  if(m.type==='gates')setGates(m.data);
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
        try {
          const data = JSON.parse(event.nativeEvent.data);
          onMessage(data);
        } catch {}
      }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
    />
  );
}

export default function MapScreen() {
  const { userLocation, nearestGate, gates, amenities, isOnline, isLoading } = useApp();
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [showRouteVisible, setShowRouteVisible] = useState(false);

  const inject = useCallback((msg: object) => {
    mapRef.current?.inject(msg);
  }, []);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'ready') setMapReady(true);
    if (data.type === 'gateSelect') setSelectedGate(data.gate);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    if (userLocation) {
      inject({ type: 'loc', lat: userLocation.latitude, lng: userLocation.longitude, acc: userLocation.accuracy });
    }
  }, [userLocation, mapReady, inject]);

  useEffect(() => {
    if (!mapReady || gates.length === 0) return;
    inject({ type: 'gates', data: gates });
  }, [gates, mapReady, inject]);

  useEffect(() => {
    if (!mapReady || amenities.length === 0) return;
    inject({ type: 'amenities', data: amenities });
  }, [amenities, mapReady, inject]);

  const centerOnUser = () => {
    if (userLocation) inject({ type: 'center', lat: userLocation.latitude, lng: userLocation.longitude, zoom: 18 });
  };

  const centerOnKaaba = () => {
    inject({ type: 'center', lat: KAABA_LOCATION.latitude, lng: KAABA_LOCATION.longitude, zoom: 18 });
  };

  const toggleRoute = () => {
    const gate = selectedGate || nearestGate;
    if (!gate || !userLocation) return;
    if (showRouteVisible) {
      inject({ type: 'clearRoute' });
      setShowRouteVisible(false);
    } else {
      inject({ type: 'route', fLat: userLocation.latitude, fLng: userLocation.longitude, tLat: gate.latitude, tLng: gate.longitude });
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

  return (
    <View style={styles.container} testID="map-screen">
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebMapView onMessage={handleMessage} mapRef={mapRef} />
        ) : (
          <MobileMapView onMessage={handleMessage} mapRef={mapRef} />
        )}
      </View>

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

      {/* Bottom Panel */}
      {displayGate && (
        <View style={styles.bottomPanel}>
          <View style={styles.panelDragIndicator} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelLabel}>{selectedGate ? 'Selected Gate' : 'Nearest Gate'}</Text>
            {selectedGate && (
              <TouchableOpacity testID="btn-clear-selection" onPress={() => { setSelectedGate(null); setShowRouteVisible(false); inject({ type: 'clearRoute' }); }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.panelContent}>
            <View style={styles.gateIcon}>
              <Ionicons name="enter" size={20} color={COLORS.surface} />
            </View>
            <View style={styles.panelMiddle}>
              <Text style={styles.panelGateName} numberOfLines={1}>{displayGate.name_en}</Text>
              <Text style={styles.panelGateArabic} numberOfLines={1}>{displayGate.name_ar} • Gate {displayGate.number}</Text>
            </View>
            <View style={styles.panelRight}>
              <Text style={styles.panelDistance}>{formatDistance(displayDistance)}</Text>
              <Text style={styles.panelDirection}>{bearingToArrow(displayBearing)} {displayGate.side}</Text>
            </View>
          </View>
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
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginTop: 8,
  },
  statusOnline: { backgroundColor: 'rgba(255,255,255,0.95)' },
  statusOffline: { backgroundColor: 'rgba(255,240,240,0.95)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  fabContainer: { position: 'absolute', right: 16, bottom: 230, zIndex: 10 },
  fab: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
  },
  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 12, zIndex: 20,
  },
  panelDragIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 12 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelLabel: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  panelContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  gateIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  panelMiddle: { flex: 1, marginRight: 12 },
  panelGateName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  panelGateArabic: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  panelRight: { alignItems: 'flex-end' },
  panelDistance: { fontSize: 22, fontWeight: '300', color: COLORS.primary },
  panelDirection: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
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
