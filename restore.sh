#!/bin/bash
awk '
BEGIN { skip = 0; }
/<SettingsModal/ {
    skip = 1
    next
}
/Borrower Specific Payment QR Modal/ {
    if (skip == 1) {
        skip = 0
        print "      {/* Settings Modal (Language, Theme, and Profile Photo Selection) */}"
        print "      {isSettingsOpen && ("
        system("cat /tmp/settings_modal.txt")
        print ""
        next
    }
}
{
    if (skip == 0) {
        print $0
    }
}
' src/App.tsx > tmp_restore.tsx && mv tmp_restore.tsx src/App.tsx
