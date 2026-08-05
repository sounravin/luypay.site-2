import React, { useState, useEffect } from 'react';
import { 
  Globe, Radio, Shield, Users, Smartphone, Monitor, Search, 
  RefreshCw, Trash2, Filter, Activity, Cpu, Compass, MapPin, 
  ChevronRight, ArrowUpRight, CheckCircle2, AlertCircle, Play, Eye
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WebsiteVisitorLog } from '../types';
import { 
  CAMBODIA_PROVINCES, CAMBODIA_ISPS, INTERNATIONAL_LOCATIONS, 
  seedVisitorAnalyticsIfEmpty, generateCambodiaIP, clearAllVisitorLogs
} from '../lib/visitorTracker';

interface DigitalVisitorAnalyticsDashboardProps {
  language: 'kh' | 'en';
  showToast: (msg: string, type?: 'success' | 'info') => void;
}

export default function DigitalVisitorAnalyticsDashboard({
  language,
  showToast
}: DigitalVisitorAnalyticsDashboardProps) {
  const [visitors, setVisitors] = useState<WebsiteVisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'online' | 'kh_only'>('all');
  const [showFullIp, setShowFullIp] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Subscribe to website_visitors in Firestore real-time
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    const initTracking = async () => {
      setIsLoading(true);
      await seedVisitorAnalyticsIfEmpty();
      
      const q = query(collection(db, 'website_visitors'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: WebsiteVisitorLog[] = [];
        snapshot.forEach((dDoc) => {
          list.push({ id: dDoc.id, ...dDoc.data() } as WebsiteVisitorLog);
        });

        // Sort by timestamp descending
        list.sort((a, b) => new Date(b.timestamp || b.lastActive || 0).getTime() - new Date(a.timestamp || a.lastActive || 0).getTime());
        setVisitors(list);
        setIsLoading(false);
      }, (err) => {
        console.warn('Error fetching visitor analytics snapshot:', err);
        setIsLoading(false);
      });
    };

    initTracking();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Calculate Metrics
  const totalVisits = visitors.length;
  
  // Consider visitor online if lastActive is within 5 minutes
  const nowMs = Date.now();
  const onlineVisitors = visitors.filter(v => {
    if (!v.lastActive && !v.timestamp) return false;
    const lastActiveMs = new Date(v.lastActive || v.timestamp).getTime();
    return (nowMs - lastActiveMs) < 5 * 60 * 1000;
  });
  const onlineCount = onlineVisitors.length;

  const cambodiaVisitors = visitors.filter(v => v.countryCode === 'KH' || v.country === 'Cambodia');
  const cambodiaCount = cambodiaVisitors.length;
  const cambodiaPercent = totalVisits > 0 ? ((cambodiaCount / totalVisits) * 100).toFixed(1) : '0';

  const intlVisitors = visitors.filter(v => v.countryCode !== 'KH' && v.country !== 'Cambodia');
  const intlCount = intlVisitors.length;
  const intlPercent = totalVisits > 0 ? ((intlCount / totalVisits) * 100).toFixed(1) : '0';

  const mobileCount = visitors.filter(v => v.device === 'Mobile').length;
  const desktopCount = visitors.filter(v => v.device === 'Desktop').length;
  const tabletCount = visitors.filter(v => v.device === 'Tablet').length;

  // Aggregate stats per Cambodian Province
  const provinceStatsMap: Record<string, { count: number; online: number; lastIp: string; topIsp: string }> = {};
  
  // Initialize all 25 provinces so none are left out
  CAMBODIA_PROVINCES.forEach(p => {
    provinceStatsMap[p.code] = { count: 0, online: 0, lastIp: '', topIsp: 'Smart Axiata' };
  });

  cambodiaVisitors.forEach(v => {
    // Match by province code or name string
    const matchDef = CAMBODIA_PROVINCES.find(p => 
      (v.provinceCode && v.provinceCode === p.code) ||
      (v.province && (v.province.includes(p.nameKh) || v.province.includes(p.nameEn)))
    );

    const pCode = matchDef ? matchDef.code : 'PP';
    if (!provinceStatsMap[pCode]) {
      provinceStatsMap[pCode] = { count: 0, online: 0, lastIp: '', topIsp: v.isp || 'Smart' };
    }
    provinceStatsMap[pCode].count += 1;
    
    const isVOnline = v.lastActive && (nowMs - new Date(v.lastActive).getTime()) < 5 * 60 * 1000;
    if (isVOnline) {
      provinceStatsMap[pCode].online += 1;
    }
    if (v.isp) {
      provinceStatsMap[pCode].topIsp = v.isp;
    }
    if (v.ip) {
      provinceStatsMap[pCode].lastIp = v.ip;
    }
  });

  // Filter Visitors for Table
  const filteredVisitors = visitors.filter(v => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      v.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.isp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.browser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.route && v.route.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    let matchesStatus = true;
    if (selectedStatusFilter === 'online') {
      const isVOnline = v.lastActive && (nowMs - new Date(v.lastActive).getTime()) < 5 * 60 * 1000;
      matchesStatus = Boolean(isVOnline);
    } else if (selectedStatusFilter === 'kh_only') {
      matchesStatus = v.countryCode === 'KH' || v.country === 'Cambodia';
    }

    // Province filter
    let matchesProvince = true;
    if (selectedProvinceFilter !== 'all') {
      const pDef = CAMBODIA_PROVINCES.find(p => p.code === selectedProvinceFilter);
      if (pDef) {
        matchesProvince = (v.provinceCode === pDef.code) || 
          (v.province && (v.province.includes(pDef.nameKh) || v.province.includes(pDef.nameEn)));
      }
    }

    // Country filter
    let matchesCountry = true;
    if (selectedCountryFilter !== 'all') {
      if (selectedCountryFilter === 'KH') {
        matchesCountry = v.countryCode === 'KH' || v.country === 'Cambodia';
      } else {
        matchesCountry = v.countryCode === selectedCountryFilter || v.country.toLowerCase().includes(selectedCountryFilter.toLowerCase());
      }
    }

    return matchesSearch && matchesStatus && matchesProvince && matchesCountry;
  });

  // Helper to trigger a live visitor simulation for demonstration/testing
  const handleSimulateVisitor = async () => {
    setIsSimulating(true);
    try {
      // Pick a random province
      const randomProvince = CAMBODIA_PROVINCES[Math.floor(Math.random() * CAMBODIA_PROVINCES.length)];
      const randomIsp = CAMBODIA_ISPS[Math.floor(Math.random() * CAMBODIA_ISPS.length)];
      const randomIp = generateCambodiaIP(randomProvince.code);
      const randomId = `vis_sim_${Date.now().toString(36)}`;
      const routes = ['/', '/portal', '/hardship', '/calculator'];
      const devices: ('Mobile' | 'Desktop')[] = ['Mobile', 'Mobile', 'Desktop'];

      const newSimVisitor: WebsiteVisitorLog = {
        id: randomId,
        visitorId: randomId,
        ip: randomIp,
        country: 'Cambodia',
        countryCode: 'KH',
        province: `${randomProvince.nameKh} (${randomProvince.nameEn})`,
        provinceCode: randomProvince.code,
        isp: randomIsp,
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: 'Chrome Mobile 126.0',
        os: 'Android 14',
        route: routes[Math.floor(Math.random() * routes.length)],
        domain: 'luypay.site',
        timestamp: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isOnline: true,
        pageViews: 1
      };

      await setDoc(doc(db, 'website_visitors', randomId), newSimVisitor);
      showToast(
        language === 'kh'
          ? `⚡️ បានបង្កើតទិន្នន័យ Live Visitor ចូលពី ${randomProvince.nameKh} (${randomIp}) ជោគជ័យ!`
          : `⚡️ Simulated live visit from ${randomProvince.nameEn} (${randomIp})!`,
        'success'
      );
    } catch (err) {
      console.error('Error simulating visitor:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper to clear visitor logs
  const handleClearLogs = async () => {
    if (!window.confirm(language === 'kh' ? 'តើអ្នកពិតជាចង់សម្អាតទិន្នន័យកំណត់ត្រាអ្នកចូលទស្សនាទាំងអស់មែនទេ?' : 'Are you sure you want to clear all website visitor logs?')) return;
    try {
      await clearAllVisitorLogs();
      showToast(language === 'kh' ? 'បានសម្អាតទិន្នន័យកំណត់ត្រារួចរាល់!' : 'All visitor logs cleared!', 'info');
    } catch (err) {
      console.error('Error clearing logs:', err);
      alert('មានបញ្ហាក្នុងការសម្អាតទិន្នន័យ!');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* High-Tech Cyber HUD Header */}
      <div className="relative overflow-hidden bg-slate-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_30px_rgba(6,182,212,0.12)]">
        {/* Decorative Grid Lines & Glowing Elements */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-[11px] font-black tracking-widest uppercase rounded-full shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>DIGITAL GEO RADAR ACTIVE</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-750 text-emerald-400 text-[11px] font-bold rounded-full">
                <Globe className="w-3.5 h-3.5" />
                <span>Target: <strong className="text-white underline decoration-emerald-500 underline-offset-4">luypay.site</strong></span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-8 h-8 text-cyan-400 shrink-0" />
              <span>
                {language === 'kh' ? 'ប្រព័ន្ធតាមដានអ្នកចូលទស្សនា Web DIGITAL (GEO Analytics)' : 'Digital Website Visitors & Cambodia Geo Analytics'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-medium leading-relaxed">
              {language === 'kh'
                ? 'ត្រួតពិនិត្យ និងតាមដានព័ត៌មានអ្នកចូលទស្សនាគេហទំព័រ luypay.site ក្នុងពេលជាក់ស្តែង (Real-time Live Radar) ដោយផ្តោតលើរាជធានី និងខេត្តទាំង ២៥ ក្នុងប្រទេសកម្ពុជា ព្រមទាំងបណ្តាញ ISP និងឧបករណ៍ប្រើប្រាស់។'
                : 'Real-time high-tech digital monitoring of visitors on luypay.site, detailing Cambodian province breakdowns, live IP tracking, ISPs, and device metrics.'}
            </p>
          </div>

          {/* Quick Action Control Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch md:self-auto">
            <button
              onClick={handleSimulateVisitor}
              disabled={isSimulating}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-cyan-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{language === 'kh' ? '⚡️ បង្កើត Live Visit ថ្មី' : '⚡️ Simulate Visit'}</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="px-3 py-2.5 bg-slate-900 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Clear Logs"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'kh' ? 'សម្អាត' : 'Clear'}</span>
            </button>
          </div>
        </div>

        {/* HUD Core Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          
          {/* Total Visits */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/20 rounded-2xl relative overflow-hidden group hover:border-cyan-400/40 transition shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>{language === 'kh' ? 'អ្នកចូលសរុប' : 'Total Visits'}</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalVisits.toLocaleString()}</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">Visits</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-medium truncate">
              🌐 domain: <span className="text-cyan-300">luypay.site</span>
            </div>
          </div>

          {/* Live Online Visitors */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl relative overflow-hidden group hover:border-emerald-400/50 transition shadow-inner">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                {language === 'kh' ? 'កំពុង Online' : 'Live Online'}
              </span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{onlineCount}</span>
              <span className="text-[10px] text-emerald-300 font-mono font-bold">ACTIVE NOW</span>
            </div>
            <div className="mt-2 text-[10px] text-emerald-300/80 font-medium">
              ⚡️ Real-time signal pulsing
            </div>
          </div>

          {/* Cambodia Traffic */}
          <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl relative overflow-hidden group hover:border-blue-400/50 transition shadow-inner">
            <div className="flex items-center justify-between text-blue-300 text-xs font-bold mb-1">
              <span>{language === 'kh' ? '🇰🇭 ក្នុងស្រុកកម្ពុជា' : '🇰🇭 Cambodia'}</span>
              <span className="text-xs font-black text-blue-400">{cambodiaPercent}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{cambodiaCount.toLocaleString()}</span>
              <span className="text-[10px] text-blue-300 font-mono font-bold">Visits</span>
            </div>
            <div className="mt-2 text-[10px] text-blue-300/80 font-medium">
              🏛️ 25 Provinces tracked
            </div>
          </div>

          {/* International Traffic */}
          <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl relative overflow-hidden group hover:border-purple-400/50 transition shadow-inner">
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold mb-1">
              <span>{language === 'kh' ? '🌍 ពីបរទេស' : '🌍 International'}</span>
              <span className="text-xs font-black text-purple-400">{intlPercent}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{intlCount.toLocaleString()}</span>
              <span className="text-[10px] text-purple-300 font-mono font-bold">Visits</span>
            </div>
            <div className="mt-2 text-[10px] text-purple-300/80 font-medium">
              🌐 Global traffic
            </div>
          </div>

          {/* Device Ratio */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
              <span>{language === 'kh' ? 'ឧបករណ៍ប្រើប្រាស់' : 'Device Usage'}</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>{mobileCount}</span>
                <span className="text-[10px] text-slate-400 font-normal">Mobile</span>
              </div>
              <span className="text-slate-700 font-bold">|</span>
              <div className="flex items-center gap-1 text-xs font-black text-cyan-400">
                <Monitor className="w-3.5 h-3.5" />
                <span>{desktopCount}</span>
                <span className="text-[10px] text-slate-400 font-normal">PC</span>
              </div>
            </div>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-amber-400 h-full" style={{ width: `${totalVisits > 0 ? (mobileCount / totalVisits) * 100 : 50}%` }}></div>
              <div className="bg-cyan-400 h-full" style={{ width: `${totalVisits > 0 ? (desktopCount / totalVisits) * 100 : 50}%` }}></div>
            </div>
          </div>

        </div>
      </div>

      {/* Cambodian Provinces Digital Geo Breakdown Cards Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>{language === 'kh' ? 'ទិន្នន័យតាមបណ្តាខេត្ត និងរាជធានីក្នុងប្រទេសកម្ពុជា (Cambodia Provinces)' : 'Cambodia 25 Provinces Geo Distribution'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {language === 'kh' ? 'ស្ថិតិនៃការចូលទស្សនា luypay.site ដោយបែងចែកតាមរាជធានី-ខេត្តទាំង ២៥' : 'Visit breakdown across all 25 provinces in Cambodia'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedProvinceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedProvinceFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'kh' ? 'គ្រប់ 25 ខេត្ត/រាជធានី' : 'All 25 Provinces'}
            </button>
            <button
              onClick={() => setSelectedProvinceFilter('PP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedProvinceFilter === 'PP'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏛️ ភ្នំពេញ
            </button>
            <button
              onClick={() => setSelectedProvinceFilter('SR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedProvinceFilter === 'SR'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏯 សៀមរាប
            </button>
            <button
              onClick={() => setSelectedProvinceFilter('BB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedProvinceFilter === 'BB'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌾 បាត់ដំបង
            </button>
          </div>
        </div>

        {/* 25 Provinces Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CAMBODIA_PROVINCES
            .filter(p => selectedProvinceFilter === 'all' || selectedProvinceFilter === p.code)
            .map((prov) => {
              const stat = provinceStatsMap[prov.code] || { count: 0, online: 0, lastIp: '', topIsp: 'Smart' };
              const percent = cambodiaCount > 0 ? ((stat.count / cambodiaCount) * 100).toFixed(1) : '0';

              return (
                <div 
                  key={prov.code}
                  className={`p-3.5 bg-slate-950 border rounded-2xl transition-all duration-200 relative overflow-hidden group ${
                    stat.online > 0 
                      ? 'border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : stat.count > 0 
                        ? 'border-slate-800 hover:border-cyan-500/30' 
                        : 'border-slate-850 opacity-75'
                  }`}
                >
                  {/* Top line indicator for online */}
                  {stat.online > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-400"></div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 bg-slate-900 border border-slate-800 rounded-xl">{prov.icon}</span>
                      <div>
                        <h4 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                          {prov.nameKh}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium font-sans">
                          {prov.nameEn} • <span className="text-slate-500">{prov.region}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-white">{stat.count}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{percent}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          stat.online > 0 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-cyan-600/70'
                        }`}
                        style={{ width: `${Math.max(Number(percent), stat.count > 0 ? 5 : 0)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-mono truncate max-w-[120px]">
                        📡 {stat.topIsp}
                      </span>

                      {stat.online > 0 ? (
                        <span className="text-emerald-400 font-black flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                          {stat.online} Online
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {stat.count > 0 ? 'សកម្មពីមុន' : 'គ្មានទិន្នន័យ'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Digital Live Visitors Radar Feed Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        
        {/* Table Header & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>{language === 'kh' ? 'កំណត់ត្រាអ្នកចូលទស្សនា Live Logs' : 'Live Digital Visitor Logs'}</span>
              <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-[11px] font-mono font-bold">
                {filteredVisitors.length} / {visitors.length} Logs
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'kh' ? 'ព័ត៌មានលម្អិតនៃ IP ទីតាំងខេត្ត ឧបករណ៍ និងពេលវេលាចូលទស្សនា' : 'Detailed records of IP, location, device, and timestamp'}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'kh' ? 'ស្វែងរក IP/ខេត្ត/ឧបករណ៍...' : 'Search IP/Province...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">{language === 'kh' ? 'ទាំងអស់ (All Logs)' : 'All Logs'}</option>
              <option value="online">🟢 {language === 'kh' ? 'កំពុង Online ឥឡូវ' : 'Online Now'}</option>
              <option value="kh_only">🇰🇭 {language === 'kh' ? 'កម្ពុជា តែប៉ុណ្ណោះ' : 'Cambodia Only'}</option>
            </select>

            {/* Toggle Full IP */}
            <button
              onClick={() => setShowFullIp(!showFullIp)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              title="Toggle IP privacy mask"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showFullIp ? 'Hide IP' : 'Show IP'}</span>
            </button>

          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p>{language === 'kh' ? 'កំពុងទាញយកទិន្នន័យពីពពក...' : 'Fetching live digital visitor analytics...'}</p>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
            <p>{language === 'kh' ? 'មិនមានទិន្នន័យអ្នកចូលទស្សនា តាមតម្រងនេះទេ' : 'No visitor logs match your search criteria'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-black border-b border-slate-800">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">{language === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="p-3 font-mono">{language === 'kh' ? 'អាសយដ្ឋាន IP' : 'IP Address'}</th>
                  <th className="p-3">{language === 'kh' ? 'ទីតាំងរាជធានី-ខេត្ត / ប្រទេស' : 'Province / Location'}</th>
                  <th className="p-3">{language === 'kh' ? 'បណ្តាញ ISP' : 'ISP Provider'}</th>
                  <th className="p-3">{language === 'kh' ? 'ឧបករណ៍ & Browser' : 'Device & Browser'}</th>
                  <th className="p-3">{language === 'kh' ? 'ទំព័រ Route' : 'Route'}</th>
                  <th className="p-3 text-right">{language === 'kh' ? 'កាលបរិច្ឆេទ / ពេលចូល' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredVisitors.map((v, idx) => {
                  const isVOnline = v.lastActive && (nowMs - new Date(v.lastActive).getTime()) < 5 * 60 * 1000;
                  
                  // IP Masking logic
                  let displayIp = v.ip || '103.216.48.***';
                  if (!showFullIp && displayIp.includes('.')) {
                    const parts = displayIp.split('.');
                    if (parts.length === 4) {
                      displayIp = `${parts[0]}.${parts[1]}.${parts[2]}.***`;
                    }
                  }

                  const isKh = v.countryCode === 'KH' || v.country === 'Cambodia';

                  return (
                    <tr 
                      key={v.id || idx}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isVOnline ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        {isVOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-950 text-slate-500 border border-slate-800 rounded-full text-[10px] font-bold">
                            Offline
                          </span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="p-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                        {displayIp}
                      </td>

                      {/* Province / Country */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{isKh ? '🇰🇭' : '🌐'}</span>
                          <div>
                            <span className="font-bold text-white block text-xs">
                              {v.province || 'រាជធានីភ្នំពេញ'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {v.country || 'Cambodia'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ISP */}
                      <td className="p-3 text-slate-300 text-[11px] font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-semibold text-slate-300">
                          📡 {v.isp || 'Smart Axiata'}
                        </span>
                      </td>

                      {/* Device & Browser */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {v.device === 'Mobile' ? (
                            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          )}
                          <span className="text-slate-300 text-xs font-semibold">
                            {v.browser || 'Chrome'} <span className="text-[10px] text-slate-500">({v.os || 'Android'})</span>
                          </span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="p-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-cyan-300">
                          {v.route || '/'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {v.timestamp ? new Date(v.timestamp).toLocaleString(language === 'kh' ? 'km-KH' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : 'ទើបចូលអម្បាញ់មិញ'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
