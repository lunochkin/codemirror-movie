'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.actions = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * Shows fake prompt dialog with interactive value typing
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

var dialogInstance = null;
var bgInstance = null;
var lastTween = null;

var actions = exports.actions = {
	prompt: function prompt(_ref) {
		var options = _ref.options,
		    editor = _ref.editor,
		    next = _ref.next,
		    timer = _ref.timer;

		options = (0, _utils.extend)({
			title: 'Enter something',
			delay: 80, // delay between character typing
			typeDelay: 1000, // time to wait before typing text
			hideDelay: 2000 // time to wait before hiding prompt dialog
		}, wrap('text', options));

		show(options.title, editor.getWrapperElement(), function (dialog) {
			timer(function () {
				typeText(dialog.querySelector('.CodeMirror-prompt__input'), options, timer, function () {
					timer(function () {
						hide(next);
					}, options.hideDelay);
				});
			}, options.typeDelay);
		});
	}
};

function show(text, target, callback) {
	hide();
	dialogInstance = dom.toDOM('<div class="CodeMirror-prompt">\n\t\t<div class="CodeMirror-prompt__title">' + text + '</div>\n\t\t<input type="text" name="prompt" class="CodeMirror-prompt__input" readonly="readonly" />\n\t\t</div>');
	bgInstance = dom.toDOM('<div class="CodeMirror-prompt__shade"></div>');

	target.appendChild(dialogInstance);
	target.appendChild(bgInstance);

	animateShow(dialogInstance, bgInstance, { complete: callback });
}

function hide(callback) {
	if (dialogInstance) {
		if (lastTween) {
			lastTween.stop();
			lastTween = null;
		}
		animateHide(dialogInstance, bgInstance, { complete: callback });
		dialogInstance = bgInstance = null;
	} else if (callback) {
		callback();
	}
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options 
 */
function animateShow(dialog, bg) {
	var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	var cssTransform = (0, _utils.prefixed)('transform');
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var tmpl = (0, _utils.template)(_utils.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

	bgStyle.opacity = 0;
	(0, _tween2.default)({
		duration: 200,
		step: function step(pos) {
			bgStyle.opacity = pos;
		}
	});

	dialogStyle[cssTransform] = tmpl({ pos: -height });

	return lastTween = (0, _tween2.default)({
		duration: 400,
		easing: 'outCubic',
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * (1 - pos) + 'px' });
		},

		complete: function complete() {
			lastTween = null;
			options.complete && options.complete(dialog, bg);
		}
	});
}

/**
 * @param {Element} dialog
 * @param {Element} bg
 * @param {Object} options
 */
function animateHide(dialog, bg, options) {
	var dialogStyle = dialog.style;
	var bgStyle = bg.style;
	var height = dialog.offsetHeight;
	var cssTransform = (0, _utils.prefixed)('transform');
	var tmpl = (0, _utils.template)(_utils.has3d ? 'translate3d(0, <%= pos %>, 0)' : 'translate(0, <%= pos %>)');

	return (0, _tween2.default)({
		duration: 200,
		step: function step(pos) {
			dialogStyle[cssTransform] = tmpl({ pos: -height * pos + 'px' });
			bgStyle.opacity = 1 - pos;
		},
		complete: function complete() {
			dom.remove([dialog, bg]);
			options.complete && options.complete(dialog, bg);
		}
	});
}

function typeText(target, options, timer, next) {
	var chars = options.text.split('');
	timer(function perform() {
		target.value += chars.shift();
		if (chars.length) {
			timer(perform, options.delay);
		} else {
			next();
		}
	}, options.delay);
}

function wrap(key, value) {
	return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? value : _defineProperty({}, key, value);
}