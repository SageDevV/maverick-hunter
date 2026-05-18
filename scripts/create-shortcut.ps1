# Create Desktop Shortcut for Maverick Hunter
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path $DesktopPath "Maverick Hunter.lnk"
$ProjectDir = "c:\Users\usuario\Documents\Workspace.AI\maverick-hunter"
$IconPath = Join-Path $ProjectDir "assets\icon.ico"

try {
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "cmd.exe"
    $Shortcut.Arguments = "/k cd /d `"$ProjectDir`" && node src/index.mjs --once"
    $Shortcut.WorkingDirectory = $ProjectDir
    # Suffix with ,0 to explicitly reference the first icon index inside the .ico file
    $Shortcut.IconLocation = "$IconPath,0"
    $Shortcut.Description = "Execute Maverick Hunter's daily task on-demand and show status."
    $Shortcut.Save()
    Write-Host "Shortcut created/updated successfully at $ShortcutPath"

    # Force Windows shell to refresh the desktop icon cache
    Write-Host "Refreshing Windows Explorer icon cache..."
    $code = '[DllImport("shell32.dll")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);'
    $type = Add-Type -MemberDefinition $code -Name "Shell32" -Namespace "Win32" -PassThru
    $type::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "Explorer cache refreshed successfully!"
    exit 0
} catch {
    Write-Error "Failed to create shortcut or refresh cache: $_"
    exit 1
}
