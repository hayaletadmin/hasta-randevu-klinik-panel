# PowerShell script to add dynamic export to all admin pages

$files = @(
    "src\app\admin\page.tsx",
    "src\app\admin\randevular\liste\page.tsx",
    "src\app\admin\randevular\takvim\page.tsx",
    "src\app\admin\hastalar\liste\page.tsx",
    "src\app\admin\hastalar\ekle\page.tsx",
    "src\app\admin\hastalar\gruplar\page.tsx",
    "src\app\admin\hastalar\hasta-karti\[id]\page.tsx",
    "src\app\admin\yardim\page.tsx"
)

$dynamicExport = @"
// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

"@

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if dynamic export already exists
        if ($content -notmatch "export const dynamic") {
            # Find the line after "use client" or after imports
            if ($content -match '("use client"|''use client'')\s*\r?\n') {
                $content = $content -replace '("use client"|''use client'')\s*\r?\n', "`$&`r`n$dynamicExport"
            } elseif ($content -match 'export default function') {
                $content = $content -replace '(export default function)', "$dynamicExport`$1"
            }
            
            Set-Content $fullPath $content -NoNewline
            Write-Host "Added dynamic export to: $file" -ForegroundColor Green
        } else {
            Write-Host "Dynamic export already exists in: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
