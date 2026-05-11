# ══════════════════════════════════════════════════════════
# Maverick Hunter — Uninstall Windows Task Scheduler Job
# ══════════════════════════════════════════════════════════
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\uninstall-scheduler.ps1
# ══════════════════════════════════════════════════════════

$TaskName = "MaverickHunter"

Write-Host ""
Write-Host "  🗑️ Removing Maverick Hunter scheduled task..." -ForegroundColor Yellow

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    # Stop the task if running
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    
    # Unregister
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    
    Write-Host "  ✅ Task '$TaskName' removed successfully." -ForegroundColor Green
} else {
    Write-Host "  ℹ️ Task '$TaskName' not found. Nothing to remove." -ForegroundColor Gray
}
Write-Host ""
