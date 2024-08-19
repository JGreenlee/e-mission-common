"""
Functions that utilize NTD data to estimate fuel efficiency of different public transit
modes in a given year and area code.
"""

import emcommon.logger as Logger
import emcommon.metrics.footprint.util as util
from emcommon.metrics.footprint.ntd_data_by_year import ntd_data, uace_zip_maps

fuel_types = ['Gasoline', 'Diesel', 'LPG', 'CNG', 'Hydrogen', 'Electric', 'Other']

def weighted_mean(values, weights):
    w_sum = sum(weights)
    return sum([v * w / w_sum for v, w in zip(values, weights)])

def get_uace_by_zipcode(zipcode: str, year: int) -> str:
    year = str(year - year % 10)
    for uace, zips in uace_zip_maps[year].items():
        if zipcode in zips:
            return uace
    Logger.log_warn(f"UACE code not found for zipcode {zipcode} in year {year}")
    return None

def get_intensities_for_trip(trip, modes):
    year = util.year_of_trip(trip)
    uace_code = get_uace_by_zipcode(trip["start_confirmed_place"]["zipcode"], year)
    return get_intensities(year, uace_code, modes)

def get_intensities(year: int, uace: str | None = None, modes: list[str] | None = None):
    """
    Returns estimated energy intensities by fuel type across the given modes in the urban area of the given trip.
    :param trip: The trip to get the data for, e.g. {"year": "2022", "distance": 1000, "start_confirmed_place": {"zipcode": "45221"}}
    :param modes: The NTD modes to get the data for, e.g. ["MB","CB"] (https://www.transit.dot.gov/ntd/national-transit-database-ntd-glossary)
    :returns: A dictionary of energy intensities by fuel type, with weights, e.g. {"gasoline": { "wh_per_km": 1000, "weight": 0.5 }, "diesel": { "wh_per_km": 2000, "weight": 0.5 }, "overall": { "wh_per_km": 1500, "weight": 1.0 } }
    """
    Logger.log_debug(f"Getting mode footprint for transit modes {modes} in year {year} and UACE {uace}")

    intensities = {}
    metadata = {
        "source": "NTD",
        "is_provisional": False,
        "year": year,
        "requested_year": year,
        "uace_code": uace,
        "modes": modes,
        "ntd_ids": [],
    }

    year_str = str(year)
    if (year_str not in ntd_data):
        year_str = str(util.find_closest_available_year(year, ntd_data.keys()))
        metadata["is_provisional"] = True
        metadata["year"] = year_str
        Logger.log_warn(f"NTD data not available for year {year}; using closest available year {year_str}")

    total_upt = 0
    agency_mode_fueltypes = []
    for entry in ntd_data[year_str]:
        # skip entries that don't match the requested modes or UACE
        if (modes and entry["Mode"] not in modes) or (uace and entry["UACE Code"] != uace):
            continue
        upt = entry['Unlinked Passenger Trips']
        total_upt += upt
        for fuel_type in fuel_types:
            fuel_pct = entry.get(f"{fuel_type} (%)", 0)
            wh_per_pkm = entry.get(f"{fuel_type} (Wh/pkm)", 0)
            if fuel_pct and wh_per_pkm:
                agency_mode_fueltypes.append({
                    "fuel_type": fuel_type,
                    "upt": fuel_pct / 100 * upt,
                    "wh_per_km": wh_per_pkm
                })
                if entry['NTD ID'] not in metadata["ntd_ids"]:
                    metadata["ntd_ids"].append(entry['NTD ID'])

    # TODO Should there be a threshold for the minimum amount of data required?
    # i.e. if there is only one tiny agency that matches the criteria, should we trust it?
    # if total_upt < 10000:

    if not agency_mode_fueltypes:
        Logger.log_info(f"Insufficient data for year {year} and UACE {uace} and modes {modes}")
        if uace:
            Logger.log_info("Retrying with UACE = None")
            return get_intensities(year, None, modes)
        if modes:
            Logger.log_info("Retrying with modes = None")
            return get_intensities(year, uace, None)
        Logger.log_error("No data available for any UACE or modes")
        return (None, metadata)

    for entry in agency_mode_fueltypes:
        entry['weight'] = entry['upt'] / total_upt
    Logger.log_debug(f"agency_mode_fueltypes = {agency_mode_fueltypes}"[:500])

    for fuel_type in fuel_types:
        fuel_type_entries = [entry for entry in agency_mode_fueltypes
                             if entry['fuel_type'] == fuel_type]
        if len(fuel_type_entries) == 0:
            continue
        wh_per_km_values = [entry['wh_per_km'] for entry in fuel_type_entries]
        weights = [entry['weight'] for entry in fuel_type_entries]
        Logger.log_debug(f"fuel_type = {fuel_type}; wh_per_km_values = {wh_per_km_values}; weights = {weights}"[:500])
        fuel_type = fuel_type.lower()
        intensities[fuel_type] = {
            "wh_per_km": weighted_mean(wh_per_km_values, weights),
            "weight": sum(weights)
        }

    # take the overall weighted average between fuel types
    wh_per_km_values = [entry['wh_per_km'] for entry in agency_mode_fueltypes]
    weights = [entry['weight'] for entry in agency_mode_fueltypes]
    intensities['overall'] = {
        "wh_per_km": weighted_mean(wh_per_km_values, weights),
        "weight": sum(weights)
    }

    Logger.log_info(f"intensities = {intensities}; metadata = {metadata}"[:500])
    return (intensities, metadata)