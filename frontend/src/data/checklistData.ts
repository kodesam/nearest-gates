export interface ChecklistItem {
  id: string;
  label: string;
  category: 'documents' | 'clothing' | 'health' | 'essentials';
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'travel-documents', label: 'Prepare travel documents (passport, visa, Hajj/Umrah permit)', category: 'documents' },
  { id: 'prayer-map', label: 'Prayer map / Qibla direction guide', category: 'documents' },
  { id: 'ihram-garments', label: 'Pack Ihram garments (2 pieces, for men)', category: 'clothing' },
  { id: 'modest-clothing', label: 'Pack modest clothing', category: 'clothing' },
  { id: 'walking-shoes', label: 'Comfortable walking shoes', category: 'clothing' },
  { id: 'umbrella', label: 'Umbrella / sun protection', category: 'clothing' },
  { id: 'first-aid-kit', label: 'Assemble a first aid kit', category: 'health' },
  { id: 'medications', label: 'Essential medications and prescriptions', category: 'health' },
  { id: 'toiletries', label: 'Pack toiletries', category: 'health' },
  { id: 'water-bottle', label: 'Reusable water bottle', category: 'essentials' },
  { id: 'phone-charger', label: 'Phone, charger, and power bank', category: 'essentials' },
  { id: 'cash-cards', label: 'Cash and payment cards', category: 'essentials' },
  { id: 'prayer-rug', label: 'Small prayer rug', category: 'essentials' },
  { id: 'backpack', label: 'Lightweight daypack for daily essentials', category: 'essentials' },
];

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistItem['category'], string> = {
  documents: 'Documents',
  clothing: 'Clothing',
  health: 'Health & Hygiene',
  essentials: 'Essentials',
};
