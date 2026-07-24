#!/bin/bash
awk '
/      <Header/ {
    print $0
    print "        appTheme={appTheme}"
    next
}
/      <SettingsModal/ {
    print $0
    print "        appTheme={appTheme}"
    next
}
/      <AdminMembersDashboard/ {
    print $0
    print "        appTheme={appTheme}"
    print "        totalBorrowers={borrowers.length}"
    next
}
/      <BorrowerList/ {
    print $0
    print "        appTheme={appTheme}"
    next
}
/      <LoanApplicationsControlPanel/ {
    print $0
    print "        appTheme={appTheme}"
    next
}
/      <ShareholderDashboard/ {
    print $0
    print "        appTheme={appTheme}"
    next
}
{ print }
' src/App.tsx > tmp_app3.tsx && mv tmp_app3.tsx src/App.tsx
