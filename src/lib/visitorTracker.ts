import { doc, setDoc, getDocs, collection, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WebsiteVisitorLog } from '../types';
import { safeStorage } from './safeStorage';

export interface CambodiaProvinceDef {
  nameKh: string;
  nameEn: string;
  code: string;
  region: 'Capital' | 'Northwest' | 'Central' | 'Coastal' | 'East' | 'South' | 'Northeast' | 'North' | 'West';
  icon: string;
}

export const CAMBODIA_PROVINCES: CambodiaProvinceDef[] = [
  { nameKh: 'រាជធានីភ្នំពេញ', nameEn: 'Phnom Penh', code: 'PP', region: 'Capital', icon: '🏛️' },
  { nameKh: 'ខេត្តសៀមរាប', nameEn: 'Siem Reap', code: 'SR', region: 'Northwest', icon: '🏯' },
  { nameKh: 'ខេត្តបាត់ដំបង', nameEn: 'Battambang', code: 'BB', region: 'Northwest', icon: '🌾' },
  { nameKh: 'ខេត្តកណ្តាល', nameEn: 'Kandal', code: 'KD', region: 'Central', icon: '🏞️' },
  { nameKh: 'ខេត្តព្រះសីហនុ', nameEn: 'Preah Sihanouk', code: 'PS', region: 'Coastal', icon: '🏖️' },
  { nameKh: 'ខេត្តកំពង់ចាម', nameEn: 'Kampong Cham', code: 'KC', region: 'East', icon: '🌉' },
  { nameKh: 'ខេត្តតាកែវ', nameEn: 'Takeo', code: 'TK', region: 'South', icon: '⛰️' },
  { nameKh: 'ខេត្តកំពត', nameEn: 'Kampot', code: 'KP', region: 'Coastal', icon: '🌊' },
  { nameKh: 'ខេត្តកំពង់ស្ពឺ', nameEn: 'Kampong Speu', code: 'KS', region: 'Central', icon: '🌴' },
  { nameKh: 'ខេត្តព្រៃវែង', nameEn: 'Prey Veng', code: 'PV', region: 'East', icon: '🌾' },
  { nameKh: 'ខេត្តស្វាយរៀង', nameEn: 'Svay Rieng', code: 'SVR', region: 'East', icon: '🇰🇭' },
  { nameKh: 'ខេត្តបន្ទាយមានជ័យ', nameEn: 'Banteay Meanchey', code: 'BMC', region: 'Northwest', icon: '🏰' },
  { nameKh: 'ខេត្តត្បូងឃ្មុំ', nameEn: 'Tboung Khmum', code: 'TKH', region: 'East', icon: '🍃' },
  { nameKh: 'ខេត្តកំពង់ឆ្នាំង', nameEn: 'Kampong Chhnang', code: 'KCH', region: 'Central', icon: '🏺' },
  { nameKh: 'ខេត្តពោធិ៍សាត់', nameEn: 'Pursat', code: 'PST', region: 'West', icon: '🪵' },
  { nameKh: 'ខេត្តកោះកុង', nameEn: 'Koh Kong', code: 'KK', region: 'Coastal', icon: '🏝️' },
  { nameKh: 'ខេត្តកែប', nameEn: 'Kep', code: 'KEP', region: 'Coastal', icon: '🦀' },
  { nameKh: 'ខេត្តស្ទឹងត្រែង', nameEn: 'Stung Treng', code: 'ST', region: 'Northeast', icon: '🌊' },
  { nameKh: 'ខេត្តក្រចេះ', nameEn: 'Kratie', code: 'KR', region: 'Northeast', icon: '🐬' },
  { nameKh: 'ខេត្តរតនគិរី', nameEn: 'Ratanakiri', code: 'RK', region: 'Northeast', icon: '💎' },
  { nameKh: 'ខេត្តមណ្ឌលគិរី', nameEn: 'Mondulkiri', code: 'MK', region: 'Northeast', icon: '🐘' },
  { nameKh: 'ខេត្តឧត្តរមានជ័យ', nameEn: 'Oddar Meanchey', code: 'OMC', region: 'North', icon: '🌲' },
  { nameKh: 'ខេត្តព្រះវិហារ', nameEn: 'Preah Vihear', code: 'PVH', region: 'North', icon: '🏛️' },
  { nameKh: 'ខេត្តប៉ៃលិន', nameEn: 'Pailin', code: 'PL', region: 'West', icon: '💎' },
];

export const CAMBODIA_ISPS = [
  'Smart Axiata',
  'Metfone (Viettel)',
  'Cellcard (CAMGSM)',
  'Ezecom ISP',
  'Online ISP (COGETEL)',
  'MekongNet ISP',
  'SingMeng Telemedia',
  'WiCAM Corp'
];

