"""
Geography Module - Airport coordinate lookup for CASA Dashboard
"""

import pandas as pd
from typing import Dict, Optional, Tuple
import math

# Switzerland coordinates (destination for all routes)
SWITZERLAND = {'lat': 46.8182, 'lng': 8.2275, 'name': 'Switzerland'}

# Fallback airport database with major international airports
AIRPORT_DATABASE = {
    # Middle East
    'IST': {'name': 'Istanbul Airport', 'city': 'Istanbul', 'country': 'TR', 'lat': 41.2753, 'lng': 28.7519},
    'SAW': {'name': 'Sabiha Gokcen', 'city': 'Istanbul', 'country': 'TR', 'lat': 40.8986, 'lng': 29.3092},
    'AYT': {'name': 'Antalya Airport', 'city': 'Antalya', 'country': 'TR', 'lat': 36.8987, 'lng': 30.8005},
    'DXB': {'name': 'Dubai International', 'city': 'Dubai', 'country': 'AE', 'lat': 25.2532, 'lng': 55.3657},
    'DOH': {'name': 'Hamad International', 'city': 'Doha', 'country': 'QA', 'lat': 25.2731, 'lng': 51.6081},
    'AUH': {'name': 'Abu Dhabi International', 'city': 'Abu Dhabi', 'country': 'AE', 'lat': 24.4330, 'lng': 54.6511},
    'RUH': {'name': 'King Khalid International', 'city': 'Riyadh', 'country': 'SA', 'lat': 24.9576, 'lng': 46.6988},
    'JED': {'name': 'King Abdulaziz International', 'city': 'Jeddah', 'country': 'SA', 'lat': 21.6796, 'lng': 39.1565},
    'TLV': {'name': 'Ben Gurion Airport', 'city': 'Tel Aviv', 'country': 'IL', 'lat': 32.0114, 'lng': 34.8867},
    'AMM': {'name': 'Queen Alia International', 'city': 'Amman', 'country': 'JO', 'lat': 31.7226, 'lng': 35.9932},
    'KWI': {'name': 'Kuwait International', 'city': 'Kuwait City', 'country': 'KW', 'lat': 29.2266, 'lng': 47.9689},
    'BAH': {'name': 'Bahrain International', 'city': 'Manama', 'country': 'BH', 'lat': 26.2708, 'lng': 50.6336},
    'MCT': {'name': 'Muscat International', 'city': 'Muscat', 'country': 'OM', 'lat': 23.5933, 'lng': 58.2844},

    # Africa
    'ADD': {'name': 'Bole International', 'city': 'Addis Ababa', 'country': 'ET', 'lat': 8.9779, 'lng': 38.7993},
    'CAI': {'name': 'Cairo International', 'city': 'Cairo', 'country': 'EG', 'lat': 30.1219, 'lng': 31.4056},
    'CMN': {'name': 'Mohammed V International', 'city': 'Casablanca', 'country': 'MA', 'lat': 33.3675, 'lng': -7.5898},
    'JNB': {'name': 'O.R. Tambo International', 'city': 'Johannesburg', 'country': 'ZA', 'lat': -26.1392, 'lng': 28.2460},
    'NBO': {'name': 'Jomo Kenyatta International', 'city': 'Nairobi', 'country': 'KE', 'lat': -1.3192, 'lng': 36.9278},
    'LOS': {'name': 'Murtala Muhammed International', 'city': 'Lagos', 'country': 'NG', 'lat': 6.5774, 'lng': 3.3212},
    'ALG': {'name': 'Houari Boumediene Airport', 'city': 'Algiers', 'country': 'DZ', 'lat': 36.6911, 'lng': 3.2155},
    'TUN': {'name': 'Tunis-Carthage International', 'city': 'Tunis', 'country': 'TN', 'lat': 36.8510, 'lng': 10.2272},

    # Balkans & Eastern Europe
    'PRN': {'name': 'Pristina International', 'city': 'Pristina', 'country': 'XK', 'lat': 42.5728, 'lng': 21.0358},
    'BEG': {'name': 'Belgrade Nikola Tesla', 'city': 'Belgrade', 'country': 'RS', 'lat': 44.8184, 'lng': 20.3091},
    'ZAG': {'name': 'Franjo Tudjman Airport', 'city': 'Zagreb', 'country': 'HR', 'lat': 45.7429, 'lng': 16.0688},
    'OTP': {'name': 'Henri Coanda International', 'city': 'Bucharest', 'country': 'RO', 'lat': 44.5711, 'lng': 26.0850},
    'SOF': {'name': 'Sofia Airport', 'city': 'Sofia', 'country': 'BG', 'lat': 42.6952, 'lng': 23.4064},
    'SKP': {'name': 'Skopje International', 'city': 'Skopje', 'country': 'MK', 'lat': 41.9616, 'lng': 21.6214},
    'TIA': {'name': 'Tirana International', 'city': 'Tirana', 'country': 'AL', 'lat': 41.4147, 'lng': 19.7206},
    'SJJ': {'name': 'Sarajevo International', 'city': 'Sarajevo', 'country': 'BA', 'lat': 43.8246, 'lng': 18.3315},
    'LJU': {'name': 'Ljubljana Airport', 'city': 'Ljubljana', 'country': 'SI', 'lat': 46.2237, 'lng': 14.4576},
    'TGD': {'name': 'Podgorica Airport', 'city': 'Podgorica', 'country': 'ME', 'lat': 42.3594, 'lng': 19.2519},

    # Former Soviet States
    'KBP': {'name': 'Boryspil International', 'city': 'Kyiv', 'country': 'UA', 'lat': 50.3450, 'lng': 30.8947},
    'ALA': {'name': 'Almaty International', 'city': 'Almaty', 'country': 'KZ', 'lat': 43.3521, 'lng': 77.0405},
    'TBS': {'name': 'Tbilisi International', 'city': 'Tbilisi', 'country': 'GE', 'lat': 41.6692, 'lng': 44.9547},
    'EVN': {'name': 'Zvartnots International', 'city': 'Yerevan', 'country': 'AM', 'lat': 40.1473, 'lng': 44.3959},
    'GYD': {'name': 'Heydar Aliyev International', 'city': 'Baku', 'country': 'AZ', 'lat': 40.4675, 'lng': 50.0467},
    'TAS': {'name': 'Tashkent International', 'city': 'Tashkent', 'country': 'UZ', 'lat': 41.2578, 'lng': 69.2812},

    # Asia
    'DEL': {'name': 'Indira Gandhi International', 'city': 'Delhi', 'country': 'IN', 'lat': 28.5562, 'lng': 77.1000},
    'BOM': {'name': 'Chhatrapati Shivaji International', 'city': 'Mumbai', 'country': 'IN', 'lat': 19.0896, 'lng': 72.8656},
    'ICN': {'name': 'Incheon International', 'city': 'Seoul', 'country': 'KR', 'lat': 37.4691, 'lng': 126.4505},
    'SIN': {'name': 'Changi Airport', 'city': 'Singapore', 'country': 'SG', 'lat': 1.3644, 'lng': 103.9915},
    'HKG': {'name': 'Hong Kong International', 'city': 'Hong Kong', 'country': 'HK', 'lat': 22.3080, 'lng': 113.9185},
    'NRT': {'name': 'Narita International', 'city': 'Tokyo', 'country': 'JP', 'lat': 35.7720, 'lng': 140.3929},
    'PEK': {'name': 'Beijing Capital International', 'city': 'Beijing', 'country': 'CN', 'lat': 40.0799, 'lng': 116.6031},
    'PVG': {'name': 'Shanghai Pudong International', 'city': 'Shanghai', 'country': 'CN', 'lat': 31.1434, 'lng': 121.8052},
    'BKK': {'name': 'Suvarnabhumi Airport', 'city': 'Bangkok', 'country': 'TH', 'lat': 13.6900, 'lng': 100.7501},
    'KUL': {'name': 'Kuala Lumpur International', 'city': 'Kuala Lumpur', 'country': 'MY', 'lat': 2.7456, 'lng': 101.7099},

    # Europe
    'LHR': {'name': 'Heathrow Airport', 'city': 'London', 'country': 'GB', 'lat': 51.4700, 'lng': -0.4543},
    'CDG': {'name': 'Charles de Gaulle Airport', 'city': 'Paris', 'country': 'FR', 'lat': 49.0097, 'lng': 2.5479},
    'FRA': {'name': 'Frankfurt Airport', 'city': 'Frankfurt', 'country': 'DE', 'lat': 50.0379, 'lng': 8.5622},
    'AMS': {'name': 'Schiphol Airport', 'city': 'Amsterdam', 'country': 'NL', 'lat': 52.3105, 'lng': 4.7683},
    'MAD': {'name': 'Adolfo Suarez Madrid-Barajas', 'city': 'Madrid', 'country': 'ES', 'lat': 40.4983, 'lng': -3.5676},
    'BCN': {'name': 'Barcelona-El Prat', 'city': 'Barcelona', 'country': 'ES', 'lat': 41.2974, 'lng': 2.0833},
    'FCO': {'name': 'Fiumicino Airport', 'city': 'Rome', 'country': 'IT', 'lat': 41.8003, 'lng': 12.2389},
    'MXP': {'name': 'Malpensa Airport', 'city': 'Milan', 'country': 'IT', 'lat': 45.6306, 'lng': 8.7281},
    'MUC': {'name': 'Munich Airport', 'city': 'Munich', 'country': 'DE', 'lat': 48.3537, 'lng': 11.7750},
    'VIE': {'name': 'Vienna International', 'city': 'Vienna', 'country': 'AT', 'lat': 48.1103, 'lng': 16.5697},
    'WAW': {'name': 'Warsaw Chopin Airport', 'city': 'Warsaw', 'country': 'PL', 'lat': 52.1657, 'lng': 20.9671},
    'PRG': {'name': 'Vaclav Havel Airport', 'city': 'Prague', 'country': 'CZ', 'lat': 50.1008, 'lng': 14.2600},
    'BUD': {'name': 'Budapest Airport', 'city': 'Budapest', 'country': 'HU', 'lat': 47.4298, 'lng': 19.2611},
    'ATH': {'name': 'Athens International', 'city': 'Athens', 'country': 'GR', 'lat': 37.9364, 'lng': 23.9445},
    'LIS': {'name': 'Lisbon Portela', 'city': 'Lisbon', 'country': 'PT', 'lat': 38.7813, 'lng': -9.1359},
    'BRU': {'name': 'Brussels Airport', 'city': 'Brussels', 'country': 'BE', 'lat': 50.9014, 'lng': 4.4844},
    'CPH': {'name': 'Copenhagen Airport', 'city': 'Copenhagen', 'country': 'DK', 'lat': 55.6180, 'lng': 12.6560},
    'ARN': {'name': 'Stockholm Arlanda', 'city': 'Stockholm', 'country': 'SE', 'lat': 59.6519, 'lng': 17.9186},
    'OSL': {'name': 'Oslo Gardermoen', 'city': 'Oslo', 'country': 'NO', 'lat': 60.1939, 'lng': 11.1004},
    'HEL': {'name': 'Helsinki Airport', 'city': 'Helsinki', 'country': 'FI', 'lat': 60.3172, 'lng': 24.9633},
    'DUB': {'name': 'Dublin Airport', 'city': 'Dublin', 'country': 'IE', 'lat': 53.4264, 'lng': -6.2499},

    # Americas
    'JFK': {'name': 'John F. Kennedy International', 'city': 'New York', 'country': 'US', 'lat': 40.6413, 'lng': -73.7781},
    'LAX': {'name': 'Los Angeles International', 'city': 'Los Angeles', 'country': 'US', 'lat': 33.9425, 'lng': -118.4081},
    'MIA': {'name': 'Miami International', 'city': 'Miami', 'country': 'US', 'lat': 25.7959, 'lng': -80.2870},
    'ORD': {'name': "O'Hare International", 'city': 'Chicago', 'country': 'US', 'lat': 41.9742, 'lng': -87.9073},
    'YYZ': {'name': 'Toronto Pearson International', 'city': 'Toronto', 'country': 'CA', 'lat': 43.6777, 'lng': -79.6248},
    'GRU': {'name': 'Guarulhos International', 'city': 'Sao Paulo', 'country': 'BR', 'lat': -23.4356, 'lng': -46.4731},
    'EZE': {'name': 'Ministro Pistarini International', 'city': 'Buenos Aires', 'country': 'AR', 'lat': -34.8222, 'lng': -58.5358},
    'MEX': {'name': 'Benito Juarez International', 'city': 'Mexico City', 'country': 'MX', 'lat': 19.4363, 'lng': -99.0721},
    'BOG': {'name': 'El Dorado International', 'city': 'Bogota', 'country': 'CO', 'lat': 4.7016, 'lng': -74.1469},
    'SCL': {'name': 'Arturo Merino Benitez', 'city': 'Santiago', 'country': 'CL', 'lat': -33.3930, 'lng': -70.7858},
}

