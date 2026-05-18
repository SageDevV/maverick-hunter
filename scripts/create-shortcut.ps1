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
    $Shortcut.IconLocation = $IconPath
    $Shortcut.Description = "Execute Maverick Hunter's daily task on-demand and show status."
    $Shortcut.Save()
    Write-Host "Shortcut created successfully at $ShortcutPath"
    exit 0
} catch {
    Write-Error "Failed to create shortcut: $_"
    exit 1
}
