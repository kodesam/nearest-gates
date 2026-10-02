import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HAJJ_CHECKPOINTS, HajjCheckpoint } from '../src/data/haramData';
import { haversineDistance } from '../src/utils/location';
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
.checkpoint-dot{border:2px solid #fff;border-radius:50%;width:26px;height:26px;color:#fff;font:700 12px/26px system-ui;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.35)}
.leaflet-popup-content{font-family:system-ui;font-size:13px}
.leaflet-popup-content b{color:#1E3F20}
</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([21.4,39.9],11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2u1v_1_7b9a4ce23c1630ee1d947519',{maxZoom:20,subdomains:'abcd'}).addTo(map);
var userMarker=null,userCircle=null,checkpointLayer=L.layerGroup().addTo(map),routeLine=null;
function updateUser(lat,lng,acc){
  if(userMarker)map.removeLayer(userMarker);
  if(userCircle)map.removeLayer(userCircle);
  var icon=L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[24,24],iconAnchor:[12,12]});
  userMarker=L.marker([lat,lng],{icon:icon,zIndexOffset:1000}).addTo(map);
  if(acc&&acc<500)userCircle=L.circle([lat,lng],{radius:acc,fillColor:'#2563EB',fillOpacity:0.08,stroke:true,color:'#2563EB',weight:1,opacity:0.2}).addTo(map);
}
function setCheckpoints(list,completed){
  checkpointLayer.clearLayers();
  if(routeLine){map.removeLayer(routeLine);routeLine=null}
  var coords=[];
  var seen={};
  list.forEach(function(c,index){
    coords.push([c.latitude,c.longitude]);
    var key=c.latitude.toFixed(5)+','+c.longitude.toFixed(5);
    var occurrence=seen[key]||0;
    seen[key]=occurrence+1;
    // Nudge markers that share the exact same coordinates so they don't hide one another.
    var angle=occurrence*(Math.PI*2/6);
    var offset=occurrence?0.0008:0;
    var markerLat=c.latitude+offset*Math.sin(angle);
    var markerLng=c.longitude+offset*Math.cos(angle);
    var done=completed.indexOf(c.id)!==-1;
    var color=done?'#15803D':'#C8A951';
    var label=done?'&#10003;':String(index+1);
    var icon=L.divIcon({className:'',html:'<div class="checkpoint-dot" style="background:'+color+'">'+label+'</div>',iconSize:[30,30],iconAnchor:[15,15]});
    var popup='<b>'+c.title+'</b><br/><span style="color:#666">'+c.subtitle+'</span><br/><span style="display:inline-block;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:bold;color:#fff;margin-top:4px;background:'+color+'">'+(done?'Visited':'Not visited yet')+'</span>';
    var marker=L.marker([markerLat,markerLng],{icon:icon,zIndexOffset:500}).bindPopup(popup);
    marker.on('click',function(){send({type:'checkpointSelect',checkpoint:c})});
    checkpointLayer.addLayer(marker);
  });
  routeLine=L.polyline(coords,{color:'#1E3F20',weight:3,opacity:0.5,dashArray:'6,6'}).addTo(map);
  map.fitBounds(routeLine.getBounds(),{padding:[40,40]});
}
function centerOn(lat,lng,zoom){map.flyTo([lat,lng],zoom||13,{duration:0.8})}
function handle(m){
  if(m.type==='loc')updateUser(m.lat,m.lng,m.acc);
  if(m.type==='checkpoints')setCheckpoints(m.data,m.completed||[]);
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

function WebHajjMap({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<any> }) {
  const iframeRef = useRef<any>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([MAP_HTML], { type: 'text/html' });
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
  return <iframe ref={iframeRef} src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' } as any} />;
}

function MobileHajjMap({ onMessage, mapRef }: { onMessage: (data: any) => void; mapRef: React.MutableRefObject<any> }) {
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

export default function HajjScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { userLocation, completedHajjCheckpoints, toggleHajjCheckpoint, resetHajjProgress } = useApp();
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string | null>(null);
  const narrowLayout = width < 360;

  const inject = useCallback((msg: object) => { mapRef.current?.inject(msg); }, []);

  const handleMessage = useCallback((data: any) => {
    if (data.type === 'ready') setMapReady(true);
    if (data.type === 'checkpointSelect' && data.checkpoint) setSelectedCheckpoint(data.checkpoint.id);
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    inject({ type: 'checkpoints', data: HAJJ_CHECKPOINTS, completed: completedHajjCheckpoints });
  }, [completedHajjCheckpoints, mapReady, inject]);

  useEffect(() => {
    if (!mapReady || !userLocation) return;
    inject({ type: 'loc', lat: userLocation.latitude, lng: userLocation.longitude, acc: userLocation.accuracy });
  }, [userLocation, mapReady, inject]);

  const focusCheckpoint = (checkpoint: HajjCheckpoint) => {
    setSelectedCheckpoint(checkpoint.id);
    inject({ type: 'center', lat: checkpoint.latitude, lng: checkpoint.longitude, zoom: 14 });
  };

  const distanceToCheckpoint = (checkpoint: HajjCheckpoint) => {
    if (!userLocation) return null;
    return haversineDistance(userLocation.latitude, userLocation.longitude, checkpoint.latitude, checkpoint.longitude);
  };

  const allComplete = completedHajjCheckpoints.length === HAJJ_CHECKPOINTS.length;

  return (
    <View style={styles.container} testID="hajj-screen">
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity testID="btn-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Image source={require('../assets/images/hajj-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.headerTitle}>Hajj Route Map</Text>
        </View>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebHajjMap onMessage={handleMessage} mapRef={mapRef} />
        ) : (
          <MobileHajjMap onMessage={handleMessage} mapRef={mapRef} />
        )}
      </View>

      <ScrollView style={styles.checklistPanel} contentContainerStyle={styles.checklistContent}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>My Hajj Journey</Text>
          <Text style={styles.progressSubtitle} testID="hajj-progress-text">
            {completedHajjCheckpoints.length} of {HAJJ_CHECKPOINTS.length} checkpoints visited
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(completedHajjCheckpoints.length / HAJJ_CHECKPOINTS.length) * 100}%` }]} />
        </View>

        {HAJJ_CHECKPOINTS.map((checkpoint, index) => {
          const completed = completedHajjCheckpoints.includes(checkpoint.id);
          const distance = distanceToCheckpoint(checkpoint);
          return (
            <View key={checkpoint.id} style={[styles.checkpointRow, selectedCheckpoint === checkpoint.id && styles.checkpointRowSelected]}>
              <TouchableOpacity style={styles.checkpointInfo} onPress={() => focusCheckpoint(checkpoint)} activeOpacity={0.7}>
                <View style={[styles.checkpointNumber, completed && styles.checkpointNumberDone]}>
                  {completed ? (
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  ) : (
                    <Text style={styles.checkpointNumberText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.checkpointCopy}>
                  <Text style={[styles.checkpointTitle, completed && styles.checkpointTitleDone]} numberOfLines={1}>{checkpoint.title}</Text>
                  <Text style={styles.checkpointSubtitle} numberOfLines={1}>
                    {checkpoint.subtitle}{distance != null ? ` • ${distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`} away` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`btn-hajj-checkpoint-${checkpoint.id}`}
                style={[styles.completeButton, completed && styles.completeButtonDone]}
                onPress={() => toggleHajjCheckpoint(checkpoint.id)}
                accessibilityLabel={`${completed ? 'Mark not visited' : 'Mark visited'}: ${checkpoint.title}`}
              >
                <Ionicons name={completed ? 'checkmark' : 'checkmark-circle-outline'} size={19} color={completed ? '#fff' : COLORS.primary} />
              </TouchableOpacity>
            </View>
          );
        })}

        {allComplete && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeBannerText}>Congratulations on completing your Hajj! May Allah accept your worship 🕋</Text>
            <TouchableOpacity style={styles.resetProgressButton} onPress={resetHajjProgress}>
              <Text style={styles.resetProgressText}>Start a new Hajj</Text>
            </TouchableOpacity>
          </View>
        )}
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
  logo: { width: 18, height: 42, marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  mapContainer: { height: '42%', backgroundColor: '#E5E7EB' },
  checklistPanel: { flex: 1 },
  checklistContent: { padding: 16, paddingBottom: 32 },
  progressHeader: { marginBottom: 8 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  progressSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  checkpointRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  checkpointRowSelected: { borderColor: COLORS.secondary, borderWidth: 2 },
  checkpointInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  checkpointNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkpointNumberDone: { backgroundColor: '#15803D' },
  checkpointNumberText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  checkpointCopy: { flex: 1 },
  checkpointTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  checkpointTitleDone: { color: '#15803D' },
  checkpointSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  completeButton: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary, marginLeft: 8,
  },
  completeButtonDone: { backgroundColor: '#15803D', borderColor: '#15803D' },
  completeBanner: {
    marginTop: 8, padding: 16, borderRadius: 12, backgroundColor: '#ECFDF5',
    borderWidth: 1, borderColor: '#A7F3D0', alignItems: 'center',
  },
  completeBannerText: { fontSize: 14, color: '#065F46', textAlign: 'center', marginBottom: 12, fontWeight: '600' },
  resetProgressButton: {
    borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary,
  },
  resetProgressText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
