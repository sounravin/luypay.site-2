#!/bin/bash
sed -i 's/import { AppThemeType, ButtonStyleType } from "..\/types";/import type { AppThemeType, ButtonStyleType } from "..\/utils\/theme";/' src/components/SettingsModal.tsx
sed -i 's/tPreset.name}/tPreset.nameEn}/g' src/components/SettingsModal.tsx
