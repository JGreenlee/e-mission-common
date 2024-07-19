// Transcrypt'ed from Python, 2024-07-16 14:06:22
import {AssertionError, AttributeError, BaseException, DeprecationWarning, Exception, IndexError, IterableError, KeyError, NotImplementedError, RuntimeWarning, StopIteration, UserWarning, ValueError, Warning, __JsIterator__, __PyIterator__, __Terminal__, __add__, __and__, __call__, __class__, __envir__, __eq__, __floordiv__, __ge__, __get__, __getcm__, __getitem__, __getslice__, __getsm__, __gt__, __i__, __iadd__, __iand__, __idiv__, __ijsmod__, __ilshift__, __imatmul__, __imod__, __imul__, __in__, __init__, __ior__, __ipow__, __irshift__, __isub__, __ixor__, __jsUsePyNext__, __jsmod__, __k__, __kwargtrans__, __le__, __lshift__, __lt__, __matmul__, __mergefields__, __mergekwargtrans__, __mod__, __mul__, __ne__, __neg__, __nest__, __or__, __pow__, __pragma__, __pyUseJsNext__, __rshift__, __setitem__, __setproperty__, __setslice__, __sort__, __specialattrib__, __sub__, __super__, __t__, __terminal__, __truediv__, __withblock__, __xor__, abs, all, any, assert, bool, bytearray, bytes, callable, chr, copy, deepcopy, delattr, dict, dir, divmod, enumerate, filter, float, getattr, hasattr, input, int, isinstance, issubclass, len, list, map, max, min, object, ord, pow, print, property, py_TypeError, py_iter, py_metatype, py_next, py_reversed, py_typeof, range, repr, round, set, setattr, sorted, str, sum, tuple, zip} from './org.transcrypt.__runtime__.js';
var __name__ = 'emcommon.metrics.footprint_calculations';
export var KG_CO2_PER_GALLON_GASOLINE = 8.89;
export var KG_CO2_PER_GALLON_DIESEL = 10.18;
export var DIESEL_GGE = 1.136;
export var KWH_PER_GALLON_GASOLINE = 33.7;
export var KWH_PER_GALLON_DIESEL = KWH_PER_GALLON_GASOLINE * 1.14;
export var KG_CO2_PER_KWH_GASOLINE = KG_CO2_PER_GALLON_GASOLINE / KWH_PER_GALLON_GASOLINE;
export var KG_CO2_PER_KWH_DIESEL = KG_CO2_PER_GALLON_DIESEL / KWH_PER_GALLON_DIESEL;
export var grid_emission_rate_for_trip = function (trip) {
	// pass;
};
export var calc_footprint_for_trip = function (trip, mode_footprint) {
	var distance = trip ['distance'];
	var kwh_total = 0;
	var kg_co2_total = 0;
	for (var [fuel_type, fuel_type_footprint] of mode_footprint.py_items ()) {
		var kwh = ((distance / 1000) * fuel_type_footprint ['wh_per_km']) / 1000;
		if (fuel_type == 'electric') {
			var kg_per_kwh = grid_emission_rate_for_trip (trip);
			var kg_co2 = kwh * kg_per_kwh;
		}
		if (fuel_type == 'gasoline') {
			var kg_co2 = kwh * KG_CO2_PER_KWH_GASOLINE;
		}
		if (fuel_type == 'diesel') {
			var kg_co2 = kwh * KG_CO2_PER_KWH_DIESEL;
		}
		kwh_energy += kwh;
		kg_co2_total += kg_co2;
	}
	return dict ({'kwh': kwh_total, 'kg_co2': kg_co2_total});
};

//# sourceMappingURL=emcommon.metrics.footprint_calculations.map