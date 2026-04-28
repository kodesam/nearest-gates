export interface GateData {
  id: string;
  number: number;
  name_en: string;
  name_ar: string;
  latitude: number;
  longitude: number;
  side: string;
}

export interface AmenityData {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string;
}

export const KAABA_LOCATION = {
  latitude: 21.4225,
  longitude: 39.8262,
};

export const HARAM_BOUNDS = {
  north: 21.4248,
  south: 21.4205,
  west: 39.8238,
  east: 39.8288,
};

export const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurants',
  grocery: 'Grocery',
  bus_stop: 'Bus Stops',
  taxi_stand: 'Taxi Stands',
  meqat: 'Meqat',
};

export const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'restaurant',
  grocery: 'shopping-cart',
  bus_stop: 'directions-bus',
  taxi_stand: 'local-taxi',
  meqat: 'place',
};

export const FALLBACK_GATES: GateData[] = [
  { id: 'g1', number: 1, name_en: 'King Abdul Aziz Gate', name_ar: 'باب الملك عبدالعزيز', latitude: 21.4208, longitude: 39.8252, side: 'south' },
  { id: 'g2', number: 3, name_en: 'Bab Bani Shaybah', name_ar: 'باب بني شيبة', latitude: 21.4210, longitude: 39.8260, side: 'south' },
  { id: 'g3', number: 5, name_en: 'Bab Al Nabi', name_ar: 'باب النبي', latitude: 21.4207, longitude: 39.8257, side: 'south' },
  { id: 'g4', number: 7, name_en: 'Bab Ibrahim', name_ar: 'باب إبراهيم', latitude: 21.4207, longitude: 39.8247, side: 'south' },
  { id: 'g5', number: 11, name_en: 'Bab Ali', name_ar: 'باب علي', latitude: 21.4207, longitude: 39.8268, side: 'south' },
  { id: 'g6', number: 14, name_en: 'Bab Ajyad', name_ar: 'باب أجياد', latitude: 21.4208, longitude: 39.8275, side: 'south' },
  { id: 'g7', number: 17, name_en: 'Bab Al Rahmah', name_ar: 'باب الرحمة', latitude: 21.4210, longitude: 39.8280, side: 'southeast' },
  { id: 'g8', number: 20, name_en: 'Bab Al Mahkamah', name_ar: 'باب المحكمة', latitude: 21.4212, longitude: 39.8242, side: 'west' },
  { id: 'g9', number: 25, name_en: 'Bab Al Qararah', name_ar: 'باب القرارة', latitude: 21.4218, longitude: 39.8241, side: 'west' },
  { id: 'g10', number: 30, name_en: 'Bab Al Qutbi', name_ar: 'باب القطبي', latitude: 21.4222, longitude: 39.8240, side: 'west' },
  { id: 'g11', number: 35, name_en: 'Bab Badr', name_ar: 'باب بدر', latitude: 21.4228, longitude: 39.8241, side: 'west' },
  { id: 'g12', number: 42, name_en: 'Bab Al Malik Abdullah', name_ar: 'باب الملك عبدالله', latitude: 21.4235, longitude: 39.8242, side: 'west' },
  { id: 'g13', number: 45, name_en: 'Bab Al Fatah', name_ar: 'باب الفتح', latitude: 21.4240, longitude: 39.8248, side: 'northwest' },
  { id: 'g14', number: 46, name_en: 'Bab Al Umrah', name_ar: 'باب العمرة', latitude: 21.4232, longitude: 39.8242, side: 'west' },
  { id: 'g15', number: 50, name_en: 'Bab Hamza', name_ar: 'باب حمزة', latitude: 21.4237, longitude: 39.8243, side: 'northwest' },
  { id: 'g16', number: 55, name_en: 'Bab Al Ateeq', name_ar: 'باب العتيق', latitude: 21.4243, longitude: 39.8253, side: 'north' },
  { id: 'g17', number: 62, name_en: 'Bab Al Mualla', name_ar: 'باب المعلا', latitude: 21.4244, longitude: 39.8258, side: 'north' },
  { id: 'g18', number: 73, name_en: 'Bab Al Firdaws', name_ar: 'باب الفردوس', latitude: 21.4243, longitude: 39.8272, side: 'north' },
  { id: 'g19', number: 79, name_en: 'King Fahd Gate', name_ar: 'باب الملك فهد', latitude: 21.4244, longitude: 39.8262, side: 'north' },
  { id: 'g20', number: 80, name_en: 'Bab Al Balad', name_ar: 'باب البلد', latitude: 21.4244, longitude: 39.8256, side: 'north' },
  { id: 'g21', number: 84, name_en: 'Bab Al Siddiq', name_ar: 'باب الصديق', latitude: 21.4244, longitude: 39.8268, side: 'north' },
  { id: 'g22', number: 89, name_en: 'Bab As Salam', name_ar: 'باب السلام', latitude: 21.4240, longitude: 39.8284, side: 'east' },
  { id: 'g23', number: 94, name_en: 'Bab Al Safa', name_ar: 'باب الصفا', latitude: 21.4228, longitude: 39.8284, side: 'east' },
  { id: 'g24', number: 96, name_en: 'Bab Al Marwah', name_ar: 'باب المروة', latitude: 21.4222, longitude: 39.8283, side: 'east' },
  { id: 'g25', number: 99, name_en: 'Bab Al Widaa', name_ar: 'باب الوداع', latitude: 21.4215, longitude: 39.8282, side: 'east' },
];