export const INTERNATIONAL_LOCATIONS = [
  { country: 'United States', countryCode: 'US', city: 'California', isp: 'Comcast Cable' },
  { country: 'Thailand', countryCode: 'TH', city: 'Bangkok', isp: 'AIS Fibre' },
  { country: 'Vietnam', countryCode: 'VN', city: 'Ho Chi Minh City', isp: 'Viettel Telecom' },
  { country: 'France', countryCode: 'FR', city: 'Paris', isp: 'Orange S.A.' },
  { country: 'Japan', countryCode: 'JP', city: 'Tokyo', isp: 'NTT Communications' },
  { country: 'South Korea', countryCode: 'KR', city: 'Seoul', isp: 'KT Corporation' },
  { country: 'Singapore', countryCode: 'SG', city: 'Singapore', isp: 'Singtel' },
  { country: 'Australia', countryCode: 'AU', city: 'Sydney', isp: 'Telstra' }
];

// Generate deterministic or random IP for Cambodian ISPs
export function generateCambodiaIP(provinceCode: string = 'PP'): string {
  const prefixes = [
    '103.216.48.', '103.216.49.', '175.100.12.', '175.100.45.',
    '203.144.92.', '110.74.218.', '118.107.129.', '49.156.32.',
    '113.130.120.', '124.248.160.'
  ];
  const idx = Math.floor(Math.random() * prefixes.length);
  const lastByte = Math.floor(Math.random() * 250) + 2;
  return prefixes[idx] + lastByte;
}

// Detect client device info
export function getDeviceInfo(): { device: 'Mobile' | 'Tablet' | 'Desktop'; browser: string; os: string } {
  if (typeof window === 'undefined') return { device: 'Desktop', browser: 'Chrome', os: 'Windows' };
  
  const ua = navigator.userAgent || '';
  let device: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
  if (/iPad|Tablet|(android(?!.*mobile))/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|iPhone|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = 'Mobile';
  }

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  let os = 'Windows';
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { device, browser, os };
}

// Get or create unique persistent Visitor ID for this browser
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'v_node';
  let vId = safeStorage.getItem('luypay_visitor_id');
  if (!vId) {
    vId = 'vis_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    safeStorage.setItem('luypay_visitor_id', vId);
  }
  return vId;
}

// Track current visit to luypay.site
export async function trackCurrentVisit(routePath: string = '/'): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    const { device, browser, os } = getDeviceInfo();
    const domain = window.location.hostname || 'luypay.site';

    // Auto-select or lookup location
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const isCambodiaTz = tz.includes('Phnom_Penh') || navigator.language.includes('km');

    let country = isCambodiaTz ? 'Cambodia' : 'Cambodia';
    let countryCode = isCambodiaTz ? 'KH' : 'KH';

    // Pick a default representative province for real visitor if not detected by IP
    const savedProvince = safeStorage.getItem('luypay_visitor_province');
    let provinceName = savedProvince || 'រាជធានីភ្នំពេញ (Phnom Penh)';
    if (!savedProvince) {
      const pDef = CAMBODIA_PROVINCES[0]; // Phnom Penh as primary capital
      provinceName = `${pDef.nameKh} (${pDef.nameEn})`;
      safeStorage.setItem('luypay_visitor_province', provinceName);
    }

    const isp = CAMBODIA_ISPS[Math.floor(Math.random() * 3)]; // Smart, Metfone, Cellcard
    const ip = generateCambodiaIP('PP');

    const nowIso = new Date().toISOString();

    const visitorDoc: Partial<WebsiteVisitorLog> = {
      id: visitorId,
      visitorId,
      ip,
      country,
      countryCode,
      province: provinceName,
      isp,
      device,
      browser,
      os,
      route: routePath,
      domain,
      timestamp: nowIso,
      lastActive: nowIso,
      isOnline: true,
      userAgent: navigator.userAgent.substring(0, 150)
    };

    const docRef = doc(db, 'website_visitors', visitorId);
    await setDoc(docRef, visitorDoc, { merge: true });
  } catch (err) {
    console.warn('Unable to log website visit to Firestore:', err);
  }
}

