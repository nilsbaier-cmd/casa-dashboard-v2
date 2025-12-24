 # Data Files

  Upload your INAD and BAZL Excel files here via GitHub.com:

  1. Go to this folder on GitHub.com
  2. Click "Add file" > "Upload files"
  3. Drag and drop your Excel files:
     - `INAD-Tabelle.xlsx` (or `.xlsm`)
     - `BAZL-Daten.xlsx`
  4. Click "Commit changes"

  The analysis will run automatically within a few minutes, and the dashboard will update with the new data.

  ## File Requirements

  ### INAD-Tabelle
  Must contain columns:
  - `Fluggesellschaft` - Airline code
  - `Abflugort` - Last stop / Origin airport code
  - `Jahr` - Year
  - `Monat` - Month (1-12)
  - `Verweigerungsgründe` - Refusal code (optional, for filtering)

  ### BAZL-Daten
  Must contain columns:
  - `Fluggesellschaft` - Airline code
  - `Abflugort` - Airport code
  - `PAX` - Passenger count
  - `Jahr` - Year
  - `Monat` - Month (1-12)
