param(
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\data.js')
)

$ErrorActionPreference = 'Stop'
$apiBase = 'https://api.uexcorp.uk/2.0/'

function Get-UexData([string]$Endpoint) {
  $response = Invoke-RestMethod -Uri ($apiBase + $Endpoint) -TimeoutSec 60
  if ($null -eq $response.data) {
    throw "UEX endpoint '$Endpoint' returned no data."
  }
  return @($response.data)
}

function Get-NullableNumber($Value) {
  if ($null -eq $Value -or ([string]$Value).Length -eq 0) {
    return $null
  }
  return [double]$Value
}

$commodities = Get-UexData 'commodities'
$prices = Get-UexData 'commodities_prices_all'
$terminals = Get-UexData 'terminals'

$payload = [ordered]@{
  source = 'UEX Corp API 2.0'
  generatedAt = [DateTime]::UtcNow.ToString('o')
  commodities = @($commodities | ForEach-Object {
    [ordered]@{
      id = $_.id
      name = $_.name
      code = $_.code
      kind = $_.kind
      isIllegal = [bool][int]$_.is_illegal
      isFuel = [bool][int]$_.is_fuel
      isBuyable = [bool][int]$_.is_buyable
      isSellable = [bool][int]$_.is_sellable
    }
  })
  terminals = @($terminals | Where-Object { $_.type -eq 'commodity' } | ForEach-Object {
    [ordered]@{
      id = $_.id
      name = if ($_.displayname) { $_.displayname } else { $_.name }
      terminalName = $_.name
      fullName = $_.fullname
      nickname = $_.nickname
      type = $_.type
      system = $_.star_system_name
      planet = $_.planet_name
      city = $_.city_name
      station = $_.space_station_name
      outpost = $_.outpost_name
      hasLoadingDock = [bool][int]$_.has_loading_dock
      isAutoLoad = [bool][int]$_.is_auto_load
    }
  })
  prices = @($prices | Where-Object {
    [int]$_.id_commodity -gt 0 -and [int]$_.id_terminal -gt 0
  } | ForEach-Object {
    [ordered]@{
      commodityId = $_.id_commodity
      terminalId = $_.id_terminal
      priceBuy = [double]$_.price_buy
      priceSell = [double]$_.price_sell
      scuBuy = Get-NullableNumber $_.scu_buy
      scuSell = if ((Get-NullableNumber $_.scu_sell) -eq 0 -and (Get-NullableNumber $_.status_sell) -gt 0) {
        $null
      } else {
        Get-NullableNumber $_.scu_sell
      }
      stock = Get-NullableNumber $_.scu_sell_stock
      statusBuy = Get-NullableNumber $_.status_buy
      statusSell = Get-NullableNumber $_.status_sell
      containerSizes = if ($_.container_sizes) { $_.container_sizes } else { '' }
      modified = [long]$_.date_modified
    }
  })
}

$json = $payload | ConvertTo-Json -Depth 8 -Compress
$content = "window.TRADERSMATE_DATA = $json;`n"
$absoluteOutput = [IO.Path]::GetFullPath($OutputPath)
[IO.File]::WriteAllText($absoluteOutput, $content, [Text.UTF8Encoding]::new($false))

Write-Output "Updated $absoluteOutput"
Write-Output "$($payload.terminals.Count) terminals, $($payload.commodities.Count) commodities, $($payload.prices.Count) prices"
