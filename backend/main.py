"""
CASA Dashboard Backend API
FastAPI application for INAD analysis
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import tempfile
import os
import shutil

from inad_analysis import (
    AnalysisConfig,
    run_full_analysis,
    get_available_semesters,
    detect_systemic_cases
)
from geography import enrich_routes_with_coordinates, get_coverage_stats

app = FastAPI(
    title="CASA Dashboard API",
    description="Backend API for INAD Analysis Dashboard",
    version="2.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store uploaded files and analysis state
class AppState:
    def __init__(self):
        self.inad_path: Optional[str] = None
        self.bazl_path: Optional[str] = None
        self.temp_dir: Optional[str] = None
        self.analysis_cache: Dict[str, Any] = {}
        self.config = AnalysisConfig()

    def cleanup(self):
        if self.temp_dir and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None

state = AppState()


# Pydantic models for API
class ConfigUpdate(BaseModel):
    min_inad: Optional[int] = None
    min_pax: Optional[int] = None
    min_density: Optional[float] = None
    high_priority_multiplier: Optional[float] = None
    high_priority_min_inad: Optional[int] = None
    threshold_method: Optional[str] = None


class SemesterInfo(BaseModel):
    value: str
    label: str
    start: str
    end: str


class SummaryStats(BaseModel):
    total_inad: int
    high_priority: int
    watch_list: int
    unreliable: int
    clear: int
    threshold: float
    method: str


class RouteData(BaseModel):
    airline: str
    lastStop: str
    inad: int
    pax: int
    density: Optional[float]
    confidence: int
    priority: str
    originLat: Optional[float] = None
    originLng: Optional[float] = None
    originCity: Optional[str] = None
    originCountry: Optional[str] = None


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "CASA Dashboard API v2.0"}


@app.get("/api/status")
async def get_status():
    """Get current data loading status"""
    return {
        "inad_loaded": state.inad_path is not None,
        "bazl_loaded": state.bazl_path is not None,
        "ready": state.inad_path is not None and state.bazl_path is not None
    }


@app.post("/api/upload")
async def upload_files(
    inad_file: UploadFile = File(..., description="INAD-Tabelle Excel file"),
    bazl_file: UploadFile = File(..., description="BAZL-Daten Excel file")
):
    """Upload INAD and BAZL data files"""
    try:
        # Clean up previous temp files
        state.cleanup()

        # Create temp directory
        state.temp_dir = tempfile.mkdtemp()

        # Save INAD file
        inad_path = os.path.join(state.temp_dir, "inad_data.xlsx")
        with open(inad_path, "wb") as f:
            content = await inad_file.read()
            f.write(content)
        state.inad_path = inad_path

        # Save BAZL file
        bazl_path = os.path.join(state.temp_dir, "bazl_data.xlsx")
        with open(bazl_path, "wb") as f:
            content = await bazl_file.read()
            f.write(content)
        state.bazl_path = bazl_path

        # Clear cache
        state.analysis_cache = {}

        # Get available semesters
        semesters = get_available_semesters(state.inad_path)

        return {
            "success": True,
            "message": "Files uploaded successfully",
            "semesters": semesters
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/load-server-files")
async def load_server_files(
    inad_path: str = Query(..., description="Path to INAD-Tabelle file"),
    bazl_path: str = Query(..., description="Path to BAZL-Daten file")
):
    """Load data files from server paths"""
    try:
        # Validate paths exist
        if not os.path.exists(inad_path):
            raise HTTPException(status_code=404, detail=f"INAD file not found: {inad_path}")
        if not os.path.exists(bazl_path):
            raise HTTPException(status_code=404, detail=f"BAZL file not found: {bazl_path}")

        state.inad_path = inad_path
        state.bazl_path = bazl_path

        # Clear cache
        state.analysis_cache = {}

        # Get available semesters
        semesters = get_available_semesters(state.inad_path)

        return {
            "success": True,
            "message": "Server files loaded successfully",
            "semesters": semesters
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/semesters", response_model=List[SemesterInfo])
async def get_semesters():
    """Get list of available semesters from loaded data"""
    if not state.inad_path:
        raise HTTPException(status_code=400, detail="No INAD data loaded")

    semesters = get_available_semesters(state.inad_path)
    return semesters


@app.get("/api/analyze/{semester}")
async def analyze_semester(semester: str):
    """Run full analysis for a specific semester"""
    if not state.inad_path or not state.bazl_path:
        raise HTTPException(status_code=400, detail="Data files not loaded")

    # Check cache
    cache_key = f"{semester}_{state.config.threshold_method}_{state.config.min_inad}"
    if cache_key in state.analysis_cache:
        return state.analysis_cache[cache_key]

    try:
        # Parse semester
        year, half = semester.split('-')
        year = int(year)

        if half == 'H1':
            start_date = datetime(year, 1, 1)
            end_date = datetime(year, 6, 30)
        else:
            start_date = datetime(year, 7, 1)
            end_date = datetime(year, 12, 31)

        # Run analysis
        results = run_full_analysis(
            state.inad_path,
            state.bazl_path,
            start_date,
            end_date,
            state.config
        )

        # Enrich with coordinates
        step3_df = results['step3']
        step3_enriched = enrich_routes_with_coordinates(step3_df)

        # Convert to JSON-friendly format
        routes = []
        for _, row in step3_enriched.iterrows():
            routes.append({
                'airline': row['Airline'],
                'lastStop': row['LastStop'],
                'inad': int(row['INAD_Count']),
                'pax': int(row['PAX']),
                'density': round(row['Density'], 4) if row['Density'] else None,
                'confidence': int(row['Confidence']),
                'priority': row['Priority'],
                'originLat': row.get('OriginLat'),
                'originLng': row.get('OriginLng'),
                'originCity': row.get('OriginCity', ''),
                'originCountry': row.get('OriginCountry', '')
            })

        # Step 1 airlines
        airlines = []
        for _, row in results['step1'].iterrows():
            airlines.append({
                'airline': row['Airline'],
                'inadCount': int(row['INAD_Count'])
            })

        # Step 2 routes
        step2_routes = []
        for _, row in results['step2'].iterrows():
            step2_routes.append({
                'airline': row['Airline'],
                'lastStop': row['LastStop'],
                'inadCount': int(row['INAD_Count'])
            })

        response = {
            'semester': semester,
            'summary': results['summary'],
            'threshold': round(results['threshold'], 4),
            'routes': routes,
            'airlines': airlines,
            'step2Routes': step2_routes,
            'config': {
                'min_inad': state.config.min_inad,
                'min_pax': state.config.min_pax,
                'min_density': state.config.min_density,
                'threshold_method': state.config.threshold_method,
                'high_priority_multiplier': state.config.high_priority_multiplier
            }
        }

        # Cache result
        state.analysis_cache[cache_key] = response

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/historic")
async def get_historic_data(semesters: str = Query(..., description="Comma-separated semester list")):
    """Get historic data across multiple semesters"""
    if not state.inad_path or not state.bazl_path:
        raise HTTPException(status_code=400, detail="Data files not loaded")

    try:
        semester_list = semesters.split(',')
        results = []

        for semester in semester_list:
            analysis = await analyze_semester(semester.strip())
            results.append({
                'semester': semester.strip(),
                'summary': analysis['summary'],
                'threshold': analysis['threshold'],
                'highPriorityCount': analysis['summary']['high_priority'],
                'watchListCount': analysis['summary']['watch_list'],
                'totalInad': analysis['summary']['total_inad']
            })

        return {
            'semesters': results,
            'trend': calculate_trend(results)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_trend(semester_data: List[Dict]) -> Dict:
    """Calculate trend metrics across semesters"""
    if len(semester_data) < 2:
        return {'direction': 'stable', 'change': 0}

    first = semester_data[0]
    last = semester_data[-1]

    hp_change = last['highPriorityCount'] - first['highPriorityCount']
    wl_change = last['watchListCount'] - first['watchListCount']

    total_change = hp_change + wl_change

    if total_change > 0:
        direction = 'worsening'
    elif total_change < 0:
        direction = 'improving'
    else:
        direction = 'stable'

    return {
        'direction': direction,
        'highPriorityChange': hp_change,
        'watchListChange': wl_change,
        'totalChange': total_change
    }


@app.get("/api/systemic")
async def get_systemic_cases(semesters: str = Query(..., description="Comma-separated semester list")):
    """Detect systemic cases across semesters"""
    if not state.inad_path or not state.bazl_path:
        raise HTTPException(status_code=400, detail="Data files not loaded")

    try:
        semester_list = semesters.split(',')
        semester_results = []

        for semester in semester_list:
            analysis = await analyze_semester(semester.strip())

            # Convert routes back to DataFrame for systemic detection
            import pandas as pd
            routes_df = pd.DataFrame(analysis['routes'])
            routes_df = routes_df.rename(columns={
                'airline': 'Airline',
                'lastStop': 'LastStop',
                'inad': 'INAD_Count',
                'pax': 'PAX',
                'density': 'Density',
                'confidence': 'Confidence',
                'priority': 'Priority'
            })

            semester_results.append((semester.strip(), routes_df))

        # Detect systemic cases
        systemic_df = detect_systemic_cases(semester_results, state.config)

        # Convert to JSON
        cases = []
        for _, row in systemic_df.iterrows():
            cases.append({
                'airline': row['Airline'],
                'lastStop': row['LastStop'],
                'appearances': int(row['Appearances']),
                'consecutive': bool(row['Consecutive']),
                'trend': row['Trend'],
                'latestPriority': row['LatestPriority']
            })

        return {
            'cases': cases,
            'totalSystemic': len(cases),
            'worsening': len([c for c in cases if c['trend'] == 'WORSENING']),
            'consecutive': len([c for c in cases if c['consecutive']])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config")
async def get_config():
    """Get current analysis configuration"""
    return {
        'min_inad': state.config.min_inad,
        'min_pax': state.config.min_pax,
        'min_density': state.config.min_density,
        'high_priority_multiplier': state.config.high_priority_multiplier,
        'high_priority_min_inad': state.config.high_priority_min_inad,
        'threshold_method': state.config.threshold_method
    }


@app.post("/api/config")
async def update_config(config: ConfigUpdate):
    """Update analysis configuration"""
    if config.min_inad is not None:
        state.config.min_inad = config.min_inad
    if config.min_pax is not None:
        state.config.min_pax = config.min_pax
    if config.min_density is not None:
        state.config.min_density = config.min_density
    if config.high_priority_multiplier is not None:
        state.config.high_priority_multiplier = config.high_priority_multiplier
    if config.high_priority_min_inad is not None:
        state.config.high_priority_min_inad = config.high_priority_min_inad
    if config.threshold_method is not None:
        state.config.threshold_method = config.threshold_method

    # Clear cache when config changes
    state.analysis_cache = {}

    return {"success": True, "config": await get_config()}


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up temp files on shutdown"""
    state.cleanup()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
