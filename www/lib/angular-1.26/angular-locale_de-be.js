'use strict';
angularmodule("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
function getDecimals(n) {
n = n + '';
var i = nindexOf('');
return (i == -1) ? 0 : nlength - i - 1;
}
function getVF(n, opt_precision) {
var v = opt_precision;
if (undefined === v) {
v = Mathmin(getDecimals(n), 3);
}
var base = Mathpow(10, v);
var f = ((n * base) | 0) % base;
return {v: v, f: f};
}
$providevalue("$locale", {
"DATETIME_FORMATS": {
"AMPMS": [
"AM",
"PM"
],
"DAY": [
"Lunedi",
"Martedi",
"Mercoledi",
"Giovedi",
"Venerdi",
"Sabato",
"Domenica"
],
"MONTH": [
"Gennaio",
"Febbraio",
"Marzo",
"Aprile",
"Maggio",
"Giugno",
"Luglio",
"Agosto",
"Settembre",
"Ottobre",
"Novembre",
"Dicembre"
],
"SHORTDAY": [
"Lun",
"Mar",
"Mer",
"Gio",
"Ven",
"Sab",
"Dom"
],
"SHORTMONTH": [
"Gen",
"Feb",
"Mar",
"Apr",
"Mag",
"Giu",
"Lug",
"Ago",
"Set",
"Ott",
"Nov",
"Dec"
],
"fullDate": "EEEE, d MMMM y",
"longDate": "d MMMM y",
"medium": "ddMMy HH:mm:ss",
"mediumDate": "ddMMy",
"mediumTime": "HH:mm:ss",
"short": "ddMMyy HH:mm",
"shortDate": "ddMMyy",
"shortTime": "HH:mm"
},
"NUMBER_FORMATS": {
"CURRENCY_SYM": "\u20ac",
"DECIMAL_SEP": ",",
"GROUP_SEP": "",
"PATTERNS": [
{
"gSize": 3,
"lgSize": 3,
"maxFrac": 3,
"minFrac": 0,
"minInt": 1,
"negPre": "-",
"negSuf": "",
"posPre": "",
"posSuf": ""
},
{
"gSize": 3,
"lgSize": 3,
"maxFrac": 2,
"minFrac": 2,
"minInt": 1,
"negPre": "-",
"negSuf": "\u00a0\u00a4",
"posPre": "",
"posSuf": "\u00a0\u00a4"
}
]
},
"id": "de-be",
"pluralCat": function(n, opt_precision) { var i = n | 0; var vf = getVF(n, opt_precision); if (i == 1 && vfv == 0) { return PLURAL_CATEGORYONE; } return PLURAL_CATEGORYOTHER;}
});
}]);