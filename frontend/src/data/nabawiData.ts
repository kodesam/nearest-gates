export interface NabawiGate {
  id: string;
  name_en: string;
  name_ar: string;
  side: 'west' | 'east' | 'north' | 'south';
  latitude: number;
  longitude: number;
}

export const NABAWI_CENTER = { latitude: 24.4672, longitude: 39.6112 };

// Approximate positions placed by side of the mosque; verify against a survey before relying on them.
export const NABAWI_GATES: NabawiGate[] = [
  { id: 'n-salam', name_en: 'Bab as-Salam', name_ar: 'باب السلام', side: 'west', latitude: 24.4669, longitude: 39.6097 },
  { id: 'n-abubakr', name_en: 'Bab Abu Bakr as-Siddiq', name_ar: 'باب أبي بكر الصديق', side: 'west', latitude: 24.4664, longitude: 39.6097 },
  { id: 'n-rahmah', name_en: 'Bab ar-Rahmah', name_ar: 'باب الرحمة', side: 'west', latitude: 24.4674, longitude: 39.6097 },
  { id: 'n-saud', name_en: 'Bab Saud', name_ar: 'باب سعود', side: 'west', latitude: 24.4680, longitude: 39.6097 },
  { id: 'n-fahd', name_en: 'King Fahd Gate', name_ar: 'باب الملك فهد', side: 'west', latitude: 24.4672, longitude: 39.6090 },
  { id: 'n-nisa', name_en: 'Bab an-Nisa', name_ar: 'باب النساء', side: 'north', latitude: 24.4690, longitude: 39.6112 },
  { id: 'n-abdulaziz', name_en: 'King Abdulaziz Gate', name_ar: 'باب الملك عبدالعزيز', side: 'north', latitude: 24.4690, longitude: 39.6102 },
  { id: 'n-abdullah', name_en: 'King Abdullah Gate', name_ar: 'باب الملك عبدالله', side: 'north', latitude: 24.4690, longitude: 39.6122 },
  { id: 'n-jibril', name_en: 'Bab Jibril', name_ar: 'باب جبريل', side: 'south', latitude: 24.4655, longitude: 39.6112 },
  { id: 'n-baqi', name_en: "Bab al-Baqi'", name_ar: 'باب البقيع', side: 'east', latitude: 24.4668, longitude: 39.6130 },
  { id: 'n-uthman', name_en: 'Bab Uthman', name_ar: 'باب عثمان', side: 'east', latitude: 24.4676, longitude: 39.6130 },
];
