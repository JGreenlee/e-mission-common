// Transcrypt'ed from Python, 2024-08-02 08:25:08
import {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, abs, all, any, assert, bin, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, hex, input, int, isinstance, issubclass, len, list, map, max, min, object, oct, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} from './org.transcrypt.__runtime__.js';
import {ntd_data, uace_zip_maps} from './emcommon.metrics.footprint.ntd_data_by_year.js';
import * as util from './emcommon.metrics.footprint.util.js';
import * as Logger from './emcommon.logger.js';
export {uace_zip_maps, Logger, util, ntd_data};
var __name__ = 'emcommon.metrics.footprint.transit_calculations';
export var fuel_types = ['Gasoline', 'Diesel', 'LPG', 'CNG', 'Hydrogen', 'Electric', 'Other'];
export var weighted_mean = function (py_values, weights) {
	var w_sum = sum (weights);
	return sum ((function () {
		var __accu0__ = [];
		for (var [v, w] of zip (py_values, weights)) {
			__accu0__.append ((v * w) / w_sum);
		}
		return __accu0__;
	}) ());
};
export var get_uace_by_zipcode = function (zipcode, year) {
	var year = str (year - __mod__ (year, 10));
	for (var [uace, zips] of uace_zip_maps [year].py_items ()) {
		if (__in__ (zipcode, zips)) {
			return uace;
		}
	}
	Logger.log_warn ('UACE code not found for zipcode {} in year {}'.format (zipcode, year));
	return null;
};
export var get_intensities_for_trip = function (trip, modes) {
	var year = util.year_of_trip (trip);
	var uace_code = get_uace_by_zipcode (trip ['start_confirmed_place'] ['zipcode'], year);
	return get_intensities (year, uace_code, modes);
};
export var get_intensities = function (year, uace, modes) {
	if (typeof uace == 'undefined' || (uace != null && uace.hasOwnProperty ("__kwargtrans__"))) {;
		var uace = null;
	};
	if (typeof modes == 'undefined' || (modes != null && modes.hasOwnProperty ("__kwargtrans__"))) {;
		var modes = null;
	};
	Logger.log_debug ('Getting mode footprint for transit modes {} in year {} and UACE {}'.format (modes, year, uace));
	var intensities = dict ({});
	var metadata = dict ({'source': 'NTD', 'is_provisional': false, 'year': year, 'requested_year': year, 'uace_code': uace, 'modes': modes, 'ntd_ids': []});
	var year_str = str (year);
	if (!__in__ (year_str, ntd_data)) {
		var year_str = str (util.find_closest_available_year (year, ntd_data.py_keys ()));
		metadata ['is_provisional'] = true;
		metadata ['year'] = year_str;
		Logger.log_warn ('NTD data not available for year {}; using closest available year {}'.format (year, year_str));
	}
	var agency_mode_fueltypes = [];
	for (var entry of ntd_data [year_str]) {
		if (modes && !__in__ (entry ['Mode'], modes) || uace && entry ['UACE Code'] != uace) {
			continue;
		}
		var pkm = entry ['Passenger km'];
		var all_fuels_km = entry ['All Fuels (km)'];
		var average_passengers = entry ['Average Passengers'];
		for (var fuel_type of fuel_types) {
			var km_value = entry.py_get ('{} (km)'.format (fuel_type), 0);
			var wh_per_km_value = entry.py_get ('{} (Wh/km)'.format (fuel_type), 0);
			if (km_value && wh_per_km_value) {
				agency_mode_fueltypes.append (dict ({'fuel_type': fuel_type, 'pkm': (km_value / all_fuels_km) * pkm, 'wh_per_km': wh_per_km_value / average_passengers}));
				if (!__in__ (entry ['NTD ID'], metadata ['ntd_ids'])) {
					metadata ['ntd_ids'].append (entry ['NTD ID']);
				}
			}
		}
	}
	var total_pkm = sum ((function () {
		var __accu0__ = [];
		for (var entry of agency_mode_fueltypes) {
			__accu0__.append (entry ['pkm']);
		}
		return __accu0__;
	}) ());
	if (!(agency_mode_fueltypes)) {
		Logger.log_info ('Insufficient data for year {} and UACE {} and modes {}'.format (year, uace, modes));
		if (uace) {
			Logger.log_info ('Retrying with UACE = None');
			return get_intensities (year, null, modes);
		}
		if (modes) {
			Logger.log_info ('Retrying with modes = None');
			return get_intensities (year, uace, null);
		}
		Logger.log_error ('No data available for any UACE or modes');
		return tuple ([null, metadata]);
	}
	for (var entry of agency_mode_fueltypes) {
		entry ['weight'] = entry ['pkm'] / total_pkm;
	}
	Logger.log_debug ('agency_mode_fueltypes = {}'.format (agency_mode_fueltypes).__getslice__ (0, 500, 1));
	for (var fuel_type of fuel_types) {
		var fuel_type_entries = (function () {
			var __accu0__ = [];
			for (var entry of agency_mode_fueltypes) {
				if (entry ['fuel_type'] == fuel_type) {
					__accu0__.append (entry);
				}
			}
			return __accu0__;
		}) ();
		if (len (fuel_type_entries) == 0) {
			continue;
		}
		var wh_per_km_values = (function () {
			var __accu0__ = [];
			for (var entry of fuel_type_entries) {
				__accu0__.append (entry ['wh_per_km']);
			}
			return __accu0__;
		}) ();
		var weights = (function () {
			var __accu0__ = [];
			for (var entry of fuel_type_entries) {
				__accu0__.append (entry ['weight']);
			}
			return __accu0__;
		}) ();
		Logger.log_debug ('fuel_type = {}; wh_per_km_values = {}; weights = {}'.format (fuel_type, wh_per_km_values, weights).__getslice__ (0, 500, 1));
		var fuel_type = fuel_type.lower ();
		intensities [fuel_type] = dict ({'wh_per_km': weighted_mean (wh_per_km_values, weights), 'weight': sum (weights)});
	}
	var wh_per_km_values = (function () {
		var __accu0__ = [];
		for (var entry of agency_mode_fueltypes) {
			__accu0__.append (entry ['wh_per_km']);
		}
		return __accu0__;
	}) ();
	var weights = (function () {
		var __accu0__ = [];
		for (var entry of agency_mode_fueltypes) {
			__accu0__.append (entry ['weight']);
		}
		return __accu0__;
	}) ();
	intensities ['overall'] = dict ({'wh_per_km': weighted_mean (wh_per_km_values, weights), 'weight': sum (weights)});
	Logger.log_info ('intensities = {}; metadata = {}'.format (intensities, metadata).__getslice__ (0, 500, 1));
	return tuple ([intensities, metadata]);
};

//# sourceMappingURL=emcommon.metrics.footprint.transit_calculations.map