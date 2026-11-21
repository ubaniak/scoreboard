; Scoreboard Windows installer (NSIS).
; Build: makensis -DVERSION=1.0.0 -DARCH=amd64 -DSRC=build/windows_amd64 -DOUTFILE=build/scoreboard_windows_amd64_setup.exe installers/windows/scoreboard.nsi
; Installs per-user (no admin needed) into %LOCALAPPDATA%\Programs\Scoreboard,
; adds Start Menu and Desktop shortcuts, and registers an uninstaller in
; Settings > Apps. App data in %USERPROFILE%\.scoreboard is left untouched.

Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!ifndef ARCH
  !define ARCH "amd64"
!endif
!ifndef SRC
  !define SRC "..\..\build\windows_${ARCH}"
!endif
!ifndef OUTFILE
  !define OUTFILE "scoreboard_windows_${ARCH}_setup.exe"
!endif

!define APPNAME "Scoreboard"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"

Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\${APPNAME}"
InstallDirRegKey HKCU "Software\${APPNAME}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "${APPNAME} ${VERSION}"

VIProductVersion "0.0.0.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileDescription" "${APPNAME} installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Ubaniak"

!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\scoreboard.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APPNAME}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "${SRC}\scoreboard.exe"
  WriteUninstaller "$INSTDIR\uninstall.exe"

  CreateShortcut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\scoreboard.exe" "" "$INSTDIR\scoreboard.exe" 0
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\scoreboard.exe" "" "$INSTDIR\scoreboard.exe" 0

  WriteRegStr HKCU "Software\${APPNAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "Ubaniak"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\scoreboard.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\scoreboard.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\${APPNAME}.lnk"
  Delete "$DESKTOP\${APPNAME}.lnk"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\${APPNAME}"
SectionEnd
