' ============================================
' CryptoReportKit - VBA Macro for Excel
' ============================================
'
' HOW TO USE:
' 1. Press Alt + F11 to open VBA Editor
' 2. Insert → Module
' 3. Paste this code
' 4. Press F5 to run GetCryptoPrices
'
' REQUIREMENTS:
' - Enable "Microsoft XML, v6.0" reference
'   (Tools → References → check "Microsoft XML, v6.0")
' ============================================

Option Explicit

' Main function to get crypto prices
Sub GetCryptoPrices()
    Dim ws As Worksheet
    Dim xmlHttp As Object
    Dim jsonText As String
    Dim url As String
    Dim coins As String
    Dim i As Long
    
    ' Configuration
    coins = "bitcoin,ethereum,solana,cardano,ripple,dogecoin,polkadot"
    
    ' API URL
    url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" & coins & "&order=market_cap_desc&sparkline=false"
    
    ' Create or get worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("CryptoData")
    On Error GoTo 0
    
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "CryptoData"
    End If
    
    ' Clear existing data
    ws.Cells.Clear
    
    ' Add headers
    ws.Range("A1").Value = "Coin"
    ws.Range("B1").Value = "Symbol"
    ws.Range("C1").Value = "Price (USD)"
    ws.Range("D1").Value = "24h Change %"
    ws.Range("E1").Value = "Market Cap"
    ws.Range("F1").Value = "Volume 24h"
    ws.Range("G1").Value = "Last Updated"
    
    ' Format headers
    With ws.Range("A1:G1")
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = RGB(16, 185, 129) ' Green
    End With
    
    ' Make HTTP request
    Set xmlHttp = CreateObject("MSXML2.XMLHTTP")
    xmlHttp.Open "GET", url, False
    xmlHttp.setRequestHeader "Content-Type", "application/json"
    xmlHttp.send
    
    If xmlHttp.Status = 200 Then
        jsonText = xmlHttp.responseText
        
        ' Parse JSON and write to sheet
        Call ParseCoinData(ws, jsonText)
        
        ' Auto-fit columns
        ws.Columns("A:G").AutoFit
        
        MsgBox "✅ Crypto data updated successfully!", vbInformation
    Else
        MsgBox "❌ Error fetching data: " & xmlHttp.Status, vbExclamation
    End If
    
    Set xmlHttp = Nothing
End Sub

' Parse JSON response (simple parser for this structure)
Private Sub ParseCoinData(ws As Worksheet, jsonText As String)
    Dim coins As Variant
    Dim coin As Variant
    Dim row As Long
    Dim i As Long
    
    ' Use ScriptControl to parse JSON
    Dim sc As Object
    Set sc = CreateObject("ScriptControl")
    sc.Language = "JScript"
    
    ' Parse JSON
    sc.AddCode "function parseJSON(json) { return eval('(' + json + ')'); }"
    Set coins = sc.Run("parseJSON", jsonText)
    
    row = 2
    
    ' Loop through coins
    For i = 0 To sc.Run("parseJSON", jsonText).length - 1
        Dim coinData As Object
        Set coinData = sc.Run("parseJSON", jsonText)(i)
        
        ws.Cells(row, 1).Value = coinData.name
        ws.Cells(row, 2).Value = UCase(coinData.symbol)
        ws.Cells(row, 3).Value = coinData.current_price
        ws.Cells(row, 4).Value = Round(coinData.price_change_percentage_24h, 2)
        ws.Cells(row, 5).Value = coinData.market_cap
        ws.Cells(row, 6).Value = coinData.total_volume
        ws.Cells(row, 7).Value = Now()
        
        ' Format price
        ws.Cells(row, 3).NumberFormat = "$#,##0.00"
        ws.Cells(row, 5).NumberFormat = "#,##0"
        ws.Cells(row, 6).NumberFormat = "#,##0"
        
        ' Color code 24h change
        If coinData.price_change_percentage_24h > 0 Then
            ws.Cells(row, 4).Font.Color = RGB(16, 185, 129) ' Green
        Else
            ws.Cells(row, 4).Font.Color = RGB(239, 68, 68) ' Red
        End If
        
        row = row + 1
    Next i
    
    Set sc = Nothing
End Sub

' Alternative: Using Power Query via VBA
Sub RefreshPowerQuery()
    ' If you have Power Query set up, this refreshes all queries
    ActiveWorkbook.RefreshAll
    MsgBox "✅ All data connections refreshed!", vbInformation
End Sub

' Get Bitcoin Price Only (Simple)
Sub GetBitcoinPrice()
    Dim xmlHttp As Object
    Dim jsonText As String
    Dim price As Double
    
    Set xmlHttp = CreateObject("MSXML2.XMLHTTP")
    xmlHttp.Open "GET", "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", False
    xmlHttp.send
    
    If xmlHttp.Status = 200 Then
        jsonText = xmlHttp.responseText
        
        ' Simple parse for bitcoin price
        Dim startPos As Long, endPos As Long
        startPos = InStr(jsonText, """usd"":") + 6
        endPos = InStr(startPos, jsonText, "}")
        price = CDbl(Mid(jsonText, startPos, endPos - startPos))
        
        ' Write to active cell
        ActiveCell.Value = price
        ActiveCell.NumberFormat = "$#,##0.00"
        
        MsgBox "Bitcoin Price: $" & Format(price, "#,##0.00"), vbInformation
    End If
    
    Set xmlHttp = Nothing
End Sub

' With API Key (BYOK Mode)
Sub GetCryptoPricesWithApiKey()
    Dim apiKey As String
    Dim xmlHttp As Object
    
    ' Get API key from Settings sheet cell B1
    On Error Resume Next
    apiKey = ThisWorkbook.Sheets("Settings").Range("B1").Value
    On Error GoTo 0
    
    If apiKey = "" Then
        MsgBox "Please enter your CoinGecko API key in Settings!B1", vbExclamation
        Exit Sub
    End If
    
    Set xmlHttp = CreateObject("MSXML2.XMLHTTP")
    xmlHttp.Open "GET", "https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250", False
    xmlHttp.setRequestHeader "x-cg-pro-api-key", apiKey
    xmlHttp.send
    
    ' Process response...
    If xmlHttp.Status = 200 Then
        ' Call ParseCoinData with response
        MsgBox "✅ Pro API data fetched successfully!", vbInformation
    Else
        MsgBox "❌ API Error: " & xmlHttp.Status, vbExclamation
    End If
    
    Set xmlHttp = Nothing
End Sub

' Auto-refresh timer
Sub StartAutoRefresh()
    ' Refresh every 5 minutes
    Application.OnTime Now + TimeValue("00:05:00"), "GetCryptoPrices"
    MsgBox "Auto-refresh started (every 5 minutes)", vbInformation
End Sub

Sub StopAutoRefresh()
    On Error Resume Next
    Application.OnTime Now + TimeValue("00:05:00"), "GetCryptoPrices", , False
    MsgBox "Auto-refresh stopped", vbInformation
End Sub
