"""
INAD Analysis Module - Core analysis logic for CASA Dashboard
Ported from v1 Streamlit application
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

# Exclusion codes for INAD cases (not counted as systemic)
EXCLUDE_CODES = {'B1n', 'B2n', 'C4n', 'C5n', 'C8', 'D1n', 'D2n', 'E', 'F1n', 'G', 'H', 'I'}

# Default configuration
DEFAULT_CONFIG = {
    'min_inad': 6,
    'min_pax': 5000,
    'min_density': 0.10,
    'high_priority_multiplier': 1.5,
    'high_priority_min_inad': 10,
    'threshold_method': 'median',
    'systemic_semesters': 2
}


@dataclass
class AnalysisConfig:
    """Configuration for INAD analysis"""
    min_inad: int = 6
    min_pax: int = 5000
    min_density: float = 0.10
    high_priority_multiplier: float = 1.5
    high_priority_min_inad: int = 10
    threshold_method: str = 'median'
    systemic_semesters: int = 2


def excel_serial_to_date(serial: float) -> Optional[datetime]:
    """Convert Excel serial date to datetime"""
    try:
        if pd.isna(serial):
            return None
        return datetime(1899, 12, 30) + pd.Timedelta(days=int(serial))
    except:
        return None


def load_inad_data(file_path: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
    """
    Load INAD data from Excel file and filter by date range.

    Args:
        file_path: Path to INAD-Tabelle Excel file
        start_date: Start of analysis period
        end_date: End of analysis period

    Returns:
        DataFrame with INAD cases filtered by date
    """
    try:
        # Try to read the INAD Tabelle
        df = pd.read_excel(file_path, sheet_name=0, engine='openpyxl')

        # Normalize column names
        df.columns = df.columns.str.strip()

        # Expected columns (may vary by file version)
        airline_col = None
        laststop_col = None
        year_col = None
        month_col = None
        code_col = None

        # Find matching columns
        for col in df.columns:
            col_lower = col.lower()
            if 'fluggesellschaft' in col_lower or 'airline' in col_lower or 'carrier' in col_lower:
                airline_col = col
            elif 'abflugort' in col_lower or 'last' in col_lower or 'stop' in col_lower:
                laststop_col = col
            elif 'jahr' in col_lower or 'year' in col_lower:
                year_col = col
            elif 'monat' in col_lower or 'month' in col_lower:
                month_col = col
            elif 'code' in col_lower or 'grund' in col_lower or 'reason' in col_lower:
                code_col = col

        if not all([airline_col, laststop_col, year_col, month_col]):
            raise ValueError(f"Missing required columns. Found: {df.columns.tolist()}")

        # Create date column from year and month
        df['Date'] = pd.to_datetime(
            df[year_col].astype(str) + '-' + df[month_col].astype(str).str.zfill(2) + '-01'
        )

        # Filter by date range
        df = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]

        # Determine if case is included (not in exclusion list)
        if code_col:
            df['Included'] = ~df[code_col].isin(EXCLUDE_CODES)
        else:
            df['Included'] = True

        # Rename columns for consistency
        df = df.rename(columns={
            airline_col: 'Airline',
            laststop_col: 'LastStop'
        })

        return df[['Airline', 'LastStop', 'Date', 'Included']].copy()

    except Exception as e:
        raise ValueError(f"Error loading INAD data: {str(e)}")


def load_bazl_data(file_path: str, start_date: datetime, end_date: datetime) -> Tuple[Dict, pd.DataFrame]:
    """
    Load BAZL passenger data from Excel file.

    Args:
        file_path: Path to BAZL-Daten Excel file
        start_date: Start of analysis period
        end_date: End of analysis period

    Returns:
        Tuple of (pax_lookup dict, monthly_pax DataFrame)
    """
    try:
        df = pd.read_excel(file_path, sheet_name=0, engine='openpyxl')

        # Normalize column names
        df.columns = df.columns.str.strip()

        # Find columns
        airline_col = None
        airport_col = None
        pax_col = None
        year_col = None
        month_col = None

        for col in df.columns:
            col_lower = col.lower()
            if 'airline' in col_lower or 'carrier' in col_lower or 'flug' in col_lower:
                airline_col = col
            elif 'airport' in col_lower or 'flug' in col_lower or 'last' in col_lower:
                airport_col = col
            elif 'pax' in col_lower or 'passenger' in col_lower or 'passagier' in col_lower:
                pax_col = col
            elif 'year' in col_lower or 'jahr' in col_lower:
                year_col = col
            elif 'month' in col_lower or 'monat' in col_lower:
                month_col = col

        if not all([airline_col, airport_col, pax_col]):
            # Try alternative column detection
            for col in df.columns:
                if df[col].dtype == 'object' and airline_col is None:
                    airline_col = col
                elif df[col].dtype == 'object' and airport_col is None:
                    airport_col = col
                elif pd.api.types.is_numeric_dtype(df[col]) and pax_col is None:
                    pax_col = col

        # Create date if year/month available
        if year_col and month_col:
            df['Date'] = pd.to_datetime(
                df[year_col].astype(str) + '-' + df[month_col].astype(str).str.zfill(2) + '-01'
            )
            df = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]

        # Rename and select columns
        df = df.rename(columns={
            airline_col: 'Airline',
            airport_col: 'Airport',
            pax_col: 'PAX'
        })

        # Create PAX lookup by (Airline, Airport)
        pax_agg = df.groupby(['Airline', 'Airport'])['PAX'].sum().to_dict()

        # Also create monthly PAX for quality checks
        monthly_pax = df.groupby(['Airline', 'Airport', 'Date'])['PAX'].sum().reset_index()

        return pax_agg, monthly_pax

    except Exception as e:
        raise ValueError(f"Error loading BAZL data: {str(e)}")


def calculate_step1(inad_df: pd.DataFrame, config: AnalysisConfig) -> pd.DataFrame:
    """
    Step 1: Identify airlines meeting minimum INAD threshold.

    Args:
        inad_df: DataFrame with INAD cases
        config: Analysis configuration

    Returns:
        DataFrame with airlines exceeding threshold
    """
    # Count included INAD cases per airline
    airline_counts = inad_df[inad_df['Included']].groupby('Airline').size().reset_index(name='INAD_Count')

    # Filter by minimum threshold
    step1_result = airline_counts[airline_counts['INAD_Count'] >= config.min_inad].copy()
    step1_result = step1_result.sort_values('INAD_Count', ascending=False)

    return step1_result


def calculate_step2(inad_df: pd.DataFrame, step1_df: pd.DataFrame, config: AnalysisConfig) -> pd.DataFrame:
    """
    Step 2: Identify routes meeting minimum INAD threshold.

    Args:
        inad_df: DataFrame with INAD cases
        step1_df: DataFrame with airlines from step 1
        config: Analysis configuration

    Returns:
        DataFrame with routes exceeding threshold
    """
    # Filter to only airlines from step 1
    valid_airlines = set(step1_df['Airline'])
    filtered_df = inad_df[inad_df['Airline'].isin(valid_airlines) & inad_df['Included']]

    # Count INAD cases per route (Airline, LastStop)
    route_counts = filtered_df.groupby(['Airline', 'LastStop']).size().reset_index(name='INAD_Count')

    # Filter by minimum threshold
    step2_result = route_counts[route_counts['INAD_Count'] >= config.min_inad].copy()
    step2_result = step2_result.sort_values('INAD_Count', ascending=False)

    return step2_result


def calculate_step3(
    step2_df: pd.DataFrame,
    pax_lookup: Dict,
    config: AnalysisConfig,
    partner_mapping: Optional[Dict] = None
) -> pd.DataFrame:
    """
    Step 3: Calculate density and classify priority for each route.

    Args:
        step2_df: DataFrame with routes from step 2
        pax_lookup: Dictionary of (Airline, Airport) -> PAX
        config: Analysis configuration
        partner_mapping: Optional mapping of partner airlines

    Returns:
        DataFrame with density, confidence, and priority classification
    """
    results = []

    for _, row in step2_df.iterrows():
        airline = row['Airline']
        laststop = row['LastStop']
        inad_count = row['INAD_Count']

        # Get PAX (including partner airlines if applicable)
        pax = pax_lookup.get((airline, laststop), 0)

        if partner_mapping and airline in partner_mapping:
            for partner in partner_mapping[airline]:
                pax += pax_lookup.get((partner, laststop), 0)

        # Calculate density (per mille)
        density = (inad_count / pax * 1000) if pax > 0 else None

        # Determine reliability
        is_reliable = pax >= config.min_pax

        # Calculate confidence score
        if pax < config.min_pax:
            confidence = 0
        else:
            inad_score = min(100, (inad_count / 20) * 100)
            pax_score = min(100, (pax / 100000) * 100)
            confidence = int(0.6 * inad_score + 0.4 * pax_score)

        results.append({
            'Airline': airline,
            'LastStop': laststop,
            'INAD_Count': inad_count,
            'PAX': pax,
            'Density': density,
            'Confidence': confidence,
            'IsReliable': is_reliable
        })

    return pd.DataFrame(results)


def calculate_threshold(step3_df: pd.DataFrame, config: AnalysisConfig) -> float:
    """
    Calculate the density threshold using specified method.

    Args:
        step3_df: DataFrame with step 3 results
        config: Analysis configuration

    Returns:
        Calculated threshold value
    """
    # Only use reliable data for threshold calculation
    reliable_densities = step3_df[step3_df['IsReliable'] & step3_df['Density'].notna()]['Density']

    if len(reliable_densities) == 0:
        return config.min_density

    if config.threshold_method == 'median':
        return reliable_densities.median()
    elif config.threshold_method == 'trimmed_mean':
        # Remove top/bottom 10%
        q_low = reliable_densities.quantile(0.1)
        q_high = reliable_densities.quantile(0.9)
        trimmed = reliable_densities[(reliable_densities >= q_low) & (reliable_densities <= q_high)]
        return trimmed.mean() if len(trimmed) > 0 else reliable_densities.median()
    else:  # mean
        return reliable_densities.mean()


def classify_priority(
    step3_df: pd.DataFrame,
    threshold: float,
    config: AnalysisConfig
) -> pd.DataFrame:
    """
    Classify each route into priority categories.

    Args:
        step3_df: DataFrame with step 3 results
        threshold: Calculated density threshold
        config: Analysis configuration

    Returns:
        DataFrame with Priority column added
    """
    df = step3_df.copy()

    def get_priority(row):
        if not row['IsReliable']:
            return 'UNRELIABLE'
        if row['Density'] is None or row['PAX'] == 0:
            return 'NO_DATA'

        # HIGH_PRIORITY criteria
        if (row['Density'] >= threshold and
            row['Density'] >= config.min_density and
            row['Density'] >= threshold * config.high_priority_multiplier and
            row['INAD_Count'] >= config.high_priority_min_inad):
            return 'HIGH_PRIORITY'

        # WATCH_LIST criteria
        if row['Density'] >= threshold:
            return 'WATCH_LIST'

        return 'CLEAR'

    df['Priority'] = df.apply(get_priority, axis=1)
    return df


def detect_systemic_cases(
    semester_results: List[Tuple[str, pd.DataFrame]],
    config: AnalysisConfig
) -> pd.DataFrame:
    """
    Detect systemic cases across multiple semesters.

    Args:
        semester_results: List of (semester_label, step3_df) tuples
        config: Analysis configuration

    Returns:
        DataFrame with systemic case analysis
    """
    # Track route appearances
    route_history = {}

    for semester_label, df in semester_results:
        flagged = df[df['Priority'].isin(['HIGH_PRIORITY', 'WATCH_LIST'])]

        for _, row in flagged.iterrows():
            key = (row['Airline'], row['LastStop'])
            if key not in route_history:
                route_history[key] = []
            route_history[key].append({
                'Semester': semester_label,
                'Priority': row['Priority'],
                'Density': row['Density']
            })

    # Build systemic cases
    systemic_cases = []

    for (airline, laststop), history in route_history.items():
        appearances = len(history)

        # Check for consecutive appearances
        consecutive = appearances >= config.systemic_semesters

        # Calculate trend
        if len(history) >= 2:
            first_density = history[0]['Density']
            last_density = history[-1]['Density']
            if first_density and last_density:
                change = (last_density - first_density) / first_density * 100
                if change > 10:
                    trend = 'WORSENING'
                elif change < -10:
                    trend = 'IMPROVING'
                else:
                    trend = 'STABLE'
            else:
                trend = 'STABLE'
        else:
            trend = 'STABLE'

        if appearances >= config.systemic_semesters:
            systemic_cases.append({
                'Airline': airline,
                'LastStop': laststop,
                'Appearances': appearances,
                'Consecutive': consecutive,
                'Trend': trend,
                'LatestPriority': history[-1]['Priority'],
                'History': history
            })

    return pd.DataFrame(systemic_cases)


def run_full_analysis(
    inad_path: str,
    bazl_path: str,
    start_date: datetime,
    end_date: datetime,
    config: Optional[AnalysisConfig] = None
) -> Dict[str, Any]:
    """
    Run the complete INAD analysis pipeline.

    Args:
        inad_path: Path to INAD-Tabelle file
        bazl_path: Path to BAZL-Daten file
        start_date: Analysis period start
        end_date: Analysis period end
        config: Analysis configuration (uses defaults if None)

    Returns:
        Dictionary containing all analysis results
    """
    if config is None:
        config = AnalysisConfig()

    # Load data
    inad_df = load_inad_data(inad_path, start_date, end_date)
    pax_lookup, monthly_pax = load_bazl_data(bazl_path, start_date, end_date)

    # Run analysis steps
    step1_df = calculate_step1(inad_df, config)
    step2_df = calculate_step2(inad_df, step1_df, config)
    step3_df = calculate_step3(step2_df, pax_lookup, config)

    # Calculate threshold and classify
    threshold = calculate_threshold(step3_df, config)
    classified_df = classify_priority(step3_df, threshold, config)

    # Calculate summary statistics
    summary = {
        'total_inad': int(inad_df['Included'].sum()),
        'high_priority': int((classified_df['Priority'] == 'HIGH_PRIORITY').sum()),
        'watch_list': int((classified_df['Priority'] == 'WATCH_LIST').sum()),
        'unreliable': int((classified_df['Priority'] == 'UNRELIABLE').sum()),
        'clear': int((classified_df['Priority'] == 'CLEAR').sum()),
        'threshold': round(threshold, 4),
        'method': config.threshold_method
    }

    return {
        'step1': step1_df,
        'step2': step2_df,
        'step3': classified_df,
        'summary': summary,
        'threshold': threshold,
        'config': config
    }


def get_available_semesters(inad_path: str) -> List[Dict]:
    """
    Determine available semesters from INAD data.

    Args:
        inad_path: Path to INAD-Tabelle file

    Returns:
        List of semester dictionaries
    """
    try:
        df = pd.read_excel(inad_path, sheet_name=0, engine='openpyxl')

        # Find year and month columns
        year_col = None
        month_col = None

        for col in df.columns:
            col_lower = str(col).lower()
            if 'jahr' in col_lower or 'year' in col_lower:
                year_col = col
            elif 'monat' in col_lower or 'month' in col_lower:
                month_col = col

        if not year_col or not month_col:
            return []

        # Get unique year-month combinations
        df['Date'] = pd.to_datetime(
            df[year_col].astype(str) + '-' + df[month_col].astype(str).str.zfill(2) + '-01'
        )

        min_date = df['Date'].min()
        max_date = df['Date'].max()

        semesters = []
        current_year = min_date.year

        while current_year <= max_date.year:
            # H1: Jan-Jun
            h1_start = datetime(current_year, 1, 1)
            h1_end = datetime(current_year, 6, 30)
            if h1_start >= min_date and h1_end <= max_date:
                semesters.append({
                    'value': f'{current_year}-H1',
                    'label': f'{current_year} H1 (Jan-Jun)',
                    'start': h1_start.isoformat(),
                    'end': h1_end.isoformat()
                })

            # H2: Jul-Dec
            h2_start = datetime(current_year, 7, 1)
            h2_end = datetime(current_year, 12, 31)
            if h2_start >= min_date and h2_end <= max_date:
                semesters.append({
                    'value': f'{current_year}-H2',
                    'label': f'{current_year} H2 (Jul-Dec)',
                    'start': h2_start.isoformat(),
                    'end': h2_end.isoformat()
                })

            current_year += 1

        return semesters

    except Exception as e:
        return []