export const FALLBACK_AMENITIES: AmenityData[] = [
  { id: 'a1', name: 'Al Baik Restaurant', category: 'restaurant', latitude: 21.4195, longitude: 39.8250, description: 'Famous Saudi fast food chain' },
  { id: 'a2', name: 'Kudu Restaurant', category: 'restaurant', latitude: 21.4200, longitude: 39.8290, description: 'Popular Saudi restaurant' },
  { id: 'a3', name: 'Hardees Ajyad', category: 'restaurant', latitude: 21.4195, longitude: 39.8270, description: 'International fast food' },
  { id: 'a4', name: 'Al Tazaj Grilled Chicken', category: 'restaurant', latitude: 21.4250, longitude: 39.8235, description: 'Grilled chicken restaurant' },
  { id: 'a5', name: 'Herfy Restaurant', category: 'restaurant', latitude: 21.4248, longitude: 39.8280, description: 'Saudi fast food chain' },
  { id: 'a6', name: 'BinDawood Supermarket', category: 'grocery', latitude: 21.4200, longitude: 39.8240, description: 'Large supermarket near Haram' },
  { id: 'a7', name: 'Al Raya Supermarket', category: 'grocery', latitude: 21.4190, longitude: 39.8260, description: 'Grocery and household items' },
  { id: 'a8', name: 'Panda Supermarket', category: 'grocery', latitude: 21.4250, longitude: 39.8295, description: 'Full-service supermarket' },
  { id: 'a9', name: 'Al Othaim Market', category: 'grocery', latitude: 21.4255, longitude: 39.8250, description: 'Grocery and daily essentials' },
  { id: 'a10', name: 'SAPTCO Bus Station', category: 'bus_stop', latitude: 21.4180, longitude: 39.8250, description: 'Main intercity bus terminal' },
  { id: 'a11', name: 'Ajyad Bus Stop', category: 'bus_stop', latitude: 21.4195, longitude: 39.8285, description: 'Local bus stop on Ajyad Road' },
  { id: 'a12', name: 'Al Haram Bus Terminal', category: 'bus_stop', latitude: 21.4260, longitude: 39.8240, description: 'Shuttle bus terminal' },
  { id: 'a13', name: 'King Abdul Aziz Rd Taxi', category: 'taxi_stand', latitude: 21.4200, longitude: 39.8235, description: 'Taxi stand on main road' },
  { id: 'a14', name: 'Ajyad Taxi Stand', category: 'taxi_stand', latitude: 21.4190, longitude: 39.8275, description: 'Taxi stand near Ajyad area' },
  { id: 'a15', name: 'Al Haram Taxi Stand', category: 'taxi_stand', latitude: 21.4255, longitude: 39.8265, description: 'Taxi stand near north gates' },
  { id: 'a16', name: 'Masjid Aisha (Taneem)', category: 'meqat', latitude: 21.4435, longitude: 39.8092, description: 'Nearest Meqat for Umrah from Makkah' },
  { id: 'a17', name: 'Al Hudaybiyah (Shumaysi)', category: 'meqat', latitude: 21.4550, longitude: 39.6980, description: 'Meqat on Jeddah-Makkah road' },
  { id: 'a18', name: 'Masjid Al Jiranah', category: 'meqat', latitude: 21.5030, longitude: 39.9090, description: 'Historic Meqat location' },
  { id: 'a19', name: 'Zamzam Tower Restaurant', category: 'restaurant', latitude: 21.4192, longitude: 39.8263, description: 'Restaurant in Zamzam Tower area' },
  { id: 'a20', name: 'Clock Tower Mall', category: 'grocery', latitude: 21.4188, longitude: 39.8257, description: 'Shopping and grocery in Abraj Al-Bait' },
];
