#!/bin/bash
awk '
BEGIN { in_modal = 0; }
/{\/\* Settings Modal/ {
    if (in_modal == 0) {
        print "      {/* Settings Modal (Language, Theme, and Profile Photo Selection) */}"
        print "      <SettingsModal"
        print "        isOpen={isSettingsOpen}"
        print "        onClose={() => setIsSettingsOpen(false)}"
        print "        language={language}"
        print "        setLanguage={setLanguage}"
        print "        theme={theme}"
        print "        setTheme={setTheme}"
        print "        appTheme={appTheme}"
        print "        setAppTheme={setAppTheme}"
        print "        buttonStyle={buttonStyle}"
        print "        setButtonStyle={setButtonStyle}"
        print "        enableAnimations={enableAnimations}"
        print "        setEnableAnimations={setEnableAnimations}"
        print "        enableSoundEffects={enableSoundEffects}"
        print "        setEnableSoundEffects={setEnableSoundEffects}"
        print "        hideBorrowerAvatarFrames={hideBorrowerAvatarFrames}"
        print "        setHideBorrowerAvatarFrames={setHideBorrowerAvatarFrames}"
        print "        showAdminContactSettings={showAdminContactSettings}"
        print "        setShowAdminContactSettings={setShowAdminContactSettings}"
        print "        playClickSound={playClickSound}"
        print "        currentThemeConfig={currentThemeConfig}"
        print "        appThemes={THEMES}"
        print "        systemLogo={systemLogo}"
        print "        triggerSystemLogoUpload={triggerSystemLogoUpload}"
        print "        handleSystemLogoUpload={handleSystemLogoUpload}"
        print "        systemLogoInputRef={systemLogoInputRef}"
        print "        isAdmin={isAdmin}"
        print "      />"
        in_modal = 1
        next
    }
}
/{\/\* Borrower Specific Payment QR Modal \*\// {
    if (in_modal == 1) {
        in_modal = 0
        print "      {/* Borrower Specific Payment QR Modal */}"
        next
    }
}
{
    if (in_modal == 0) {
        print $0
    }
}
' src/App.tsx > tmp_app.tsx && mv tmp_app.tsx src/App.tsx
