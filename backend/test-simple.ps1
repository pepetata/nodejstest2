# Simple test for location administrator role filtering
Write-Host "🔍 Testing Location Administrator Role Filtering..." -ForegroundColor Yellow

# Test credentials
$credentials = @{
    username = "admin"
    password = "admin123"
}

# Test with single location restaurant (padre)
Write-Host "`n📍 Testing Single Location Restaurant (padre)..."
try {
    $singleResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/roles/available?restaurantId=padre" -Method GET -Headers @{
        "Authorization" = "Bearer $($env:TOKEN)"
        "Content-Type" = "application/json"
    }

    $hasLocationAdmin = $false
    foreach ($role in $singleResponse.roles) {
        if ($role.name -eq "location_administrator") {
            $hasLocationAdmin = $true
            break
        }
    }

    Write-Host "Roles count: $($singleResponse.roles.Count)"
    Write-Host "Has Location Administrator role: $hasLocationAdmin"

} catch {
    Write-Host "Error testing single location: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with multi location restaurant (padre2)
Write-Host "`n📍 Testing Multi Location Restaurant (padre2)..."
try {
    $multiResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/roles/available?restaurantId=padre2" -Method GET -Headers @{
        "Authorization" = "Bearer $($env:TOKEN)"
        "Content-Type" = "application/json"
    }

    $hasLocationAdminMulti = $false
    foreach ($role in $multiResponse.roles) {
        if ($role.name -eq "location_administrator") {
            $hasLocationAdminMulti = $true
            break
        }
    }

    Write-Host "Roles count: $($multiResponse.roles.Count)"
    Write-Host "Has Location Administrator role: $hasLocationAdminMulti"

} catch {
    Write-Host "Error testing multi location: $($_.Exception.Message)" -ForegroundColor Red
}

# Results
Write-Host "`n📊 Test Results:" -ForegroundColor Cyan
if ($hasLocationAdmin) {
    Write-Host "❌ Single location SHOWS Location Admin role (should be hidden)" -ForegroundColor Red
} else {
    Write-Host "✅ Single location HIDES Location Admin role (correct)" -ForegroundColor Green
}

if ($hasLocationAdminMulti) {
    Write-Host "✅ Multi location SHOWS Location Admin role (correct)" -ForegroundColor Green
} else {
    Write-Host "❌ Multi location HIDES Location Admin role (should be shown)" -ForegroundColor Red
}

$testPassed = (-not $hasLocationAdmin) -and $hasLocationAdminMulti
Write-Host ""
if ($testPassed) {
    Write-Host "🎉 Test PASSED - Location Administrator filtering is working!" -ForegroundColor Green
} else {
    Write-Host "🎉 Test FAILED - Location Administrator filtering needs fixes" -ForegroundColor Red
}
