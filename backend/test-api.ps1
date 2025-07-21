# PowerShell test for user management API
$loginUrl = "http://localhost:5000/api/v1/auth/login"
$loginBody = @{
    email = "flavio_luiz_ferreira@hotmail.com"
    password = "12345678"
} | ConvertTo-Json

Write-Host "🔐 Testing login..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"

    if ($loginResponse.data.token) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        $token = $loginResponse.data.token

        # Test endpoints
        $endpoints = @(
            "http://localhost:5000/api/v1/users/roles",
            "http://localhost:5000/api/v1/users/locations",
            "http://localhost:5000/api/v1/users?page=1`&limit=5"
        )

        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

        foreach ($endpoint in $endpoints) {
            Write-Host "`n📡 Testing $endpoint..." -ForegroundColor Yellow

            try {
                $response = Invoke-RestMethod -Uri $endpoint -Method GET -Headers $headers
                Write-Host "✅ SUCCESS - Status: 200" -ForegroundColor Green

                if ($endpoint -like "*roles*") {
                    Write-Host "   📋 Found $($response.data.Count) roles" -ForegroundColor Cyan
                } elseif ($endpoint -like "*locations*") {
                    Write-Host "   🗺️  Found $($response.data.Count) locations" -ForegroundColor Cyan
                } elseif ($endpoint -like "*users*") {
                    Write-Host "   👥 Found $($response.data.users.Count) users (total: $($response.data.pagination.total))" -ForegroundColor Cyan
                }
            } catch {
                Write-Host "❌ FAILED - Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }

        Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green

    } else {
        Write-Host "❌ Login failed: No token in response" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
