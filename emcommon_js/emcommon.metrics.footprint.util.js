// Transcrypt'ed from Python, 2024-08-22 15:29:08
import {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, _copy, _sort, abs, all, any, assert, bin, bool, bytearray, bytes, callable, chr, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, hex, input, int, isinstance, issubclass, len, list, map, max, min, object, oct, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} from './org.transcrypt.__runtime__.js';
import {fetch_url, read_json_resource} from './emcommon.util.js';
import * as Logger from './emcommon.logger.js';
export {fetch_url, read_json_resource, Logger};
var __name__ = 'emcommon.metrics.footprint.util';
export var KWH_PER_GAL_GASOLINE = 33.7;
export var DIESEL_GGE = 0.88;
export var KWH_PER_GAL_DIESEL = KWH_PER_GAL_GASOLINE * 1.14;
export var KWH_PER_GAL_BIODIESEL = KWH_PER_GAL_GASOLINE * 1.05;
export var KWH_PER_GAL_LPG = KWH_PER_GAL_GASOLINE * 0.74;
export var KWH_PER_GAL_CNG = KWH_PER_GAL_GASOLINE * 0.26;
export var KWH_PER_KG_HYDROGEN = KWH_PER_GAL_GASOLINE * 1.0;
export var KWH_PER_GAL_OTHER = KWH_PER_GAL_GASOLINE * 1.0;
export var FUELS_KG_CO2_PER_KWH = dict ({'gasoline': 8.89 / KWH_PER_GAL_GASOLINE, 'diesel': 10.18 / (KWH_PER_GAL_GASOLINE / DIESEL_GGE), 'jet_fuel': 0.25, 'cng': 0.25, 'lpg': 0.25});
export var MI_PER_KM = 0.621371;
export var mpge_to_wh_per_km = function (mpge) {
	return ((MI_PER_KM / mpge) * KWH_PER_GAL_GASOLINE) * 1000;
};
export var year_of_trip = function (trip) {
	return int (trip ['start_fmt_time'].py_split ('-') [0]);
};
export var is_point_inside_polygon = function (pt, vs) {
	var __left0__ = pt;
	var x = __left0__ [0];
	var y = __left0__ [1];
	var inside = false;
	var j = len (vs) - 1;
	for (var i = 0; i < len (vs); i++) {
		var __left0__ = vs [i];
		var xi = __left0__ [0];
		var yi = __left0__ [1];
		var __left0__ = vs [j];
		var xj = __left0__ [0];
		var yj = __left0__ [1];
		var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) {
			var inside = !(inside);
		}
		var j = i;
	}
	return inside;
};
export var get_feature_containing_point = function (pt, geojson) {
	for (var feature of geojson ['features']) {
		if (feature ['geometry'] ['type'] == 'Polygon') {
			var polys = [feature ['geometry'] ['coordinates']];
		}
		else if (feature ['geometry'] ['type'] == 'MultiPolygon') {
			var polys = feature ['geometry'] ['coordinates'];
		}
		for (var poly of polys) {
			if (is_point_inside_polygon (pt, poly [0])) {
				return feature;
			}
		}
	}
	return null;
};
export var get_egrid_region = async function (coords, year) {
	if (year < 2018) {
		Logger.log_warn ('eGRID data not available for {}. Using 2018.'.format (year));
		return await get_egrid_region (coords, 2018);
	}
	try {
		var geojson = await read_json_resource ('egrid{}_subregions_5pct.json'.format (year));
	}
	catch (__except0__) {
		if (year > 2018) {
			Logger.log_warn ('eGRID data not available for {}. Trying {}.'.format (year, year - 1));
			return await get_egrid_region (coords, year - 1);
		}
		Logger.log_error ('eGRID lookup failed for {}.'.format (year));
		return null;
	}
	var region_feature = get_feature_containing_point (coords, geojson);
	if (region_feature !== null) {
		return region_feature ['properties'] ['name'];
	}
	return null;
};
export var get_uace_by_coords = async function (coords, year) {
	var census_year = year - __mod__ (year, 10);
	var url = ('https://geocoding.geo.census.gov/geocoder/geographies/coordinates?' + 'x={}&y={}'.format (coords [0], coords [1])) + '&benchmark=Public_AR_Current&vintage=Census{}_Current&layers=87&format=json'.format (census_year);
	try {
		var data = await fetch_url (url);
	}
	catch (__except0__) {
		Logger.log_error ('Failed to geocode {} in year {}'.format (coords, year));
		return null;
	}
	for (var g in data ['result'] ['geographies']) {
		for (var entry of data ['result'] ['geographies'] [g]) {
			if (__in__ ('UA', entry)) {
				return entry ['UA'];
			}
		}
	}
	Logger.log_error ('Geocoding response did not contain UA for coords {} in year {}: {}'.format (coords, year, data));
	return null;
};
export var get_intensities_data = async function (year, dataset) {
	if (year < 2018) {
		Logger.log_warn ('{} data not available for {}. Using 2018.'.format (dataset, year));
		return await get_intensities_data (2018, dataset);
	}
	try {
		return await read_json_resource ('{}{}_intensities.json'.format (dataset, year));
	}
	catch (__except0__) {
		if (year > 2018) {
			Logger.log_warn ('{} data not available for {}. Trying {}.'.format (dataset, year, year - 1));
			return await get_intensities_data (year - 1, dataset);
		}
		Logger.log_error ('eGRID lookup failed for {}.'.format (year));
		return null;
	}
};

//# sourceMappingURL=emcommon.metrics.footprint.util.map