# Try to load airportsdata package
_airports_data = None
try:
    import airportsdata
    _airports_data = airportsdata.load('IATA')
except ImportError:
    pass


def get_airport_info(iata_code: str) -> Optional[Dict]:
    """
    Get airport information by IATA code.

    Args:
        iata_code: 3-letter IATA airport code

    Returns:
        Dictionary with airport details or None
    """
    code = iata_code.upper().strip()

    # Try airportsdata package first
    if _airports_data and code in _airports_data:
        ap = _airports_data[code]
        return {
            'name': ap.get('name', ''),
            'city': ap.get('city', ''),
            'country': ap.get('country', ''),
            'lat': ap.get('lat', 0),
            'lng': ap.get('lon', 0)
        }

    # Fall back to local database
    if code in AIRPORT_DATABASE:
        return AIRPORT_DATABASE[code]

    return None


def get_coordinates(iata_code: str) -> Optional[Tuple[float, float]]:
    """
    Get latitude and longitude for an airport.

    Args:
        iata_code: 3-letter IATA airport code

    Returns:
        Tuple of (lat, lng) or None
    """
    info = get_airport_info(iata_code)
    if info:
        return (info['lat'], info['lng'])
    return None


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate great circle distance between two points using Haversine formula.

    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates

    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def enrich_routes_with_coordinates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add geographic coordinates to routes DataFrame.

    Args:
        df: DataFrame with 'LastStop' column

    Returns:
        DataFrame with added coordinate columns
    """
    enriched = df.copy()

    enriched['OriginLat'] = None
    enriched['OriginLng'] = None
    enriched['OriginCity'] = None
    enriched['OriginCountry'] = None
    enriched['Distance'] = None

    for idx, row in enriched.iterrows():
        coords = get_coordinates(row['LastStop'])
        info = get_airport_info(row['LastStop'])

        if coords:
            enriched.at[idx, 'OriginLat'] = coords[0]
            enriched.at[idx, 'OriginLng'] = coords[1]
            enriched.at[idx, 'Distance'] = calculate_distance(
                coords[0], coords[1],
                SWITZERLAND['lat'], SWITZERLAND['lng']
            )

        if info:
            enriched.at[idx, 'OriginCity'] = info.get('city', '')
            enriched.at[idx, 'OriginCountry'] = info.get('country', '')

    return enriched


def get_coverage_stats(df: pd.DataFrame) -> Dict:
    """
    Get statistics on coordinate coverage.

    Args:
        df: DataFrame with routes

    Returns:
        Dictionary with coverage statistics
    """
    total = len(df)
    with_coords = df['OriginLat'].notna().sum()

    return {
        'total_routes': total,
        'with_coordinates': int(with_coords),
        'coverage_percent': round(with_coords / total * 100, 1) if total > 0 else 0
    }
