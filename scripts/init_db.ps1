# PowerShell helper to create Postgres database and run SQL file
# Usage: .\init_db.ps1 -ConnectionString "postgres://user:password@localhost:5432/" -DbName egerton_transport
param(
  [Parameter(Mandatory=$true)] [string] $ConnectionString,
  [Parameter(Mandatory=$true)] [string] $DbName
)

Write-Host "This script requires `psql` in PATH. It will create database and run create_tables.sql."

# Parse connection string into components is left to the user; alternatively use full psql connection string
$full = $ConnectionString + $DbName

Write-Host "Creating database $DbName (if not exists) and running migrations..."

# Create DB then run SQL
# The user must have privileges to create database
try {
  & psql $ConnectionString -c "CREATE DATABASE \"$DbName\";" 2>$null
} catch {
  Write-Host "Could not create database via psql; it may already exist or psql is not available." -ForegroundColor Yellow
}

try {
  & psql $full -f "$PSScriptRoot/../create_tables.sql"
  Write-Host "Tables created (or already existed)."
} catch {
  Write-Host "Failed to run migrations. Ensure psql is installed and connection string is valid." -ForegroundColor Red
}
