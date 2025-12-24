 #!/usr/bin/env python3
  """
  Generate static JSON analysis files from INAD and BAZL Excel data.
  This script is run by GitHub Actions when new data is uploaded.
  """

  import json
  import os
  import sys
  from datetime import datetime
  from pathlib import Path

  # Add backend to path
  sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

  from inad_analysis import (
      AnalysisConfig,
      run_full_analysis,
      get_available_semesters,
      detect_systemic_cases
  )
  from geography import enrich_routes_with_coordinates

  def find_data_files(data_dir):
      """Find INAD and BAZL files in the data directory."""
      inad_file = None
      bazl_file = None

      for file in os.listdir(data_dir):
          lower = file.lower()
          if 'inad' in lower and (lower.endswith('.xlsx') or lower.endswith('.xlsm')):
              inad_file = os.path.join(data_dir, file)
          elif 'bazl' in lower and (lower.endswith('.xlsx') or lower.endswith('.xlsm')):
              bazl_file = os.path.join(data_dir, file)

      return inad_file, bazl_file

  def analyze_semester(inad_path, bazl_path, semester, config):
      """Run analysis for a single semester."""
      year, half = semester.split('-')
      year = int(year)

      if half == 'H1':
          start_date = datetime(year, 1, 1)
          end_date = datetime(year, 6, 30)
      else:
          start_date = datetime(year, 7, 1)
          end_date = datetime(year, 12, 31)

      results = run_full_analysis(inad_path, bazl_path, start_date, end_date, config)

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

      return {
          'semester': semester,
          'summary': results['summary'],
          'threshold': round(results['threshold'], 4),
          'routes': routes,
          'airlines': airlines,
          'step2Routes': step2_routes,
          'config': {
              'min_inad': config.min_inad,
              'min_pax': config.min_pax,
              'min_density': config.min_density,
              'threshold_method': config.threshold_method,
              'high_priority_multiplier': config.high_priority_multiplier
          },
          'generated_at': datetime.now().isoformat()
      }

  def generate_historic_data(semester_results):
      """Generate historic trend data from semester results."""
      semesters = []
      for semester, result in semester_results.items():
          semesters.append({
              'semester': semester,
              'summary': result['summary'],
              'threshold': result['threshold'],
              'highPriorityCount': result['summary']['high_priority'],
              'watchListCount': result['summary']['watch_list'],
              'totalInad': result['summary']['total_inad']
          })

      semesters.sort(key=lambda x: x['semester'])

      if len(semesters) >= 2:
          first = semesters[0]
          last = semesters[-1]
          hp_change = last['highPriorityCount'] - first['highPriorityCount']
          wl_change = last['watchListCount'] - first['watchListCount']
          total_change = hp_change + wl_change

          if total_change > 0:
              direction = 'worsening'
          elif total_change < 0:
              direction = 'improving'
          else:
              direction = 'stable'

          trend = {
              'direction': direction,
              'highPriorityChange': hp_change,
              'watchListChange': wl_change,
              'totalChange': total_change
          }
      else:
          trend = {'direction': 'stable', 'highPriorityChange': 0, 'watchListChange': 0, 'totalChange': 0}

      return {
          'semesters': semesters,
          'trend': trend,
          'generated_at': datetime.now().isoformat()
      }

  def generate_systemic_cases(inad_path, bazl_path, semesters_info, config):
      """Generate systemic cases data."""
      semester_results = []
      for sem_info in semesters_info:
          semester = sem_info['value']
          year, half = semester.split('-')
          year = int(year)

          if half == 'H1':
              start_date = datetime(year, 1, 1)
              end_date = datetime(year, 6, 30)
          else:
              start_date = datetime(year, 7, 1)
              end_date = datetime(year, 12, 31)

          results = run_full_analysis(inad_path, bazl_path, start_date, end_date, config)
          semester_results.append((semester, results['step3']))

      systemic_df = detect_systemic_cases(semester_results, config)

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
          'generated_at': datetime.now().isoformat()
      }

  def main():
      project_root = Path(__file__).parent.parent
      data_dir = project_root / 'data'
      output_dir = project_root / 'public' / 'analysis'

      output_dir.mkdir(parents=True, exist_ok=True)

      inad_file, bazl_file = find_data_files(data_dir)

      if not inad_file or not bazl_file:
          print("Error: Could not find INAD and BAZL files in data/ directory")
          print(f"  INAD file: {inad_file}")
          print(f"  BAZL file: {bazl_file}")
          sys.exit(1)

      print(f"Found INAD file: {inad_file}")
      print(f"Found BAZL file: {bazl_file}")

      config = AnalysisConfig()
      semesters = get_available_semesters(inad_file)
      print(f"Found {len(semesters)} semesters: {[s['value'] for s in semesters]}")

      with open(output_dir / 'semesters.json', 'w') as f:
          json.dump(semesters, f, indent=2)
      print("Generated: semesters.json")

      semester_results = {}
      for sem_info in semesters:
          semester = sem_info['value']
          print(f"Analyzing {semester}...")

          try:
              result = analyze_semester(inad_file, bazl_file, semester, config)
              semester_results[semester] = result

              with open(output_dir / f'analysis_{semester}.json', 'w') as f:
                  json.dump(result, f, indent=2)
              print(f"  Generated: analysis_{semester}.json")
          except Exception as e:
              print(f"  Error analyzing {semester}: {e}")

      if semester_results:
          historic = generate_historic_data(semester_results)
          with open(output_dir / 'historic.json', 'w') as f:
              json.dump(historic, f, indent=2)
          print("Generated: historic.json")

      if len(semesters) >= 2:
          print("Detecting systemic cases...")
          try:
              systemic = generate_systemic_cases(inad_file, bazl_file, semesters, config)
              with open(output_dir / 'systemic.json', 'w') as f:
                  json.dump(systemic, f, indent=2)
              print("Generated: systemic.json")
          except Exception as e:
              print(f"Error generating systemic cases: {e}")

      index = {
          'semesters': [s['value'] for s in semesters],
          'latest_semester': semesters[-1]['value'] if semesters else None,
          'generated_at': datetime.now().isoformat(),
          'config': {
              'min_inad': config.min_inad,
              'min_pax': config.min_pax,
              'min_density': config.min_density,
              'threshold_method': config.threshold_method,
              'high_priority_multiplier': config.high_priority_multiplier
          }
      }
      with open(output_dir / 'index.json', 'w') as f:
          json.dump(index, f, indent=2)
      print("Generated: index.json")

      print("\nAnalysis complete!")

  if __name__ == '__main__':
      main()