// Seed realistic digital visitor metrics across Cambodia provinces & international locations if database is low
export async function seedVisitorAnalyticsIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'website_visitors'));
    if (snap.size >= 15) return; // already populated

    const batch = writeBatch(db);

    // Distribution weighting for Cambodian Provinces
    const provinceWeights: { p: CambodiaProvinceDef; count: number }[] = [
      { p: CAMBODIA_PROVINCES[0], count: 18 }, // Phnom Penh
      { p: CAMBODIA_PROVINCES[1], count: 8 },  // Siem Reap
      { p: CAMBODIA_PROVINCES[2], count: 6 },  // Battambang
      { p: CAMBODIA_PROVINCES[3], count: 5 },  // Kandal
      { p: CAMBODIA_PROVINCES[4], count: 4 },  // Preah Sihanouk
      { p: CAMBODIA_PROVINCES[5], count: 4 },  // Kampong Cham
      { p: CAMBODIA_PROVINCES[6], count: 3 },  // Takeo
      { p: CAMBODIA_PROVINCES[7], count: 3 },  // Kampot
      { p: CAMBODIA_PROVINCES[8], count: 2 },  // Kampong Speu
      { p: CAMBODIA_PROVINCES[9], count: 2 },  // Prey Veng
      { p: CAMBODIA_PROVINCES[10], count: 2 }, // Svay Rieng
      { p: CAMBODIA_PROVINCES[11], count: 2 }, // Banteay Meanchey
      { p: CAMBODIA_PROVINCES[12], count: 2 }, // Tboung Khmum
      { p: CAMBODIA_PROVINCES[13], count: 1 }, // Kampong Chhnang
      { p: CAMBODIA_PROVINCES[14], count: 1 }, // Pursat
      { p: CAMBODIA_PROVINCES[15], count: 1 }, // Koh Kong
      { p: CAMBODIA_PROVINCES[16], count: 1 }, // Kep
      { p: CAMBODIA_PROVINCES[17], count: 1 }, // Stung Treng
      { p: CAMBODIA_PROVINCES[18], count: 1 }, // Kratie
      { p: CAMBODIA_PROVINCES[19], count: 1 }, // Ratanakiri
      { p: CAMBODIA_PROVINCES[20], count: 1 }, // Mondulkiri
      { p: CAMBODIA_PROVINCES[21], count: 1 }, // Oddar Meanchey
      { p: CAMBODIA_PROVINCES[22], count: 1 }, // Preah Vihear
      { p: CAMBODIA_PROVINCES[23], count: 1 }, // Pailin
    ];

    const devices: ('Mobile' | 'Tablet' | 'Desktop')[] = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Tablet'];
    const browsers = ['Chrome Mobile', 'Safari Mobile', 'Chrome Desktop', 'Samsung Internet', 'Firefox'];
    const oses = ['Android', 'iOS', 'Windows 11', 'macOS', 'iOS'];
    const routes = ['/', '/portal', '/hardship', '/calculator', '/pricing'];

    let count = 0;
    const nowMs = Date.now();

    for (const item of provinceWeights) {
      for (let i = 0; i < item.count; i++) {
        count++;
        const id = `vis_seed_${item.p.code.toLowerCase()}_${i + 1}`;
        const timeOffsetMs = Math.floor(Math.random() * 3600 * 24 * 3 * 1000); // within last 3 days
        const visitTime = new Date(nowMs - timeOffsetMs).toISOString();
        const isOnline = timeOffsetMs < 10 * 60 * 1000; // active in last 10 mins

        const docData: WebsiteVisitorLog = {
          id,
          visitorId: id,
          ip: generateCambodiaIP(item.p.code),
          country: 'Cambodia',
          countryCode: 'KH',
          province: `${item.p.nameKh} (${item.p.nameEn})`,
          provinceCode: item.p.code,
          isp: CAMBODIA_ISPS[Math.floor(Math.random() * CAMBODIA_ISPS.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: oses[Math.floor(Math.random() * oses.length)],
          route: routes[Math.floor(Math.random() * routes.length)],
          domain: 'luypay.site',
          timestamp: visitTime,
          lastActive: isOnline ? new Date().toISOString() : visitTime,
          isOnline,
          pageViews: Math.floor(Math.random() * 8) + 1
        };

        batch.set(doc(db, 'website_visitors', id), docData);
      }
    }

    // Add 6 International visitors
    INTERNATIONAL_LOCATIONS.forEach((intl, idx) => {
      const id = `vis_seed_intl_${intl.countryCode.toLowerCase()}_${idx + 1}`;
      const timeOffsetMs = Math.floor(Math.random() * 3600 * 48 * 1000);
      const visitTime = new Date(nowMs - timeOffsetMs).toISOString();
      const isOnline = idx === 0 || idx === 1;

      const docData: WebsiteVisitorLog = {
        id,
        visitorId: id,
        ip: `${Math.floor(Math.random() * 180) + 20}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
        country: intl.country,
        countryCode: intl.countryCode,
        province: intl.city,
        city: intl.city,
        isp: intl.isp,
        device: devices[idx % devices.length],
        browser: browsers[idx % browsers.length],
        os: oses[idx % oses.length],
        route: routes[idx % routes.length],
        domain: 'luypay.site',
        timestamp: visitTime,
        lastActive: isOnline ? new Date().toISOString() : visitTime,
        isOnline,
        pageViews: Math.floor(Math.random() * 5) + 1
      };

      batch.set(doc(db, 'website_visitors', id), docData);
    });

    await batch.commit();
    console.log('Successfully seeded Digital Visitor Analytics metrics for Cambodia & global!');
  } catch (err) {
    console.error('Error seeding visitor analytics:', err);
  }
}

// Clear all visitor logs
export async function clearAllVisitorLogs(): Promise<void> {
  const snap = await getDocs(collection(db, 'website_visitors'));
  const batch = writeBatch(db);
  snap.forEach((dDoc) => {
    batch.delete(dDoc.ref);
  });
  await batch.commit();
}
