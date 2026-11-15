export interface DuaItem {
  id: string;
  occasion: string;
  category: 'umrah' | 'hajj' | 'both';
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

// Authentic supplications sourced from the Qur'an and Sahih hadith collections.
export const DUA_LIST: DuaItem[] = [
  {
    id: 'talbiyah',
    occasion: 'Entering Ihram (Talbiyah)',
    category: 'both',
    arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration: "Labbayk Allahumma labbayk, labbayka la sharika laka labbayk, innal-hamda wan-ni'mata laka wal-mulk, la sharika lak",
    translation: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise, grace, and sovereignty belong to You. You have no partner.',
    source: 'Sahih al-Bukhari & Sahih Muslim',
  },
  {
    id: 'black-stone',
    occasion: 'Touching/Pointing to the Black Stone',
    category: 'both',
    arabic: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ',
    transliteration: 'Bismillah, Allahu Akbar',
    translation: 'In the name of Allah, Allah is the Greatest.',
    source: 'Reported from Umar ibn al-Khattab, Sahih al-Bukhari',
  },
  {
    id: 'tawaf-rukn',
    occasion: 'Between the Yemeni Corner and the Black Stone (during Tawaf)',
    category: 'both',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: "Qur'an 2:201; narrated by Anas, Sahih al-Bukhari",
  },
  {
    id: 'safa-marwah',
    occasion: "Atop Safa and Marwah (before beginning Sa'i)",
    category: 'both',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. La ilaha illallahu wahdah, anjaza wa'dah, wa nasara 'abdah, wa hazamal-ahzaba wahdah",
    translation: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things powerful. There is no god but Allah alone, Who fulfilled His promise, granted victory to His servant, and alone defeated the confederates.',
    source: "Narrated by Jabir ibn Abdullah describing the Prophet's Hajj, Sahih Muslim",
  },
  {
    id: 'entering-masjid',
    occasion: 'Entering Masjid al-Haram (or any mosque)',
    category: 'both',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allahumma-ftah li abwaba rahmatik',
    translation: 'O Allah, open the doors of Your mercy for me.',
    source: 'Sahih Muslim',
  },
  {
    id: 'travel-dua',
    occasion: 'Setting out on the journey',
    category: 'both',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ',
    transliteration: "Allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa, wa minal-'amali ma tarda. Allahumma hawwin 'alayna safarana hadha watwi 'anna bu'dah",
    translation: 'O Allah, we ask You on this journey of ours for righteousness and piety, and for deeds that please You. O Allah, make this journey easy for us and shorten its distance.',
    source: 'Narrated by Ibn Umar, Sahih Muslim',
  },
  {
    id: 'arafat',
    occasion: 'Standing at Arafat (Day of Arafah)',
    category: 'hajj',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    translation: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things powerful.',
    source: 'Narrated by Amr ibn Shu`ayb, Jami` at-Tirmidhi: "The best of supplication is the supplication on the Day of Arafah"',
  },
  {
    id: 'muzdalifah',
    occasion: 'At Muzdalifah, remembering Allah after Maghrib/Isha',
    category: 'hajj',
    arabic: 'فَاذْكُرُوا اللَّهَ عِنْدَ الْمَشْعَرِ الْحَرَامِ وَاذْكُرُوهُ كَمَا هَدَاكُمْ',
    transliteration: "Fadhkurullaha 'indal-Mash'aril-Haram, wadhkuruhu kama hadakum",
    translation: 'So remember Allah at al-Mash`ar al-Haram, and remember Him as He has guided you.',
    source: "Qur'an 2:198",
  },
  {
    id: 'jamarat',
    occasion: 'Stoning the Jamarat (said with each pebble thrown)',
    category: 'hajj',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest.',
    source: 'Narrated by Jabir ibn Abdullah, Sahih Muslim',
  },
  {
    id: 'mina-dhikr',
    occasion: 'Days of Tashreeq in Mina',
    category: 'hajj',
    arabic: 'وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ',
    transliteration: "Wadhkurullaha fi ayyamim ma'dudat",
    translation: 'And remember Allah during the appointed days.',
    source: "Qur'an 2:203",
  },
  {
    id: 'hajj-mabrur',
    occasion: 'Seeking an accepted pilgrimage',
    category: 'both',
    arabic: 'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا، وَذَنْبًا مَغْفُورًا، وَسَعْيًا مَشْكُورًا',
    transliteration: "Allahumma-j'alhu hajjan mabrura, wa dhanban maghfura, wa sa'yan mashkura",
    translation: 'O Allah, make this an accepted pilgrimage, a forgiven sin, and an appreciated effort.',
    source: "Traditional supplication based on the hadith on Hajj Mabrur, Sahih al-Bukhari & Sahih Muslim",
  },
];

export const DUA_CATEGORY_LABELS: Record<'all' | 'umrah' | 'hajj', string> = {
  all: 'All',
  umrah: 'Umrah',
  hajj: 'Hajj',
};
