# PowerShell test script for location administrator filtering
# Test the API endpoints directly

$BASE_URL = "http://localhost:5000/api"

# Test user credentials
$singleLocationUser = @{
    email = "flavio_luiz_ferreira@hotmail.com"
    password = "12345678"
}

$multiLocationUser = @{
    email = "flavio_luiz_ferreira_chain@hotmail.com"
    password = "12345678"
}

function Test-Login {
    param($credentials)

    try {
        $body = $credentials | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $body -ContentType "application/json"

        if ($response.success) {
            return $response.token
        } else {
            throw "Login failed: $($response.message)"
        }
    } catch {
        Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-GetLocations {
    param($token)

    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$BASE_URL/users/locations" -Method Get -Headers $headers

        if ($response.success) {
            return $response.data
        } else {
            throw "Failed to get locations: $($response.message)"
        }
    } catch {
        Write-Host "❌ Failed to get locations: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-GetRoles {
    param($token)

    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$BASE_URL/users/roles" -Method Get -Headers $headers

        if ($response.success) {
            return $response.data
        } else {
            throw "Failed to get roles: $($response.message)"
        }
    } catch {
        Write-Host "❌ Failed to get roles: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

Write-Host "🧪 Testing Location Administrator Role Filtering" -ForegroundColor Cyan
Write-Host ""

try {
    # Test 1: Single Location Restaurant
    Write-Host "📍 Test 1: Single Location Restaurant" -ForegroundColor Yellow
    Write-Host "Logging in as single location restaurant admin..."

    $singleLocationToken = Test-Login $singleLocationUser
    Write-Host "✅ Login successful" -ForegroundColor Green

    $singleLocations = Test-GetLocations $singleLocationToken
    $singleRoles = Test-GetRoles $singleLocationToken

    Write-Host "✅ Restaurant has $($singleLocations.Count) location(s):" -ForegroundColor Green
    for ($i = 0; $i -lt $singleLocations.Count; $i++) {
        Write-Host "   $($i + 1). $($singleLocations[$i].name)"
    }

    $hasLocationAdmin = $singleRoles | Where-Object { $_.name -eq "location_administrator" }
    $roleNames = ($singleRoles | ForEach-Object { $_.name }) -join ", "
    Write-Host "📋 Available roles: $roleNames"

    if ($hasLocationAdmin) {
        Write-Host "🎯 Location Administrator available: ❌ YES (should be NO)" -ForegroundColor Red
    } else {
        Write-Host "🎯 Location Administrator available: ✅ NO (correct)" -ForegroundColor Green
    }

    # Test 2: Multi Location Restaurant
    Write-Host ""
    Write-Host "📍 Test 2: Multi Location Restaurant" -ForegroundColor Yellow
    Write-Host "Logging in as multi location restaurant admin..."

    $multiLocationToken = Test-Login $multiLocationUser
    Write-Host "✅ Login successful" -ForegroundColor Green

    $multiLocations = Test-GetLocations $multiLocationToken
    $multiRoles = Test-GetRoles $multiLocationToken

    Write-Host "✅ Restaurant has $($multiLocations.Count) location(s):" -ForegroundColor Green
    for ($i = 0; $i -lt $multiLocations.Count; $i++) {
        Write-Host "   $($i + 1). $($multiLocations[$i].name)"
    }

    $hasLocationAdminMulti = $multiRoles | Where-Object { $_.name -eq "location_administrator" }
    $multiRoleNames = ($multiRoles | ForEach-Object { $_.name }) -join ", "
    Write-Host "📋 Available roles: $multiRoleNames"

    if ($hasLocationAdminMulti) {
        Write-Host "🎯 Location Administrator available: ✅ YES (correct)" -ForegroundColor Green
    } else {
        Write-Host "🎯 Location Administrator available: ❌ NO (should be YES)" -ForegroundColor Red
    }

    # Summary
    Write-Host ""
    Write-Host "📊 Test Results Summary:" -ForegroundColor Cyan

    $singleCount = $singleLocations.Count
    $multiCount = $multiLocations.Count

    if ($hasLocationAdmin) {
        Write-Host "Single location ($singleCount location): Location Admin role SHOWN ❌"
    } else {
        Write-Host "Single location ($singleCount location): Location Admin role HIDDEN ✅"
    }

    if ($hasLocationAdminMulti) {
        Write-Host "Multi location ($multiCount locations): Location Admin role SHOWN ✅"
    } else {
        Write-Host "Multi location ($multiCount locations): Location Admin role HIDDEN ❌"
    }

    $testPassed = (-not $hasLocationAdmin) -and $hasLocationAdminMulti
    Write-Host ""
    if ($testPassed) {
        Write-Host "🎉 Overall test result: PASSED ✅" -ForegroundColor Green
        Write-Host "✅ Location Administrator role filtering is working correctly!" -ForegroundColor Green
    } else {
        Write-Host "🎉 Overall test result: FAILED ❌" -ForegroundColor Red
        Write-Host "❌ Location Administrator role filtering needs adjustment." -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Test failed:" $_.Exception.Message -ForegroundColor Red
}
