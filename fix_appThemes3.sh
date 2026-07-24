#!/bin/bash
awk '
/div className="grid grid-cols-2 md:grid-cols-3 gap-2"/ {
    print $0
    print "                  {[ "
    print "                    { id: \"slate\", nameKh: \"លំនាំថ្មភក់\", nameEn: \"Classic Slate\", icon: \"⛰️\", colorClass: \"from-slate-600 to-slate-800 text-slate-100\" },"
    print "                    { id: \"angkor\", nameKh: \"រាជវាំងអង្គរមាស\", nameEn: \"Royal Angkor\", icon: \"🔱\", colorClass: \"from-[#dfb035] to-[#b37e1b] text-white font-black shadow-amber-500/15\" },"
    print "                    { id: \"apsara\", nameKh: \"រាត្រីទេពអប្សរា\", nameEn: \"Celestial Apsara\", icon: \"✨\", colorClass: \"from-[#100a25] to-[#251754] text-[#ebdcfc] shadow-purple-500/15\" },"
    print "                    { id: \"emerald\", nameKh: \"មេគង្គមរកត\", nameEn: \"Mekong Emerald\", icon: \"🌾\", colorClass: \"from-[#031d12] to-[#053c25] text-[#cbfce2] shadow-emerald-500/15\" }"
    print "                  ].map(tPreset => ("
    next
}
{ print }
' src/components/SettingsModal.tsx > tmp_SettingsModal.tsx && mv tmp_SettingsModal.tsx src/components/SettingsModal.tsx
