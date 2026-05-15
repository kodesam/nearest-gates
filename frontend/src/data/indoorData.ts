export interface IndoorPOI {
  id: string;
  name: string;
  name_ar: string;
  type: 'gate' | 'escalator' | 'elevator' | 'stairs' | 'washroom' | 'prayer_hall' | 'mataf' | 'masaa' | 'zamzam' | 'entrance';
  floor: number; // -1=basement, 0=ground, 1=first, 2=roof
  latitude: number;
  longitude: number;
  connected_to: string[]; // IDs of connected POIs for pathfinding
}

export interface FloorInfo {
  level: number;
  name: string;
  name_ar: string;
  description: string;
}

export const FLOORS: FloorInfo[] = [
  { level: -1, name: 'Basement', name_ar: 'القبو', description: 'Mataf expansion & prayer hall' },
  { level: 0, name: 'Ground Floor', name_ar: 'الطابق الأرضي', description: 'Main gates, Mataf & Masa\'a' },
  { level: 1, name: 'First Floor', name_ar: 'الطابق الأول', description: 'Upper prayer hall & Masa\'a' },
  { level: 2, name: 'Roof', name_ar: 'السطح', description: 'Open-air prayer area' },
];

export const FLOOR_COLORS: Record<number, string> = {
  [-1]: '#6366F1',
  0: '#1E3F20',
  1: '#2563EB',
  2: '#F59E0B',
};

export const POI_ICONS: Record<string, { icon: string; color: string }> = {
  gate: { icon: 'enter', color: '#1E3F20' },
  escalator: { icon: 'swap-vertical', color: '#8B5CF6' },
  elevator: { icon: 'arrow-up-circle', color: '#3B82F6' },
  stairs: { icon: 'layers', color: '#6366F1' },
  washroom: { icon: 'water', color: '#06B6D4' },
  prayer_hall: { icon: 'moon', color: '#C8A951' },
  mataf: { icon: 'radio-button-on', color: '#000000' },
  masaa: { icon: 'trail-sign', color: '#059669' },
  zamzam: { icon: 'cafe', color: '#0EA5E9' },
  entrance: { icon: 'log-in', color: '#EF4444' },
};

// Kaaba center for reference
const KC = { lat: 21.4225, lng: 39.8262 };

