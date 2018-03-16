'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.actions = exports.alignDefaults = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * Extension that allows authors to display context tooltips bound to specific
                                                                                                                                                                                                                                                                               * positions
                                                                                                                                                                                                                                                                               */


exports.show = show;
exports.hide = hide;

var _tween = require('../vendor/tween');

var _tween2 = _interopRequireDefault(_tween);

var _utils = require('../utils');

var _dom = require('../dom');

var dom = _interopRequireWildcard(_dom);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var instance = null;
var lastTween = null;

var alignDefaults = exports.alignDefaults = {
	/** CSS selector for getting popup tail */
	tailClass: 'CodeMirror-tooltip__tail',

	/** Class name for switching tail/popup position relative to target point */
	belowClass: 'CodeMirror-tooltip_below',

	/** Min distance between popup and viewport */
	popupMargin: 5,

	/** Min distance between popup left/right edge and its tail */
	tailMargin: 11
};

var actions = exports.actions = {
	/**
  * Shows tooltip with given text, wait for `options.wait`
  * milliseconds then hides tooltip
  */
	tooltip: function tooltip(_ref) {
		var options = _ref.options,
		    editor = _ref.editor,
		    prev = _ref.prev,
		    next = _ref.next,
		    stop = _ref.stop,
		    timer = _ref.timer;

		options = (0, _utils.extend)({
			wait: 4000, // time to wait before hiding tooltip
			pos: 'caret' // position where tooltip should point to
		}, wrap('text', options));

		var pos = resolvePosition(options.pos, editor);
		show({ text: options.text, prev: prev, next: next }, pos, function () {
			// timer(function() {
			// 	hide(() => timer(next));
			// }, options.wait);

			if (prev) {
				instance.querySelector('.CodeMirror-tooltip__prev').addEventListener('click', function () {
					hide(prev);
				});
			}

			if (next) {
				instance.querySelector('.CodeMirror-tooltip__next').addEventListener('click', function () {
					hide(next);
				});
			} else {
				instance.querySelector('.CodeMirror-tooltip__finish').addEventListener('click', function () {
					hide(stop);
				});
			}
		});
	},


	/**
  * Shows tooltip with specified text. This tooltip should be explicitly 
  * hidden with `hideTooltip` action
  */
	showTooltip: function showTooltip(params) {
		actions.tooltip(params);
		// options = extend({
		// 	pos: 'caret'  // position where tooltip should point to
		// }, wrap('text', options));

		// show({text: options.text, prev, next}, resolvePosition(options.pos, editor));
		// next();
	},


	/**
  * Hides tooltip, previously shown by 'showTooltip' action
  */
	hideTooltip: function hideTooltip(_ref2) {
		var options = _ref2.options,
		    editor = _ref2.editor,
		    next = _ref2.next,
		    timer = _ref2.timer;

		hide(next);
	}
};

function show(_ref3, pos, callback) {
	var text = _ref3.text,
	    prev = _ref3.prev,
	    next = _ref3.next;

	hide();

	var html = '<div class="CodeMirror-tooltip">\n\t\t<div class="CodeMirror-tooltip__content">' + text + '</div>\n\t\t<div class="CodeMirror-tooltip__tail"></div>';

	if (prev) {
		html += '<button class="CodeMirror-tooltip__prev">backward</button>';
	}

	if (next) {
		html += '<button class="CodeMirror-tooltip__next">forward</button>';
	} else {
		html += '<button class="CodeMirror-tooltip__finish">finish</button>';
	}

	html += '</div>';

	instance = dom.toDOM(html);

	dom.css(instance, (0, _utils.prefixed)('transform'), 'scale(0)');
	document.body.appendChild(instance);

	alignPopupWithTail(instance, { position: pos });
	animateShow(instance, { complete: callback });
}

