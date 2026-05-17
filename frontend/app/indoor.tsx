import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { INDOOR_POIS, FLOORS, FLOOR_COLORS, POI_ICONS, IndoorPOI } from '../src/data/indoorData';
import { haversineDistance } from '../src/utils/location';
import { useApp } from '../src/context/AppContext';

const COLORS = {
  primary: '#1E3F20', secondary: '#C8A951', background: '#F9F7F3',
  surface: '#FFFFFF', text: '#111827', textSecondary: '#4B5563', border: '#E5E7EB',
};

function MobileIndoorMap({ onMessage, injectRef }: { onMessage: (data: any) => void; injectRef: React.MutableRefObject<any> }) {
  const WebView = require('react-native-webview').WebView;
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    injectRef.current = {
      inject: (msg: object) => {
        webViewRef.current?.injectJavaScript(`handle(${JSON.stringify(msg)});true;`);
      },
    };
  }, [injectRef]);

  return (
    <WebView
      ref={webViewRef}
      source={{ html: getIndoorMapHtml() }}
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

// Dijkstra pathfinding
function findPath(startId: string, endId: string, pois: IndoorPOI[]): IndoorPOI[] {
  const poiMap = new Map(pois.map((p) => [p.id, p]));
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  pois.forEach((p) => { dist.set(p.id, Infinity); prev.set(p.id, null); });
  dist.set(startId, 0);

  while (true) {
    let u: string | null = null;
    let minDist = Infinity;
    dist.forEach((d, id) => { if (!visited.has(id) && d < minDist) { minDist = d; u = id; } });
    if (!u || u === endId) break;
    visited.add(u);
    const uPoi = poiMap.get(u);
    if (!uPoi) break;
    for (const neighborId of uPoi.connected_to) {
      if (visited.has(neighborId)) continue;
      const nPoi = poiMap.get(neighborId);
      if (!nPoi) continue;
      const edgeDist = haversineDistance(uPoi.latitude, uPoi.longitude, nPoi.latitude, nPoi.longitude);
      const floorPenalty = uPoi.floor !== nPoi.floor ? 50 : 0;
      const newDist = (dist.get(u) || 0) + edgeDist + floorPenalty;
      if (newDist < (dist.get(neighborId) || Infinity)) {
        dist.set(neighborId, newDist);
        prev.set(neighborId, u);
      }
    }
  }

  const path: IndoorPOI[] = [];
  let cur: string | null = endId;
  while (cur) {
    const poi = poiMap.get(cur);
    if (poi) path.unshift(poi);
    cur = prev.get(cur) || null;
  }
  return path.length > 1 && path[0].id === startId ? path : [];
}

function getIndoorMapHtml() {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{margin:0;padding:0}html,body,#map{width:100%;height:100%}
.poi-marker{border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 1px 4px rgba(0,0,0,0.3)}
.poi-label{font-size:10px;font-weight:bold;color:#333;text-shadow:0 0 3px #fff,0 0 3px #fff;white-space:nowrap;pointer-events:none}
.kaaba-marker{background:#000;border:2px solid #C8A951;width:16px;height:16px;box-shadow:0 0 0 4px rgba(200,169,81,0.3)}
.leaflet-popup-content{font-family:system-ui;font-size:13px}
.leaflet-popup-content b{color:#1E3F20}
.floor-badge{display:inline-block;padding:2px 6px;border-radius:6px;font-size:10px;color:#fff;font-weight:bold}
</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([21.4225,39.8262],18);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:22,subdomains:'abcd'}).addTo(map);
var kaabaIcon=L.divIcon({className:'',html:'<div class="kaaba-marker"></div>',iconSize:[20,20],iconAnchor:[10,10]});
L.marker([21.4225,39.8262],{icon:kaabaIcon}).addTo(map).bindPopup('<b>The Holy Kaaba</b>');
// Haram boundary polygon
L.polygon([[21.4205,39.8238],[21.4205,39.8288],[21.4248,39.8288],[21.4248,39.8238]],{color:'#1E3F20',weight:2,fillColor:'#1E3F20',fillOpacity:0.05,dashArray:'6,4'}).addTo(map);
// Mataf circle
L.circle([21.4225,39.8262],{radius:45,color:'#C8A951',weight:2,fillColor:'#C8A951',fillOpacity:0.1}).addTo(map);

var poiLayer=L.layerGroup().addTo(map);
var pathLayer=L.layerGroup().addTo(map);
var typeColors={gate:'#1E3F20',escalator:'#8B5CF6',elevator:'#3B82F6',stairs:'#6366F1',washroom:'#06B6D4',prayer_hall:'#C8A951',mataf:'#000',masaa:'#059669',zamzam:'#0EA5E9',entrance:'#EF4444'};

function setPois(pois){
  poiLayer.clearLayers();
  pois.forEach(function(p){
    var c=typeColors[p.type]||'#999';
    var icon=L.divIcon({className:'',html:'<div class="poi-marker" style="background:'+c+'"></div>',iconSize:[18,18],iconAnchor:[9,9]});
    var floorNames={'-1':'Basement','0':'Ground','1':'First','2':'Roof'};
    var popup='<b>'+p.name+'</b><br/><span style="color:#666">'+p.name_ar+'</span><br/><span class="floor-badge" style="background:'+c+'">'+p.type.replace('_',' ')+'</span>';
    var m=L.marker([p.latitude,p.longitude],{icon:icon}).bindPopup(popup);
    m.on('click',function(){send({type:'poiSelect',poi:p})});
    poiLayer.addLayer(m);
    // Label
    var label=L.marker([p.latitude,p.longitude],{icon:L.divIcon({className:'poi-label',html:p.name.length>20?p.name.substring(0,18)+'..':p.name,iconSize:[100,14],iconAnchor:[50,-8]}),interactive:false});
    poiLayer.addLayer(label);
  });
}

function showPath(coords){
  pathLayer.clearLayers();
  if(coords.length<2)return;
  var line=L.polyline(coords,{color:'#2563EB',weight:5,opacity:0.8}).addTo(pathLayer);
  coords.forEach(function(c,i){
    var col=i===0?'#22C55E':i===coords.length-1?'#EF4444':'#2563EB';
    var icon=L.divIcon({className:'',html:'<div style="background:'+col+';border:2px solid #fff;border-radius:50%;width:'+(i===0||i===coords.length-1?'16':'8')+'px;height:'+(i===0||i===coords.length-1?'16':'8')+'px;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',iconSize:[20,20],iconAnchor:[10,10]});
    L.marker(c,{icon:icon}).addTo(pathLayer);
  });
  map.fitBounds(line.getBounds(),{padding:[40,40]});
}

function clearPath(){pathLayer.clearLayers()}
function centerOn(lat,lng,zoom){map.flyTo([lat,lng],zoom||18,{duration:0.5})}

function handle(m){
  if(m.type==='pois')setPois(m.data);
  if(m.type==='path')showPath(m.coords);
  if(m.type==='clearPath')clearPath();
  if(m.type==='center')centerOn(m.lat,m.lng,m.zoom);
}
function send(msg){
  try{window.parent.postMessage(JSON.stringify(msg),'*')}catch(e){}
  try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(msg))}catch(e){}
}
window.addEventListener('message',function(e){try{var d=typeof e.data==='string'?JSON.parse(e.data):e.data;handle(d)}catch(x){}});
send({type:'ready'});
<\/script></body></html>`;
}

export default function IndoorScreen() {
  const router = useRouter();
  const { userLocation } = useApp();
  const mapRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mobileInjectRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [navStart, setNavStart] = useState<IndoorPOI | null>(null);
  const [navEnd, setNavEnd] = useState<IndoorPOI | null>(null);
  const [path, setPath] = useState<IndoorPOI[]>([]);
  const [showPoiList, setShowPoiList] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'start' | 'end' | null>(null);

  const floorPois = useMemo(() => INDOOR_POIS.filter((p) => p.floor === selectedFloor), [selectedFloor]);

  const inject = useCallback((msg: object) => {
    if (Platform.OS === 'web' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(msg), '*');
    } else if (Platform.OS !== 'web' && mobileInjectRef.current) {
      mobileInjectRef.current.inject(msg);
    }
  }, []);

  // Setup iframe and messages
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const html = getIndoorMapHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handler = (e: MessageEvent) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data?.type === 'ready') setMapReady(true);
          if (data?.type === 'poiSelect') {
            if (selectingFor === 'start') { setNavStart(data.poi); setSelectingFor(null); }
            else if (selectingFor === 'end') { setNavEnd(data.poi); setSelectingFor(null); }
          }
        } catch {}
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, [selectingFor]);

  // Update POIs when floor changes
  useEffect(() => {
    if (!mapReady) return;
    inject({ type: 'pois', data: floorPois });
  }, [floorPois, mapReady, inject]);

  // Run pathfinding
  const runPathfinding = useCallback(() => {
    if (!navStart || !navEnd) return;
    const result = findPath(navStart.id, navEnd.id, INDOOR_POIS);
    setPath(result);
    if (result.length > 0) {
      const coords = result.map((p) => [p.latitude, p.longitude]);
      inject({ type: 'path', coords });
    }
  }, [navStart, navEnd, inject]);

  useEffect(() => { if (navStart && navEnd) runPathfinding(); }, [navStart, navEnd, runPathfinding]);

  const clearNav = () => {
    setNavStart(null); setNavEnd(null); setPath([]); inject({ type: 'clearPath' });
  };

  const findNearest = (type: string) => {
    const userLat = userLocation?.latitude || 21.4225;
    const userLng = userLocation?.longitude || 39.8262;
    const candidates = INDOOR_POIS.filter((p) => p.type === type);
    if (candidates.length === 0) return;
    let nearest = candidates[0];
    let minDist = Infinity;
    for (const c of candidates) {
      const d = haversineDistance(userLat, userLng, c.latitude, c.longitude);
      if (d < minDist) { minDist = d; nearest = c; }
    }
    setSelectedFloor(nearest.floor);
    setTimeout(() => inject({ type: 'center', lat: nearest.latitude, lng: nearest.longitude, zoom: 19 }), 300);
  };

  const navigateToMataf = () => {
    // Find nearest gate as start, mataf as end
    const gates = INDOOR_POIS.filter((p) => p.type === 'gate' && p.floor === 0);
    const mataf = INDOOR_POIS.find((p) => p.id === 'g_mataf');
    if (gates.length > 0 && mataf) {
      const userLat = userLocation?.latitude || 21.4225;
      const userLng = userLocation?.longitude || 39.8262;
      let nearest = gates[0];
      let minDist = Infinity;
      for (const g of gates) {
        const d = haversineDistance(userLat, userLng, g.latitude, g.longitude);
        if (d < minDist) { minDist = d; nearest = g; }
      }
      setNavStart(nearest);
      setNavEnd(mataf);
      setSelectedFloor(0);
    }
  };

  const selectPoi = (poi: IndoorPOI) => {
    if (selectingFor === 'start') setNavStart(poi);
    else if (selectingFor === 'end') setNavEnd(poi);
    setSelectingFor(null);
    setShowPoiList(false);
    setSelectedFloor(poi.floor);
    setTimeout(() => inject({ type: 'center', lat: poi.latitude, lng: poi.longitude, zoom: 19 }), 300);
  };

  return (
    <View style={styles.container} testID="indoor-screen">
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity testID="btn-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Indoor Navigation</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Floor Selector */}
      <View style={styles.floorSelector}>
        {FLOORS.map((f) => (
          <TouchableOpacity
            key={f.level}
            testID={`floor-btn-${f.level}`}
            style={[styles.floorBtn, selectedFloor === f.level && { backgroundColor: FLOOR_COLORS[f.level] }]}
            onPress={() => setSelectedFloor(f.level)}
          >
            <Text style={[styles.floorBtnText, selectedFloor === f.level && { color: '#fff' }]}>
              {f.level === -1 ? 'B' : f.level === 0 ? 'G' : f.level === 1 ? '1' : 'R'}
            </Text>
            <Text style={[styles.floorBtnLabel, selectedFloor === f.level && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' && blobUrl ? (
          <iframe ref={iframeRef} src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' } as any} />
        ) : Platform.OS !== 'web' ? (
          <MobileIndoorMap
            onMessage={(data: any) => {
              if (data?.type === 'ready') setMapReady(true);
              if (data?.type === 'poiSelect') {
                if (selectingFor === 'start') { setNavStart(data.poi); setSelectingFor(null); }
                else if (selectingFor === 'end') { setNavEnd(data.poi); setSelectingFor(null); }
              }
            }}
            injectRef={mobileInjectRef}
          />
        ) : null}
      </View>

      {/* Quick Find Buttons */}
      <View style={styles.quickFind}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFindScroll}>
          {[
            { type: 'escalator', label: 'Escalator', icon: 'swap-vertical' },
            { type: 'elevator', label: 'Elevator', icon: 'arrow-up-circle' },
            { type: 'washroom', label: 'Washroom', icon: 'water' },
            { type: 'stairs', label: 'Stairs', icon: 'layers' },
            { type: 'zamzam', label: 'Zamzam', icon: 'cafe' },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              testID={`find-nearest-${item.type}`}
              style={styles.quickFindBtn}
              onPress={() => findNearest(item.type)}
            >
              <Ionicons name={item.icon as any} size={16} color={COLORS.primary} />
              <Text style={styles.quickFindText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity testID="find-mataf-route" style={[styles.quickFindBtn, { backgroundColor: '#FEF3C7' }]} onPress={navigateToMataf}>
            <Ionicons name="navigate" size={16} color="#92400E" />
            <Text style={[styles.quickFindText, { color: '#92400E' }]}>To Mataf</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Navigation Panel */}
      <View style={styles.navPanel}>
        <Text style={styles.navTitle}>Navigate</Text>
        <View style={styles.navRow}>
          <TouchableOpacity
            testID="btn-select-start"
            style={[styles.navInput, selectingFor === 'start' && styles.navInputActive]}
            onPress={() => { setSelectingFor('start'); setShowPoiList(true); }}
          >
            <View style={[styles.navDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.navInputText} numberOfLines={1}>{navStart ? navStart.name : 'Select start point'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-select-end"
            style={[styles.navInput, selectingFor === 'end' && styles.navInputActive]}
            onPress={() => { setSelectingFor('end'); setShowPoiList(true); }}
          >
            <View style={[styles.navDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.navInputText} numberOfLines={1}>{navEnd ? navEnd.name : 'Select destination'}</Text>
          </TouchableOpacity>
          {(navStart || navEnd) && (
            <TouchableOpacity testID="btn-clear-nav" style={styles.navClearBtn} onPress={clearNav}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {path.length > 0 && (
          <View style={styles.pathInfo}>
            <Ionicons name="footsteps" size={14} color={COLORS.primary} />
            <Text style={styles.pathInfoText}>
              {path.length} steps • Floors: {[...new Set(path.map((p) => p.floor))].map((f) => f === -1 ? 'B' : f === 0 ? 'G' : f === 1 ? '1' : 'R').join(' → ')}
            </Text>
          </View>
        )}
      </View>

      {/* POI List Modal */}
      {showPoiList && (
        <View style={styles.poiListOverlay}>
          <View style={styles.poiListContainer}>
            <View style={styles.poiListHeader}>
              <Text style={styles.poiListTitle}>Select {selectingFor === 'start' ? 'Start' : 'Destination'}</Text>
              <TouchableOpacity onPress={() => { setShowPoiList(false); setSelectingFor(null); }}>
                <Ionicons name="close-circle" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={INDOOR_POIS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const poiIcon = POI_ICONS[item.type] || { icon: 'location', color: '#999' };
                const floorLabel = item.floor === -1 ? 'Basement' : item.floor === 0 ? 'Ground' : item.floor === 1 ? 'First' : 'Roof';
                return (
                  <TouchableOpacity
                    style={styles.poiListItem}
                    onPress={() => selectPoi(item)}
                    testID={`poi-select-${item.id}`}
                  >
                    <View style={[styles.poiListIcon, { backgroundColor: poiIcon.color }]}>
                      <Ionicons name={poiIcon.icon as any} size={14} color="#fff" />
                    </View>
                    <View style={styles.poiListInfo}>
                      <Text style={styles.poiListName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.poiListMeta}>{item.type.replace('_', ' ')} • {floorLabel}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  floorSelector: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: COLORS.surface },
  floorBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#F3F4F6' },
  floorBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.textSecondary },
  floorBtnLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  mapContainer: { flex: 1 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  mapPlaceholderText: { color: COLORS.textSecondary },
  quickFind: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  quickFindScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  quickFindBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  quickFindText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  navPanel: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  navTitle: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  navRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  navInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  navInputActive: { borderWidth: 2, borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  navDot: { width: 10, height: 10, borderRadius: 5 },
  navInputText: { flex: 1, fontSize: 13, color: COLORS.text },
  navClearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  pathInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  pathInfoText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  poiListOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, justifyContent: 'flex-end' },
  poiListContainer: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  poiListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  poiListTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  poiListItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  poiListIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  poiListInfo: { flex: 1 },
  poiListName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  poiListMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
});
