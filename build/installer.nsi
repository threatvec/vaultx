; VAULTX NSIS Installer Script
; Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.

!include "MUI2.nsh"
!include "FileFunc.nsh"

; ─── General ─────────────────────────────────────────────────────────
Name "VAULTX"
OutFile "VAULTX-Setup.exe"
InstallDir "$PROGRAMFILES64\VAULTX"
InstallDirRegKey HKLM "Software\VAULTX" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
BrandingText "VAULTX v1.0.0 — by threatvec & talkdedsec"

; ─── Version Info ────────────────────────────────────────────────────
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "VAULTX"
VIAddVersionKey "CompanyName" "threatvec & talkdedsec"
VIAddVersionKey "LegalCopyright" "Copyright (c) 2026 threatvec & talkdedsec"
VIAddVersionKey "FileDescription" "VAULTX Security Toolkit Installer"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "ProductVersion" "1.0.0"

; ─── MUI Settings ────────────────────────────────────────────────────
!define MUI_ICON "windows\icon.ico"
!define MUI_UNICON "windows\icon.ico"
!define MUI_ABORTWARNING
!define MUI_HEADERIMAGE
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH

; ─── Pages ───────────────────────────────────────────────────────────
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ─── Languages ───────────────────────────────────────────────────────
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Turkish"

; ─── Install Section ─────────────────────────────────────────────────
Section "VAULTX" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"

  ; Copy files
  File "bin\vaultx.exe"

  ; Create data directory
  CreateDirectory "$APPDATA\VAULTX"

  ; Desktop shortcut
  CreateShortCut "$DESKTOP\VAULTX.lnk" "$INSTDIR\vaultx.exe" "" "$INSTDIR\vaultx.exe" 0

  ; Start Menu
  CreateDirectory "$SMPROGRAMS\VAULTX"
  CreateShortCut "$SMPROGRAMS\VAULTX\VAULTX.lnk" "$INSTDIR\vaultx.exe" "" "$INSTDIR\vaultx.exe" 0
  CreateShortCut "$SMPROGRAMS\VAULTX\Uninstall.lnk" "$INSTDIR\uninstall.exe"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Add/Remove Programs registry
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "DisplayName" "VAULTX"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "DisplayIcon" '"$INSTDIR\vaultx.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "Publisher" "threatvec & talkdedsec"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "DisplayVersion" "1.0.0"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "NoRepair" 1

  ; Get installed size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX" "EstimatedSize" "$0"

  WriteRegStr HKLM "Software\VAULTX" "InstallDir" "$INSTDIR"
SectionEnd

; ─── Uninstall Section ───────────────────────────────────────────────
Section "Uninstall"
  ; Remove files
  Delete "$INSTDIR\vaultx.exe"
  Delete "$INSTDIR\uninstall.exe"

  ; Remove shortcuts
  Delete "$DESKTOP\VAULTX.lnk"
  Delete "$SMPROGRAMS\VAULTX\VAULTX.lnk"
  Delete "$SMPROGRAMS\VAULTX\Uninstall.lnk"
  RMDir "$SMPROGRAMS\VAULTX"

  ; Remove install directory
  RMDir "$INSTDIR"

  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VAULTX"
  DeleteRegKey HKLM "Software\VAULTX"

  ; Note: We do NOT delete %APPDATA%\VAULTX to preserve user data
SectionEnd