function hide(callback) {
	if (instance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(instance, { complete: callback });
		instance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * Helper function that finds optimal position of tooltip popup on page
 * and aligns popup tail with this position
 * @param {Element} popup
 * @param {Object} options
 */
function alignPopupWithTail(popup) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	options = (0, _utils.extend)({}, alignDefaults, options);

	dom.css(popup, {
		left: 0,
		top: 0
	});

	var tail = popup.querySelector('.' + options.tailClass);

	var resultX = 0,
	    resultY = 0;
	var pos = options.position;
	var vp = dom.viewportRect();

	var width = popup.offsetWidth;
	var height = popup.offsetHeight;

	var isTop;

	// calculate horizontal position
	resultX = Math.min(vp.width - width - options.popupMargin, Math.max(options.popupMargin, pos.x - vp.left - width / 2));

	// calculate vertical position
	if (height + tail.offsetHeight + options.popupMargin + vp.top < pos.y) {
		// place above target position
		resultY = Math.max(0, pos.y - height - tail.offsetHeight);
		isTop = true;
	} else {
		// place below target position 
		resultY = pos.y + tail.offsetHeight;
		isTop = false;
	}

	// calculate tail position
	var tailMinLeft = options.tailMargin;
	var tailMaxLeft = width - options.tailMargin;
	tail.style.left = Math.min(tailMaxLeft, Math.max(tailMinLeft, pos.x - resultX - vp.left)) + 'px';

	dom.css(popup, {
		left: resultX,
		top: resultY
	});

	popup.classList.toggle(options.belowClass, !isTop);
}

/**
 * @param {jQuery} elem
 * @param {Object} options 
 */
function animateShow(elem) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	options = (0, _utils.extend)({}, alignDefaults, options);
	var cssOrigin = (0, _utils.prefixed)('transform-origin');
	var cssTransform = (0, _utils.prefixed)('transform');
	var style = elem.style;

	var tail = elem.querySelector('.' + options.tailClass);
	var xOrigin = dom.css(tail, 'left');
	var yOrigin = tail.offsetTop;
	if (elem.classList.contains(options.belowClass)) {
		yOrigin -= tail.offsetHeight;
	}

	yOrigin += 'px';

	style[cssOrigin] = xOrigin + ' ' + yOrigin;
	var prefix = _utils.has3d ? 'translateZ(0) ' : '';

	return lastTween = (0, _tween2.default)({
		duration: 800,
		easing: 'outElastic',
		step: function step(pos) {
			style[cssTransform] = prefix + 'scale(' + pos + ')';
		},
		complete: function complete() {
			style[cssTransform] = 'none';
			lastTween = null;
			options.complete && options.complete(elem);
		}
	});
}

/**
 * @param {jQuery} elem
 * @param {Object} options
 */
function animateHide(elem, options) {
	var style = elem.style;

	return (0, _tween2.default)({
		duration: 200,
		easing: 'linear',
		step: function step(pos) {
			style.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove(elem);
			options.complete && options.complete(elem);
		}
	});
}

/**
 * Resolves position where tooltip should point to
 * @param {Object} pos
 * @param {CodeMirror} editor
 * @returns {Object} Object with <code>x</code> and <code>y</code> 
 * properties
 */
function resolvePosition(pos, editor) {
	if (pos === 'caret') {
		// get absolute position of current caret position
		return sanitizeCaretPos(editor.cursorCoords(true));
	}

	if ((typeof pos === 'undefined' ? 'undefined' : _typeof(pos)) === 'object') {
		if ('x' in pos && 'y' in pos) {
			// passed absolute coordinates
			return pos;
		}

		if ('left' in pos && 'top' in pos) {
			// passed absolute coordinates
			return sanitizeCaretPos(pos);
		}
	}

	pos = (0, _utils.makePos)(pos, editor);
	return sanitizeCaretPos(editor.charCoords(pos));
}

function sanitizeCaretPos(pos) {
	if ('left' in pos) {
		pos.x = pos.left;
	}

	if ('top' in pos) {
		pos.y = pos.top;
	}

	return pos;
}

function wrap(key, value) {
	return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? value : _defineProperty({}, key, value);
}