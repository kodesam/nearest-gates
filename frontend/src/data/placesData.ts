export type PlaceCategory = 'haram' | 'mashair' | 'history' | 'mosque' | 'landmark';

export interface PilgrimPlace {
  id: string;
  name: string;
  name_ar: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  description: string;
}

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  haram: 'Haram',
  mashair: 'Hajj Sites',
  history: 'Historic',
  mosque: 'Mosques',
  landmark: 'Landmarks',
};

// Coordinates are approximate and intended for rough distance/direction only.
export const PILGRIM_PLACES: PilgrimPlace[] = [
  { id: 'p-haram', name: 'Masjid al-Haram', name_ar: 'المسجد الحرام', category: 'haram', latitude: 21.4225, longitude: 39.8262, description: 'The Grand Mosque housing the Kaaba' },
  { id: 'p-safa', name: 'Mount Safa', name_ar: 'جبل الصفا', category: 'haram', latitude: 21.4228, longitude: 39.8284, description: "Starting point of Sa'i" },
  { id: 'p-marwa', name: 'Mount Marwah', name_ar: 'جبل المروة', category: 'haram', latitude: 21.4234, longitude: 39.8263, description: "Ending point of Sa'i" },
  { id: 'p-clock', name: 'Abraj Al-Bait Clock Tower', name_ar: 'برج الساعة', category: 'landmark', latitude: 21.4189, longitude: 39.8256, description: 'Landmark tower complex facing the Haram' },
  { id: 'p-nour', name: 'Jabal al-Nour (Cave of Hira)', name_ar: 'جبل النور - غار حراء', category: 'history', latitude: 21.4574, longitude: 39.8587, description: 'Where the first revelation was received' },
  { id: 'p-thawr', name: 'Jabal Thawr (Cave of Thawr)', name_ar: 'جبل ثور', category: 'history', latitude: 21.3786, longitude: 39.8494, description: 'Cave where the Prophet and Abu Bakr sheltered during the Hijrah' },
  { id: 'p-mualla', name: 'Jannat al-Mualla', name_ar: 'جنة المعلاة', category: 'history', latitude: 21.4318, longitude: 39.8333, description: 'Historic cemetery of Makkah' },
  { id: 'p-jinn', name: 'Masjid al-Jinn', name_ar: 'مسجد الجن', category: 'mosque', latitude: 21.4320, longitude: 39.8305, description: 'Historic mosque near Jannat al-Mualla' },
  { id: 'p-aisha', name: 'Masjid Aisha (Taneem)', name_ar: 'مسجد عائشة', category: 'mosque', latitude: 21.4435, longitude: 39.8092, description: 'Nearest Miqat for Umrah from Makkah' },
  { id: 'p-mina', name: 'Mina', name_ar: 'منى', category: 'mashair', latitude: 21.4133, longitude: 39.8933, description: 'Tent city where pilgrims stay on 8th and 11th-13th Dhul Hijjah' },
  { id: 'p-jamarat', name: 'Jamarat Bridge', name_ar: 'جسر الجمرات', category: 'mashair', latitude: 21.4225, longitude: 39.8722, description: 'Stoning of the pillars during Hajj' },
  { id: 'p-muzdalifah', name: 'Muzdalifah', name_ar: 'مزدلفة', category: 'mashair', latitude: 21.3839, longitude: 39.9364, description: 'Overnight stay after Arafat' },
  { id: 'p-arafat', name: 'Jabal Rahmah (Arafat)', name_ar: 'جبل الرحمة - عرفات', category: 'mashair', latitude: 21.3544, longitude: 39.9840, description: 'Plain of Arafat where the standing (Wuquf) takes place' },
  { id: 'p-namirah', name: 'Masjid Namirah', name_ar: 'مسجد نمرة', category: 'mosque', latitude: 21.3558, longitude: 39.9737, description: 'Mosque at the edge of Arafat' },
];
