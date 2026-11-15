import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NABAWI_GATES, NABAWI_CENTER } from '../src/data/nabawiData';
import { haversineDistance, bearing, bearingToArrow, formatDistance } from '../src/utils/location';
import { useApp } from '../src/context/AppContext';

const COLORS = {
  primary: '#1E3F20', secondary: '#C8A951', background: '#F9F7F3',
  surface: '#FFFFFF', text: '#111827', textSecondary: '#4B5563', border: '#E5E7EB',
};

const MAP_HTML = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}html,body,#map{width:100%;height:100%}
.user-dot{background:#2563EB;border:3px solid #fff;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 8px rgba(37,99,235,0.25)}
.gate-dot{border:2px solid #fff;border-radius:50%;width:22px;height:22px;background:#1E3F20;color:#fff;font:700 11px/22px system-ui;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.35)}
.gate-dot.sel{background:#C8A951;width:28px;height:28px;line-height:28px}
.leaflet-popup-content{font-family:system-ui;font-size:13px}
</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([24.4672,39.6112],17);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2u1v_1_7b9a4ce23c1630ee1d947519',{maxZoom:20,subdomains:'abcd'}).addTo(map);
var userMarker=null,gateLayer=L.layerGroup().addTo(map),line=null,user=null;
function updateUser(lat,lng){
  user=[lat,lng];
  if(userMarker)map.removeLayer(userMarker);
  var icon=L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[24,24],iconAnchor:[12,12]});
  userMarker=L.marker([lat,lng],{icon:icon,zIndexOffset:1000}).addTo(map);
}
function setGates(list,selectedId){
  gateLayer.clearLayers();
  if(line){map.removeLayer(line);line=null}
  list.forEach(function(g,i){
    var sel=g.id===selectedId;
    var icon=L.divIcon({className:'',html:'<div class="gate-dot'+(sel?' sel':'')+'">'+(i+1)+'</div>',iconSize:[28,28],iconAnchor:[14,14]});
    var m=L.marker([g.latitude,g.longitude],{icon:icon,zIndexOffset:sel?800:500}).bindPopup('<b>'+g.name_en+'</b><br/>'+g.name_ar);
    m.on('click',function(){send({type:'gateSelect',id:g.id})});
    gateLayer.addLayer(m);
    if(sel&&user)line=L.polyline([user,[g.latitude,g.longitude]],{color:'#C8A951',weight:3,dashArray:'6,6'}).addTo(map);
  });
}
function centerOn(lat,lng,zoom){map.flyTo([lat,lng],zoom||18,{duration:0.6})}
function handle(m){
  if(m.type==='loc')updateUser(m.lat,m.lng);
  if(m.type==='gates')setGates(m.data,m.selected);
  if(m.type==='center')centerOn(m.lat,m.lng,m.zoom);
}
function send(msg){
  var s=JSON.stringify(msg);
  try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s)}catch(e){}
  try{window.parent.postMessage(s,'*')}catch(e){}
}
window.addEventListener('message',function(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;handle(d)}catch(x){}});
document.addEventListener('message',function(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;handle(d)}catch(x){}});
send({type:'ready'});
<\/script></body></html>`;

type MapHandle = { inject: (msg: object) => void };

function WebMap({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<MapHandle | null> }) {
  const iframeRef = useRef<any>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([MAP_HTML], { type: 'text/html' }));
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
      inject: (msg) => iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*'),
    };
  }, [mapRef]);

  if (!blobUrl) return null;
  return <iframe ref={iframeRef} src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' } as any} />;
}

function MobileMap({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<MapHandle | null> }) {
  const WebView = require('react-native-webview').WebView;
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    mapRef.current = {
      inject: (msg) => webViewRef.current?.injectJavaScript(`handle(${JSON.stringify(msg)});true;`),
    };
  }, [mapRef]);

  return (
    <WebView
      ref={webViewRef}
      source={{ html: MAP_HTML }}
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

export default function NabawiScreen() {
  const router = useRouter();
  const { userLocation } = useApp();
  const mapRef = useRef<MapHandle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const gates = useMemo(() => {
    const list = NABAWI_GATES.map((g) => ({
      ...g,
      distance: userLocation ? haversineDistance(userLocation.latitude, userLocation.longitude, g.latitude, g.longitude) : null,
      heading: userLocation ? bearing(userLocation.latitude, userLocation.longitude, g.latitude, g.longitude) : null,
    }));
    return userLocation ? list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)) : list;
  }, [userLocation]);

  const inject = useCallback((msg: object) => { mapRef.current?.inject(msg); }, []);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'ready') setMapReady(true);
    if (data.type === 'gateSelect') setSelectedId(data.id);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    if (userLocation) inject({ type: 'loc', lat: userLocation.latitude, lng: userLocation.longitude });
    inject({ type: 'gates', data: gates, selected: selectedId });
  }, [gates, selectedId, userLocation, mapReady, inject]);

  const focusGate = (id: string, lat: number, lng: number) => {
    setSelectedId(id);
    inject({ type: 'center', lat, lng, zoom: 18 });
  };

  return (
    <View style={styles.container} testID="nabawi-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity testID="btn-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Image source={require('../assets/images/nabawi-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Masjid Al Nabawi Gates</Text>
        </View>
        <TouchableOpacity
          testID="btn-nabawi-center"
          style={styles.backBtn}
          onPress={() => inject({ type: 'center', lat: NABAWI_CENTER.latitude, lng: NABAWI_CENTER.longitude, zoom: 17 })}
        >
          <Ionicons name="locate" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebMap onMessage={handleMessage} mapRef={mapRef} />
        ) : (
          <MobileMap onMessage={handleMessage} mapRef={mapRef} />
        )}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Text style={styles.listTitle}>
          {userLocation ? 'Gates sorted by distance from you' : 'Enable location to see distances'}
        </Text>
        {gates.map((g, index) => (
          <TouchableOpacity
            key={g.id}
            testID={`nabawi-gate-${g.id}`}
            style={[styles.row, selectedId === g.id && styles.rowSelected]}
            onPress={() => focusGate(g.id, g.latitude, g.longitude)}
            activeOpacity={0.7}
          >
            <View style={styles.rowNumber}><Text style={styles.rowNumberText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>{g.name_en}</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>{g.name_ar} • {g.side} side</Text>
            </View>
            {g.distance != null && g.heading != null && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowDistance}>{formatDistance(g.distance)}</Text>
                <Text style={styles.rowSubtitle}>{bearingToArrow(g.heading)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 8, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 32, marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  mapContainer: { height: '42%', backgroundColor: '#E5E7EB' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  listTitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  rowSelected: { borderColor: COLORS.secondary, borderWidth: 2 },
  rowNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowNumberText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rowDistance: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
});
