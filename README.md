# CASA Dashboard v2

A modern React + FastAPI dashboard for INAD (Inadmissible Passengers) analysis with a clean, professional design.

## Features

### Analysis Capabilities
- **Three-Step INAD Analysis**: Airlines → Routes → Priority Routes
- **Priority Classification**: HIGH_PRIORITY, WATCH_LIST, UNRELIABLE, CLEAR
- **Systemic Case Detection**: Track recurring issues across consecutive semesters
- **Historic Trend Analysis**: Semester-by-semester comparisons with trend indicators
- **INAD Density Calculation**: (INAD / PAX) x 1000 (per mille)

### Design
- **Neutral Gray/Teal Theme**: Professional, accessible color palette
- **Clean UI**: White cards, subtle shadows, modern typography
- **Material Design Inspired**: Consistent spacing and component styling

### Functionality
- **3D Globe Visualization**: Interactive route map with react-globe.gl
- **Data Source Toggle**: Upload files or load from server paths
- **Dynamic Semesters**: Auto-populated from loaded data
- **Multi-language Support**: English, German, and French
- **Export Capabilities**: CSV export for routes data
- **Configurable Parameters**: min_inad, min_pax, threshold_method, multiplier

### Navigation
- Globe View
- Overview
- Airlines
- Priority Analysis
- Historic Trends
- Systemic Cases
- Legal Summary
- Configuration
- Help & Docs

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### Frontend Setup

```bash
# From project root
cd casa-react-v2

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3000

### Production Build

```bash
npm run build
```

This creates an optimized `build/` folder ready for deployment.

## Project Structure

```
casa-react-v2/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── inad_analysis.py     # Core analysis logic
│   ├── geography.py         # Airport coordinate lookup
│   └── requirements.txt     # Python dependencies
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx      # Navigation + semester + language
│   │   ├── StatCard.jsx     # Metric cards
│   │   ├── GlobeView.jsx    # 3D globe with controls
│   │   ├── RoutesTable.jsx  # Sortable data table
│   │   ├── ChartContainer.jsx   # Wrapper with fullscreen/download
│   │   └── HistoricTrends.jsx   # Historic trend visualization
│   ├── pages/
│   │   ├── Dashboard.jsx    # Main page with all tabs
│   │   ├── Configuration.jsx    # Settings and data source
│   │   └── HelpDocs.jsx     # Documentation
│   ├── context/
│   │   └── DataContext.jsx  # Global state management
│   ├── services/
│   │   └── api.js           # Backend API client
│   ├── data/
│   │   ├── sampleData.js    # Fallback demo data
│   │   └── translations.js  # EN/DE/FR translations
│   ├── styles/
│   │   └── globals.css      # Design system
│   ├── App.jsx              # Root component
│   └── index.js             # Entry point
├── package.json
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload INAD and BAZL Excel files |
| `/api/load-server-files` | POST | Load files from server paths |
| `/api/semesters` | GET | Get available semesters from data |
| `/api/analyze/{semester}` | GET | Run full analysis for semester |
| `/api/historic` | GET | Get multi-semester trend data |
| `/api/systemic` | GET | Detect systemic cases |
| `/api/config` | GET/POST | Get or update analysis configuration |

## Data Files

The dashboard expects two Excel files:

### INAD-Tabelle
Contains individual INAD cases with:
- Airline code (Fluggesellschaft)
- Last stop / Origin airport (Abflugort)
- Year and month of incident
- Refusal code

### BAZL-Daten
Contains passenger volume data with:
- Airline code
- Airport code
- Passenger count (PAX)
- Time period

## Configuration Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| min_inad | 6 | Minimum INAD cases for route analysis |
| min_pax | 5000 | Minimum passengers for reliable density |
| min_density | 0.10 | Absolute minimum density threshold (per mille) |
| high_priority_multiplier | 1.5 | Threshold multiplier for HIGH_PRIORITY |
| threshold_method | median | Statistical method (median/trimmed_mean/mean) |

## Design System

### Colors
```css
--color-primary: #0D9488;      /* Teal 600 */
--color-primary-light: #14B8A6; /* Teal 500 */
--color-danger: #DC2626;       /* Red - High Priority */
--color-warning: #D97706;      /* Amber - Watch List */
--color-success: #16A34A;      /* Green - Clear */
--color-muted: #64748B;        /* Slate - Unreliable */
--bg-primary: #F8FAFC;         /* Slate 50 background */
--bg-secondary: #FFFFFF;       /* White cards */
--text-primary: #0F172A;       /* Slate 900 text */
```

## Deployment

### Docker (Recommended)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

Create `.env` file for frontend:
```
REACT_APP_API_URL=http://localhost:8000
```

## Multi-Language Support

The dashboard supports:
- **English** (EN) - Default
- **German** (DE) - Deutsch
- **French** (FR) - Francais

Switch languages using the selector at the bottom of the sidebar.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support for 3D globe rendering.

## Troubleshooting

### Backend Connection Failed
- Ensure backend is running on port 8000
- Check CORS settings in main.py
- Verify API_URL environment variable

### Globe Not Rendering
- Check WebGL support: https://get.webgl.org/
- Try a different browser
- Ensure stable internet for texture loading

### Analysis Returns Empty
- Verify Excel files have correct column names
- Check date range matches available data
- Review backend logs for parsing errors

## License

MIT License - Free for commercial and personal use.

---

Built with React, FastAPI, react-globe.gl, and Lucide icons.