// Indoor POIs per floor
export const INDOOR_POIS: IndoorPOI[] = [
  // === BASEMENT (Level -1) ===
  { id: 'b_mataf', name: 'Mataf Expansion', name_ar: 'توسعة المطاف', type: 'mataf', floor: -1, latitude: 21.4225, longitude: 39.8262, connected_to: ['b_esc_s', 'b_esc_n', 'b_prayer_w'] },
  { id: 'b_prayer_w', name: 'Basement Prayer Hall West', name_ar: 'مصلى القبو الغربي', type: 'prayer_hall', floor: -1, latitude: 21.4225, longitude: 39.8248, connected_to: ['b_mataf', 'b_esc_w', 'b_wc_w'] },
  { id: 'b_prayer_e', name: 'Basement Prayer Hall East', name_ar: 'مصلى القبو الشرقي', type: 'prayer_hall', floor: -1, latitude: 21.4225, longitude: 39.8276, connected_to: ['b_mataf', 'b_esc_e', 'b_wc_e'] },
  { id: 'b_esc_s', name: 'Escalator South', name_ar: 'سلم كهربائي جنوبي', type: 'escalator', floor: -1, latitude: 21.4212, longitude: 39.8262, connected_to: ['b_mataf', 'g_esc_s'] },
  { id: 'b_esc_n', name: 'Escalator North', name_ar: 'سلم كهربائي شمالي', type: 'escalator', floor: -1, latitude: 21.4238, longitude: 39.8262, connected_to: ['b_mataf', 'g_esc_n'] },
  { id: 'b_esc_w', name: 'Escalator West', name_ar: 'سلم كهربائي غربي', type: 'escalator', floor: -1, latitude: 21.4225, longitude: 39.8245, connected_to: ['b_prayer_w', 'g_esc_w'] },
  { id: 'b_esc_e', name: 'Escalator East', name_ar: 'سلم كهربائي شرقي', type: 'escalator', floor: -1, latitude: 21.4225, longitude: 39.8279, connected_to: ['b_prayer_e', 'g_esc_e'] },
  { id: 'b_elev_sw', name: 'Elevator Southwest', name_ar: 'مصعد جنوبي غربي', type: 'elevator', floor: -1, latitude: 21.4213, longitude: 39.8248, connected_to: ['b_prayer_w', 'g_elev_sw'] },
  { id: 'b_elev_ne', name: 'Elevator Northeast', name_ar: 'مصعد شمالي شرقي', type: 'elevator', floor: -1, latitude: 21.4237, longitude: 39.8276, connected_to: ['b_prayer_e', 'g_elev_ne'] },
  { id: 'b_wc_w', name: 'Washroom West', name_ar: 'دورة مياه غربية', type: 'washroom', floor: -1, latitude: 21.4220, longitude: 39.8243, connected_to: ['b_prayer_w'] },
  { id: 'b_wc_e', name: 'Washroom East', name_ar: 'دورة مياه شرقية', type: 'washroom', floor: -1, latitude: 21.4220, longitude: 39.8281, connected_to: ['b_prayer_e'] },

  // === GROUND FLOOR (Level 0) ===
  { id: 'g_mataf', name: 'Mataf (Tawaf Area)', name_ar: 'المطاف', type: 'mataf', floor: 0, latitude: 21.4225, longitude: 39.8262, connected_to: ['g_zamzam', 'g_esc_s', 'g_esc_n', 'g_masaa'] },
  { id: 'g_masaa', name: 'Masa\'a (Sa\'i Corridor)', name_ar: 'المسعى', type: 'masaa', floor: 0, latitude: 21.4225, longitude: 39.8282, connected_to: ['g_mataf', 'g_gate_safa', 'g_gate_marwah', 'g_esc_e'] },
  { id: 'g_zamzam', name: 'Zamzam Water Station', name_ar: 'محطة ماء زمزم', type: 'zamzam', floor: 0, latitude: 21.4222, longitude: 39.8258, connected_to: ['g_mataf'] },
  { id: 'g_prayer_s', name: 'Prayer Hall South', name_ar: 'المصلى الجنوبي', type: 'prayer_hall', floor: 0, latitude: 21.4212, longitude: 39.8262, connected_to: ['g_gate_abdulaziz', 'g_gate_ali', 'g_esc_s'] },
  { id: 'g_prayer_n', name: 'Prayer Hall North', name_ar: 'المصلى الشمالي', type: 'prayer_hall', floor: 0, latitude: 21.4240, longitude: 39.8262, connected_to: ['g_gate_fahd', 'g_gate_fatah', 'g_esc_n'] },
  { id: 'g_prayer_w', name: 'Prayer Hall West', name_ar: 'المصلى الغربي', type: 'prayer_hall', floor: 0, latitude: 21.4225, longitude: 39.8245, connected_to: ['g_gate_umrah', 'g_esc_w'] },
  { id: 'g_gate_abdulaziz', name: 'King Abdul Aziz Gate', name_ar: 'باب الملك عبدالعزيز', type: 'gate', floor: 0, latitude: 21.4208, longitude: 39.8252, connected_to: ['g_prayer_s', 'g_wc_s'] },
  { id: 'g_gate_fahd', name: 'King Fahd Gate', name_ar: 'باب الملك فهد', type: 'gate', floor: 0, latitude: 21.4244, longitude: 39.8262, connected_to: ['g_prayer_n'] },
  { id: 'g_gate_umrah', name: 'Bab Al Umrah', name_ar: 'باب العمرة', type: 'gate', floor: 0, latitude: 21.4232, longitude: 39.8242, connected_to: ['g_prayer_w'] },
  { id: 'g_gate_fatah', name: 'Bab Al Fatah', name_ar: 'باب الفتح', type: 'gate', floor: 0, latitude: 21.4240, longitude: 39.8248, connected_to: ['g_prayer_n'] },
  { id: 'g_gate_salam', name: 'Bab As Salam', name_ar: 'باب السلام', type: 'gate', floor: 0, latitude: 21.4240, longitude: 39.8284, connected_to: ['g_masaa'] },
  { id: 'g_gate_ali', name: 'Bab Ali', name_ar: 'باب علي', type: 'gate', floor: 0, latitude: 21.4207, longitude: 39.8268, connected_to: ['g_prayer_s'] },
  { id: 'g_gate_safa', name: 'Bab Al Safa', name_ar: 'باب الصفا', type: 'gate', floor: 0, latitude: 21.4228, longitude: 39.8284, connected_to: ['g_masaa'] },
  { id: 'g_gate_marwah', name: 'Bab Al Marwah', name_ar: 'باب المروة', type: 'gate', floor: 0, latitude: 21.4222, longitude: 39.8283, connected_to: ['g_masaa'] },
  { id: 'g_esc_s', name: 'Escalator South', name_ar: 'سلم كهربائي جنوبي', type: 'escalator', floor: 0, latitude: 21.4212, longitude: 39.8262, connected_to: ['g_prayer_s', 'b_esc_s', 'f1_esc_s'] },
  { id: 'g_esc_n', name: 'Escalator North', name_ar: 'سلم كهربائي شمالي', type: 'escalator', floor: 0, latitude: 21.4238, longitude: 39.8262, connected_to: ['g_prayer_n', 'b_esc_n', 'f1_esc_n'] },
  { id: 'g_esc_w', name: 'Escalator West', name_ar: 'سلم كهربائي غربي', type: 'escalator', floor: 0, latitude: 21.4225, longitude: 39.8245, connected_to: ['g_prayer_w', 'b_esc_w', 'f1_esc_w'] },
  { id: 'g_esc_e', name: 'Escalator East', name_ar: 'سلم كهربائي شرقي', type: 'escalator', floor: 0, latitude: 21.4225, longitude: 39.8279, connected_to: ['g_masaa', 'b_esc_e', 'f1_esc_e'] },
  { id: 'g_elev_sw', name: 'Elevator Southwest', name_ar: 'مصعد جنوبي غربي', type: 'elevator', floor: 0, latitude: 21.4213, longitude: 39.8248, connected_to: ['g_prayer_s', 'b_elev_sw', 'f1_elev_sw'] },
  { id: 'g_elev_ne', name: 'Elevator Northeast', name_ar: 'مصعد شمالي شرقي', type: 'elevator', floor: 0, latitude: 21.4237, longitude: 39.8276, connected_to: ['g_prayer_n', 'b_elev_ne', 'f1_elev_ne'] },
  { id: 'g_wc_s', name: 'Washroom South', name_ar: 'دورة مياه جنوبية', type: 'washroom', floor: 0, latitude: 21.4207, longitude: 39.8258, connected_to: ['g_gate_abdulaziz'] },
  { id: 'g_wc_n', name: 'Washroom North', name_ar: 'دورة مياه شمالية', type: 'washroom', floor: 0, latitude: 21.4244, longitude: 39.8255, connected_to: ['g_prayer_n'] },
  { id: 'g_stairs_se', name: 'Stairs Southeast', name_ar: 'درج جنوبي شرقي', type: 'stairs', floor: 0, latitude: 21.4210, longitude: 39.8278, connected_to: ['g_masaa', 'f1_stairs_se'] },

  // === FIRST FLOOR (Level 1) ===
  { id: 'f1_prayer_main', name: 'Upper Prayer Hall', name_ar: 'المصلى العلوي', type: 'prayer_hall', floor: 1, latitude: 21.4225, longitude: 39.8255, connected_to: ['f1_esc_s', 'f1_esc_n', 'f1_esc_w'] },
  { id: 'f1_masaa', name: 'Masa\'a Upper Level', name_ar: 'المسعى العلوي', type: 'masaa', floor: 1, latitude: 21.4225, longitude: 39.8282, connected_to: ['f1_esc_e', 'f1_stairs_se'] },
  { id: 'f1_esc_s', name: 'Escalator South', name_ar: 'سلم كهربائي جنوبي', type: 'escalator', floor: 1, latitude: 21.4212, longitude: 39.8262, connected_to: ['f1_prayer_main', 'g_esc_s', 'r_esc_s'] },
  { id: 'f1_esc_n', name: 'Escalator North', name_ar: 'سلم كهربائي شمالي', type: 'escalator', floor: 1, latitude: 21.4238, longitude: 39.8262, connected_to: ['f1_prayer_main', 'g_esc_n', 'r_esc_n'] },
  { id: 'f1_esc_w', name: 'Escalator West', name_ar: 'سلم كهربائي غربي', type: 'escalator', floor: 1, latitude: 21.4225, longitude: 39.8245, connected_to: ['f1_prayer_main', 'g_esc_w', 'r_esc_w'] },
  { id: 'f1_esc_e', name: 'Escalator East', name_ar: 'سلم كهربائي شرقي', type: 'escalator', floor: 1, latitude: 21.4225, longitude: 39.8279, connected_to: ['f1_masaa', 'g_esc_e', 'r_esc_e'] },
  { id: 'f1_elev_sw', name: 'Elevator Southwest', name_ar: 'مصعد جنوبي غربي', type: 'elevator', floor: 1, latitude: 21.4213, longitude: 39.8248, connected_to: ['f1_prayer_main', 'g_elev_sw', 'r_elev_sw'] },
  { id: 'f1_elev_ne', name: 'Elevator Northeast', name_ar: 'مصعد شمالي شرقي', type: 'elevator', floor: 1, latitude: 21.4237, longitude: 39.8276, connected_to: ['f1_masaa', 'g_elev_ne', 'r_elev_ne'] },
  { id: 'f1_wc_w', name: 'Washroom West', name_ar: 'دورة مياه غربية', type: 'washroom', floor: 1, latitude: 21.4228, longitude: 39.8242, connected_to: ['f1_esc_w'] },
  { id: 'f1_wc_e', name: 'Washroom East', name_ar: 'دورة مياه شرقية', type: 'washroom', floor: 1, latitude: 21.4228, longitude: 39.8284, connected_to: ['f1_masaa'] },
  { id: 'f1_stairs_se', name: 'Stairs Southeast', name_ar: 'درج جنوبي شرقي', type: 'stairs', floor: 1, latitude: 21.4210, longitude: 39.8278, connected_to: ['f1_masaa', 'g_stairs_se', 'r_stairs_se'] },
  { id: 'f1_entrance_w', name: 'First Floor West Entrance', name_ar: 'مدخل الطابق الأول الغربي', type: 'entrance', floor: 1, latitude: 21.4230, longitude: 39.8240, connected_to: ['f1_esc_w', 'f1_prayer_main'] },

  // === ROOF (Level 2) ===
  { id: 'r_prayer', name: 'Roof Prayer Area', name_ar: 'مصلى السطح', type: 'prayer_hall', floor: 2, latitude: 21.4225, longitude: 39.8260, connected_to: ['r_esc_s', 'r_esc_n', 'r_esc_w', 'r_esc_e'] },
  { id: 'r_esc_s', name: 'Escalator South', name_ar: 'سلم كهربائي جنوبي', type: 'escalator', floor: 2, latitude: 21.4212, longitude: 39.8262, connected_to: ['r_prayer', 'f1_esc_s'] },
  { id: 'r_esc_n', name: 'Escalator North', name_ar: 'سلم كهربائي شمالي', type: 'escalator', floor: 2, latitude: 21.4238, longitude: 39.8262, connected_to: ['r_prayer', 'f1_esc_n'] },
  { id: 'r_esc_w', name: 'Escalator West', name_ar: 'سلم كهربائي غربي', type: 'escalator', floor: 2, latitude: 21.4225, longitude: 39.8245, connected_to: ['r_prayer', 'f1_esc_w'] },
  { id: 'r_esc_e', name: 'Escalator East', name_ar: 'سلم كهربائي شرقي', type: 'escalator', floor: 2, latitude: 21.4225, longitude: 39.8279, connected_to: ['r_prayer', 'f1_esc_e'] },
  { id: 'r_elev_sw', name: 'Elevator Southwest', name_ar: 'مصعد جنوبي غربي', type: 'elevator', floor: 2, latitude: 21.4213, longitude: 39.8248, connected_to: ['r_prayer', 'f1_elev_sw'] },
  { id: 'r_elev_ne', name: 'Elevator Northeast', name_ar: 'مصعد شمالي شرقي', type: 'elevator', floor: 2, latitude: 21.4237, longitude: 39.8276, connected_to: ['r_prayer', 'f1_elev_ne'] },
  { id: 'r_wc', name: 'Washroom Roof', name_ar: 'دورة مياه السطح', type: 'washroom', floor: 2, latitude: 21.4220, longitude: 39.8250, connected_to: ['r_prayer'] },
  { id: 'r_stairs_se', name: 'Stairs Southeast', name_ar: 'درج جنوبي شرقي', type: 'stairs', floor: 2, latitude: 21.4210, longitude: 39.8278, connected_to: ['r_prayer', 'f1_stairs_se'] },
];
