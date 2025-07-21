# Simple PowerShell test for user management API
$loginUrl = "http://localhost:5000/api/v1/auth/login"
$loginBody = @{
    email = "flavio_luiz_ferreira@hotmail.com"
    password = "12345678"
} | ConvertTo-Json

Write-Host "Testing login..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json"

    if ($loginResponse.token) {
        Write-Host "Login successful!" -ForegroundColor Green
        $token = $loginResponse.token

        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }

        # Test /users/roles endpoint
        Write-Host "`nTesting /users/roles endpoint..." -ForegroundColor Yellow
        try {
            $rolesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/users/roles" -Method GET -Headers $headers
            Write-Host "SUCCESS - Roles endpoint working" -ForegroundColor Green
            Write-Host "Found $($rolesResponse.Count) roles" -ForegroundColor Cyan
        } catch {
            Write-Host "FAILED - Roles endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Test /users/locations endpoint
        Write-Host "`nTesting /users/locations endpoint..." -ForegroundColor Yellow
        try {
            $locationsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/users/locations" -Method GET -Headers $headers
            Write-Host "SUCCESS - Locations endpoint working" -ForegroundColor Green
            Write-Host "Found $($locationsResponse.Count) locations" -ForegroundColor Cyan
        } catch {
            Write-Host "FAILED - Locations endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        }

        # Test /users endpoint
        Write-Host "`nTesting /users endpoint..." -ForegroundColor Yellow
        try {
            $usersUrl = "http://localhost:5000/api/v1/users" + "?page=1" + "&limit=5"
            $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method GET -Headers $headers
            Write-Host "SUCCESS - Users endpoint working" -ForegroundColor Green
            Write-Host "Found $($usersResponse.data.users.Count) users" -ForegroundColor Cyan
        } catch {
            Write-Host "FAILED - Users endpoint error: $($_.Exception.Message)" -ForegroundColor Red
        }

        Write-Host "`nAPI Testing Complete!" -ForegroundColor Green

    } else {
        Write-Host "Login failed: No token in response" -ForegroundColor Red
    }
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}
