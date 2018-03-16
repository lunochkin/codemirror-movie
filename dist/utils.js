'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.extend = extend;
exports.toArray = toArray;
exports.prefixed = prefixed;
exports.posObj = posObj;
exports.getCursor = getCursor;
exports.makePos = makePos;
exports.template = template;
exports.find = find;
exports.parseJSON = parseJSON;
var propCache = {};

// detect CSS 3D Transforms for smoother animations 
var has3d = exports.has3d = function () {
	var el = document.createElement('div');
	var cssTransform = prefixed('transform');
	if (cssTransform) {
		el.style[cssTransform] = 'translateZ(0)';
		return (/translatez/i.test(el.style[cssTransform])
		);
	}

	return false;
}();

function extend(obj) {
	for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		args[_key - 1] = arguments[_key];
	}

	args.forEach(function (a) {
		if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object') {
			Object.keys(a).forEach(function (key) {
				return obj[key] = a[key];
			});
		}
	});
	return obj;
}

function toArray(obj) {
	var ix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

	return Array.prototype.slice.call(obj, ix);
}

/**
 * Returns prefixed (if required) CSS property name
 * @param  {String} prop
 * @return {String}
 */
function prefixed(prop) {
	if (prop in propCache) {
		return propCache[prop];
	}

	var el = document.createElement('div');
	var style = el.style;

	var prefixes = ['o', 'ms', 'moz', 'webkit'];
	var props = [prop];
	var capitalize = function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.substr(1);
	};

	prop = prop.replace(/\-([a-z])/g, function (str, ch) {
		return ch.toUpperCase();
	});

	var capProp = capitalize(prop);
	prefixes.forEach(function (prefix) {
		props.push(prefix + capProp, capitalize(prefix) + capProp);
	});

	for (var i = 0, il = props.length; i < il; i++) {
		if (props[i] in style) {
			return propCache[prop] = props[i];
		}
	}

	return propCache[prop] = null;
}

function posObj(obj) {
	return {
		line: obj.line,
		ch: obj.ch
	};
}

function getCursor(editor) {
	var start = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'from';

	return posObj(editor.getCursor(start));
}

/**
 * Helper function that produces <code>{line, ch}</code> object from
 * passed argument
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object}
 */
function makePos(pos, editor) {
	if (pos === 'caret') {
		return getCursor(editor);
	}

	if (typeof pos === 'string') {
		if (~pos.indexOf(':')) {
			var parts = pos.split(':');
			return {
				line: +parts[0],
				ch: +parts[1]
			};
		}

		pos = +pos;
	}

	if (typeof pos === 'number') {
		return posObj(editor.posFromIndex(pos));
	}

	return posObj(pos);
}

function template(tmpl, data) {
	var fn = function fn(data) {
		return tmpl.replace(/<%([-=])?\s*([\w\-]+)\s*%>/g, function (str, op, key) {
			return data[key.trim()];
		});
	};
	return data ? fn(data) : fn;
}

function find(arr, iter) {
	var found;
	arr.some(function (item, i, arr) {
		if (iter(item, i, arr)) {
			return found = item;
		}
	});
	return found;
}

/**
 * Relaxed JSON parser.
 * @param {String} text
 * @returns {Object} 
 */
function parseJSON(text) {
	try {
		return new Function('return ' + text)();
	} catch (e) {
		return {};
	}
}