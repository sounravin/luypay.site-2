#!/bin/bash
sed -i '/(\[/d' src/components/SettingsModal.tsx
sed -i '/{ id: "slate"/d' src/components/SettingsModal.tsx
sed -i '/{ id: "angkor"/d' src/components/SettingsModal.tsx
sed -i '/{ id: "apsara"/d' src/components/SettingsModal.tsx
sed -i '/{ id: "emerald"/d' src/components/SettingsModal.tsx
sed -i '/\].map(tPreset/d' src/components/SettingsModal.tsx
awk '
/appThemes=\{THEMES\}/ {
    print "        appThemes={[]}"
    next
}
{ print }
' src/App.tsx > tmp_app2.tsx && mv tmp_app2.tsx src/App.tsx
