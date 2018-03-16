(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var actions = {
	/**
  * Type-in passed text into current editor char-by-char
  * @param {Object} options Current options
  * @param {CodeMirror} editor Editor instance where action should be 
  * performed
  * @param {Function} next Function to call when action performance
  * is completed
  * @param {Function} timer Function that creates timer for delayed 
  * execution. This timer will automatically delay execution when
  * scenario is paused and revert when played again 
  */
	type: function type(_ref) {
		var options = _ref.options,
		    editor = _ref.editor,
		    next = _ref.next,
		    timer = _ref.timer;

		options = (0, _utils.extend)({
			text: '', // text to type
			delay: 60, // delay between character typing
			pos: null // initial position where to start typing
		}, wrap('text', options));

		if (!options.text) {
			throw new Error('No text provided for "type" action');
		}

		if (options.pos !== null) {
			editor.setCursor((0, _utils.makePos)(options.pos, editor));
		}

		var chars = options.text.split('');

		timer(function perform() {
			var ch = chars.shift();
			editor.replaceSelection(ch, 'end');
			if (chars.length) {
				timer(perform, options.delay);
			} else {
				next();
			}
		}, options.delay);
	},

	/**
  * Wait for a specified timeout
  * @param options
  * @param editor
  * @param next
  * @param timer
  */
	wait: function wait(_ref2) {
		var options = _ref2.options,
		    editor = _ref2.editor,
		    next = _ref2.next,
		    timer = _ref2.timer;

		options = (0, _utils.extend)({
			timeout: 100
		}, wrap('timeout', options));

		timer(next, parseInt(options.timeout, 10));
	},

	/**
  * Move caret to a specified position
  */
	moveTo: function moveTo(_ref3) {
		var options = _ref3.options,
		    editor = _ref3.editor,
		    next = _ref3.next,
		    timer = _ref3.timer;

		options = (0, _utils.extend)({
			delay: 80,
			immediate: false // TODO: remove, use delay: 0 instead
		}, wrap('pos', options));

		if (typeof options.pos === 'undefined') {
			throw new Error('No position specified for "moveTo" action');
		}

		var curPos = (0, _utils.getCursor)(editor);
		// reset selection, if exists
		editor.setSelection(curPos, curPos);
		var targetPos = (0, _utils.makePos)(options.pos, editor);

		if (options.immediate || !options.delay) {
			editor.setCursor(targetPos);
			next();
		}

		var deltaLine = targetPos.line - curPos.line;
		var deltaChar = targetPos.ch - curPos.ch;
		var steps = Math.max(deltaChar, deltaLine);
		// var stepLine = deltaLine / steps;
		// var stepChar = deltaChar / steps;
		var stepLine = deltaLine < 0 ? -1 : 1;
		var stepChar = deltaChar < 0 ? -1 : 1;

		timer(function perform() {
			curPos = (0, _utils.getCursor)(editor);
			if (steps > 0 && !(curPos.line == targetPos.line && curPos.ch == targetPos.ch)) {

				if (curPos.line != targetPos.line) {
					curPos.line += stepLine;
				}

				if (curPos.ch != targetPos.ch) {
					curPos.ch += stepChar;
				}

				editor.setCursor(curPos);
				steps--;
				timer(perform, options.delay);
			} else {
				editor.setCursor(targetPos);
				next();
			}
		}, options.delay);
	},

	/**
  * Similar to "moveTo" function but with immediate cursor position update
  */
	jumpTo: function jumpTo(_ref4) {
		var options = _ref4.options,
		    editor = _ref4.editor,
		    next = _ref4.next,
		    timer = _ref4.timer;

		options = (0, _utils.extend)({
			afterDelay: 200
		}, wrap('pos', options));

		if (typeof options.pos === 'undefined') {
			throw new Error('No position specified for "jumpTo" action');
		}

		editor.setCursor((0, _utils.makePos)(options.pos, editor));
		timer(next, options.afterDelay);
	},

	/**
  * Executes predefined CodeMirror command
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	run: function run(_ref5) {
		var options = _ref5.options,
		    editor = _ref5.editor,
		    next = _ref5.next,
		    timer = _ref5.timer;

		options = (0, _utils.extend)({
			beforeDelay: 500,
			times: 1
		}, wrap('command', options));

		var times = options.times;
		timer(function perform() {
			if (typeof options.command === 'function') {
				options.command(editor, options);
			} else {
				editor.execCommand(options.command);
			}

			if (--times > 0) {
				timer(perform, options.beforeDelay);
			} else {
				next();
			}
		}, options.beforeDelay);
	},

	/**
  * Creates selection for specified position
  * @param {Object} options
  * @param {CodeMirror} editor
  * @param {Function} next
  * @param {Function} timer
  */
	select: function select(_ref6) {
		var options = _ref6.options,
		    editor = _ref6.editor,
		    next = _ref6.next,
		    timer = _ref6.timer;

		options = (0, _utils.extend)({
			from: 'caret'
		}, wrap('to', options));

		var from = (0, _utils.makePos)(options.from, editor);
		var to = (0, _utils.makePos)(options.to, editor);
		editor.setSelection(from, to);
		next();
	}
};

function wrap(key, value) {
	return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? value : _defineProperty({}, key, value);
}

exports.default = actions;

},{"./utils":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.viewportRect = viewportRect;
exports.remove = remove;
exports.toDOM = toDOM;
exports.css = css;

var _utils = require('./utils');

var w3cCSS = document.defaultView && document.defaultView.getComputedStyle;

function viewportRect() {
	var body = document.body;
	var docElem = document.documentElement;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

	return {
		top: scrollTop - clientTop,
		left: scrollLeft - clientLeft,
		width: body.clientWidth || docElem.clientWidth,
		height: body.clientHeight || docElem.clientHeight
	};
}

/**
 * Removes element from parent
 * @param {Element} elem
 * @returns {Element}
 */
function remove(elem) {
	ar(elem).forEach(function (el) {
		return el.parentNode && el.parentNode.removeChild(el);
	});
	return elem;
}

/**
 * Renders string into DOM element
 * @param {String} str
 * @returns {Element}
 */
function toDOM(str) {
	var div = document.createElement('div');
	div.innerHTML = str;
	return div.firstChild;
}

/**
 * Sets or retrieves CSS property value
 * @param {Element} elem
 * @param {String} prop
 * @param {String} val
 */
function css(elem, prop, val) {
	if (typeof prop === 'string' && val == null) {
		return getCSS(elem, prop);
	}

	if (typeof prop === 'string') {
		var obj = {};
		obj[prop] = val;
		prop = obj;
	}

	setCSS(elem, prop);
}

function ar(obj) {
	if (obj.length === +obj.length) {
		return (0, _utils.toArray)(obj);
	}

	return Array.isArray(obj) ? obj : [obj];
}

function toCamelCase(name) {
	return name.replace(/\-(\w)/g, function (str, p1) {
		return p1.toUpperCase();
	});
}

/**
 * Returns CSS property value of given element.
 * @author jQuery Team
 * @param {Element} elem
 * @param {String} name CSS property value
 */
function getCSS(elem, name) {
	var rnumpx = /^-?\d+(?:px)?$/i,
	    rnum = /^-?\d(?:\.\d+)?/,
	    rsuf = /\d$/;

	var nameCamel = toCamelCase(name);
	// If the property exists in style[], then it's been set
	// recently (and is current)
	if (elem.style[nameCamel]) {
		return elem.style[nameCamel];
	}

	if (w3cCSS) {
		var cs = window.getComputedStyle(elem, '');
		return cs.getPropertyValue(name);
	}

	if (elem.currentStyle) {
		var ret = elem.currentStyle[name] || elem.currentStyle[nameCamel];
		var style = elem.style || elem;

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		if (!rnumpx.test(ret) && rnum.test(ret)) {
			// Remember the original values
			var left = style.left,
			    rsLeft = elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			elem.runtimeStyle.left = elem.currentStyle.left;
			var suffix = rsuf.test(ret) ? 'em' : '';
			style.left = nameCamel === 'fontSize' ? '1em' : ret + suffix || 0;
			ret = style.pixelLeft + 'px';

			// Revert the changed values
			style.left = left;
			elem.runtimeStyle.left = rsLeft;
		}

		return ret;
	}
}

/**
 * Sets CSS properties to given element
 * @param {Element} elem
 * @param {Object} params CSS properties to set
 */
function setCSS(elem, params) {
	if (!elem) {
		return;
	}

	var numProps = { 'line-height': 1, 'z-index': 1, opacity: 1 };
	var props = Object.keys(params).map(function (k) {
		var v = params[k];
		var name = k.replace(/([A-Z])/g, '-$1').toLowerCase();
		return name + ':' + (typeof v === 'number' && !(name in numProps) ? v + 'px' : v);
	});

	elem.style.cssText += ';' + props.join(';');
}

},{"./utils":5}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.defaultOptions = undefined;
exports.default = movie;

var _utils = require('./utils');

var _scenario = require('./scenario');

var _scenario2 = _interopRequireDefault(_scenario);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A high-level library interface for creating scenarios over textarea
 * element. The <code>CodeMirror.movie</code> takes reference to textarea
 * element (or its ID) and parses its content for initial content value,
 * scenario.
 */
var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
var mac = ios || /Mac/.test(navigator.platform);

var macCharMap = {
	'ctrl': '⌃',
	'control': '⌃',
	'cmd': '⌘',
	'shift': '⇧',
	'alt': '⌥',
	'enter': '⏎',
	'tab': '⇥',
	'left': '←',
	'right': '→',
	'up': '↑',
	'down': '↓'
};

var pcCharMap = {
	'cmd': 'Ctrl',
	'control': 'Ctrl',
	'ctrl': 'Ctrl',
	'alt': 'Alt',
	'shift': 'Shift',
	'left': '←',
	'right': '→',
	'up': '↑',
	'down': '↓'
};

var defaultOptions = exports.defaultOptions = {
	/**
  * Automatically parse movie definition from textarea content. Setting
  * this property to <code>false</code> assumes that user wants to
  * explicitly provide movie data: initial value, scenario etc.
  */
	parse: true,

	/**
  * String or regexp used to separate sections of movie definition, e.g.
  * default value, scenario and editor options
  */
	sectionSeparator: '@@@',

	/** Regular expression to extract outline from scenario line */
	outlineSeparator: /\s+:::\s+(.+)$/,

	/** Automatically prettify keyboard shortcuts in outline */
	prettifyKeys: true,

	/** Strip parentheses from prettyfied keyboard shortcut definition */
	stripParentheses: false
};

/**
 * High-level function to create movie instance on textarea.
 * @param {CodeMirror}
 * @param {Element} target Reference to textarea, either <code>Element</code>
 * or string ID. It can also accept existing CodeMirror object.
 * @param {Object} movieOptions Movie options. See <code>defaultOptions</code>
 * for value reference
 * @param {Object} editorOptions Additional options passed to CodeMirror
 * editor initializer.
 */
function movie(CodeMirrorEditor, target) {
	var movieOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	var editorOptions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

	setupCodeMirror(CodeMirrorEditor);

	if (typeof target === 'string') {
		target = document.getElementById(target);
	}

	var targetIsTextarea = target.nodeName && target.nodeName.toLowerCase() === 'textarea';

	movieOptions = (0, _utils.extend)({}, defaultOptions, movieOptions);
	editorOptions = (0, _utils.extend)({
		theme: 'espresso',
		mode: 'text/html',
		indentWithTabs: true,
		tabSize: 4,
		lineNumbers: true,
		preventCursorMovement: true
	}, editorOptions);

	var initialValue = editorOptions.value || (targetIsTextarea ? target.value : target.getValue()) || '';

	if (movieOptions.parse) {
		(0, _utils.extend)(movieOptions, parseMovieDefinition(initialValue, movieOptions));
		initialValue = movieOptions.value;
		if (movieOptions.editorOptions) {
			(0, _utils.extend)(editorOptions, movieOptions.editorOptions);
		}

		if (targetIsTextarea) {
			// read CM options from given textarea
			var cmAttr = /^data\-cm\-(.+)$/i;
			(0, _utils.toArray)(target.attributes).forEach(function (attr) {
				var m = attr.name.match(cmAttr);
				if (m) {
					editorOptions[m[1]] = attr.value;
				}
			});
		}
	}

	// normalize line endings
	initialValue = initialValue.replace(/\r?\n/g, '\n');

	// locate initial caret position from | symbol
	var initialPos = initialValue.indexOf('|');

	if (targetIsTextarea) {
		target.value = editorOptions.value = initialValue = initialValue.replace(/\|/g, '');
	}

	// create editor instance if needed
	var editor = targetIsTextarea ? CodeMirrorEditor.fromTextArea(target, editorOptions) : target;

	if (!targetIsTextarea) {
		editor.setValue(initialValue.replace(/\|/g, ''));
	}

	if (initialPos !== -1) {
		editor.setCursor(editor.posFromIndex(initialPos));
	}

	// save initial data so we can revert to it later
	editor.__initial = {
		content: initialValue,
		pos: editor.getCursor(true)
	};

	var wrapper = editor.getWrapperElement();

	// adjust height, if required
	if (editorOptions.height) {
		wrapper.style.height = editorOptions.height + 'px';
	}

	wrapper.className += ' CodeMirror-movie';

	var sc = new _scenario2.default(movieOptions.scenario, editor);
	return sc;
};

/**
 * Prettyfies key bindings references in given string: formats it according
 * to current user’s platform. The key binding should be defined inside 
 * parentheses, e.g. <code>(ctrl-alt-up)</code>
 * @param {String} str
 * @param {Object} options Transform options
 * @returns {String}
 */
function prettifyKeyBindings(str, options) {
	options = options || {};
	var reKey = /ctrl|alt|shift|cmd/i;
	var map = mac ? macCharMap : pcCharMap;
	return str.replace(/\((.+?)\)/g, function (m, kb) {
		if (reKey.test(kb)) {
			var parts = kb.toLowerCase().split(/[\-\+]/).map(function (key) {
				return map[key.toLowerCase()] || key.toUpperCase();
			});

			m = parts.join(mac ? '' : '+');
			if (!options.stripParentheses) {
				m = '(' + m + ')';
			}
		}

		return m;
	});
}

function readLines(text) {
	// IE fails to split string by regexp, 
	// need to normalize newlines first
	var nl = '\n';
	var lines = (text || '').replace(/\r\n/g, nl).replace(/\n\r/g, nl).replace(/\r/g, nl).split(nl);

	return lines.filter(Boolean);
}

function unescape(text) {
	var replacements = {
		'&lt;': '<',
		'&gt;': '>',
		'&amp;': '&'
	};

	return text.replace(/&(lt|gt|amp);/g, function (str, p1) {
		return replacements[str] || str;
	});
}

/**
 * Extracts initial content and scenario from given string
 * @param {String} text
 * @param {Object} options
 */
function parseMovieDefinition(text) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	options = (0, _utils.extend)({}, defaultOptions, options || {});
	var parts = text.split(options.sectionSeparator);

	// parse scenario
	var reDef = /^(\w+)\s*:\s*(.+)$/;
	var scenario = [];
	var editorOptions = {};

	var skipComment = function skipComment(line) {
		return line.charAt(0) !== '#';
	};

	// read movie definition
	readLines(parts[1]).filter(skipComment).forEach(function (line) {
		// do we have outline definition here?
		line = line.replace(options.outlineSeparator, '');

		var sd = line.match(reDef);
		if (!sd) {
			return scenario.push(line.trim());
		}

		if (sd[2].charAt(0) === '{') {
			var obj = {};
			obj[sd[1]] = (0, _utils.parseJSON)(unescape(sd[2]));
			return scenario.push(obj);
		}

		scenario.push(sd[1] + ':' + unescape(sd[2]));
	});

	// read editor options
	if (parts[2]) {
		readLines(parts[2]).filter(skipComment).forEach(function (line) {
			var sd = line.match(reDef);
			if (sd) {
				editorOptions[sd[1]] = sd[2];
			}
		});
	}

	return {
		value: unescape(parts[0].trim()),
		scenario: scenario,
		editorOptions: editorOptions
	};
}

function setupCodeMirror(CodeMirrorEditor) {
	if ('preventCursorMovement' in CodeMirrorEditor.defaults) {
		return;
	}

	CodeMirrorEditor.defineOption('preventCursorMovement', false, function (cm) {
		var handler = function handler(cm, event) {
			return cm.getOption('readOnly') && event.preventDefault();
		};
		cm.on('keydown', handler);
		cm.on('mousedown', handler);
	});
}

},{"./scenario":4,"./utils":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.defaultOptions = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _prompt = require('./widgets/prompt');

var _tooltip = require('./widgets/tooltip');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var actionsDefinition = (0, _utils.extend)({}, _actions2.default, _prompt.actions, _tooltip.actions);

var STATE_IDLE = 'idle';
var STATE_PLAY = 'play';
var STATE_PAUSE = 'pause';

// Regular expression used to split event strings
var eventSplitter = /\s+/;

var defaultOptions = exports.defaultOptions = {
	beforeDelay: 1000,
	afterDelay: 1000
};

/**
 * @param {Object} actions Actions scenario
 * @param {Object} data Initial content (<code>String</code>) or editor
 * instance (<code>CodeMirror</code>)
 */

var Scenario = function () {
	function Scenario(actions, data) {
		_classCallCheck(this, Scenario);

		this._actions = actions;
		this._editor = null;
		this._state = STATE_IDLE;
		this._timerQueue = [];

		if (data && 'getValue' in data) {
			this._editor = data;
		}

		var ed = this._editor;
		if (ed && !ed.__initial) {
			ed.__initial = {
				content: ed.getValue(),
				pos: ed.getCursor(true)
			};
		}
	}

	_createClass(Scenario, [{
		key: '_setup',
		value: function _setup(editor) {
			if (!editor && this._editor) {
				editor = this._editor;
			}

			editor.execCommand('revert');
			return editor;
		}

		/**
   * Play current scenario
   * @param {CodeMirror} editor Editor instance where on which scenario 
   * should be played
   * @memberOf Scenario
   */

	}, {
		key: 'play',
		value: function play(editor) {
			var _this = this;

			if (this._state === STATE_PLAY) {
				// already playing
				return;
			}

			if (this._state === STATE_PAUSE) {
				// revert from paused state
				editor = editor || this._editor;
				editor.focus();
				var timerObj = null;
				while (timerObj = this._timerQueue.shift()) {
					_requestTimer(timerObj.fn, timerObj.delay);
				}

				this._state = STATE_PLAY;
				this.trigger('resume');
				return;
			}

			this._editor = editor = this._setup(editor);
			editor.focus();

			var timer = this.requestTimer.bind(this);

			var gotoAction = function gotoAction(actionIx) {
				if (actionIx >= _this._actions.length) {
					return timer(function () {
						_this.stop();
					}, defaultOptions.afterDelay);
				}

				_this.trigger('action', actionIx);

				var action = parseActionCall(_this._actions[actionIx]);

				var prev = null;
				for (var i = actionIx - 1; i >= 0; i--) {
					var oneAction = parseActionCall(_this._actions[i]);
					if (oneAction.name === 'tooltip' || oneAction.name === 'showTooltip') {
						prev = function prev() {
							return gotoAction(actionIx - 1);
						};
						break;
					}
				}

				var next = null;
				for (var _i = actionIx + 1; _i < _this._actions.length; _i++) {
					var _oneAction = parseActionCall(_this._actions[_i]);
					if (_oneAction.name === 'tooltip' || _oneAction.name === 'showTooltip') {
						next = function next() {
							return gotoAction(actionIx + 1);
						};
					}
				}

				if (action.name in actionsDefinition) {
					actionsDefinition[action.name]({
						options: action.options,
						editor: editor,
						next: next,
						stop: function stop() {
							return _this.stop();
						},
						prev: prev,
						timer: timer
					});
				} else {
					throw new Error('No such action: ' + action.name);
				}
			};

			this._state = STATE_PLAY;
			this._editor.setOption('readOnly', true);
			this.trigger('play');
			timer(function () {
				return gotoAction(0);
			}, defaultOptions.beforeDelay);
		}

		/**
   * Pause current scenario playback. It can be restored with 
   * <code>play()</code> method call 
   */

	}, {
		key: 'pause',
		value: function pause() {
			this._state = STATE_PAUSE;
			this.trigger('pause');
		}

		/**
   * Stops playback of current scenario
   */

	}, {
		key: 'stop',
		value: function stop() {
			if (this._state !== STATE_IDLE) {
				this._state = STATE_IDLE;
				this._timerQueue.length = 0;
				this._editor.setOption('readOnly', false);
				this.trigger('stop');
			}
		}

		/**
   * Returns current playback state
   * @return {String}
   */

	}, {
		key: 'toggle',


		/**
   * Toggle playback of movie scenario
   */
		value: function toggle() {
			if (this._state === STATE_PLAY) {
				this.pause();
			} else {
				this.play();
			}
		}
	}, {
		key: 'requestTimer',
		value: function requestTimer(fn, delay) {
			if (this._state !== STATE_PLAY) {
				// save function call into a queue till next 'play()' call
				this._timerQueue.push({
					fn: fn,
					delay: delay
				});
			} else {
				return _requestTimer(fn, delay);
			}
		}

		// borrowed from Backbone
		/**
   * Bind one or more space separated events, `events`, to a `callback`
   * function. Passing `"all"` will bind the callback to all events fired.
   * @param {String} events
   * @param {Function} callback
   * @param {Object} context
   * @memberOf eventDispatcher
   */

	}, {
		key: 'on',
		value: function on(events, callback, context) {
			var calls, event, node, tail, list;
			if (!callback) {
				return this;
			}

			events = events.split(eventSplitter);
			calls = this._callbacks || (this._callbacks = {});

			// Create an immutable callback list, allowing traversal during
			// modification.  The tail is an empty object that will always be used
			// as the next node.
			while (event = events.shift()) {
				list = calls[event];
				node = list ? list.tail : {};
				node.next = tail = {};
				node.context = context;
				node.callback = callback;
				calls[event] = {
					tail: tail,
					next: list ? list.next : node
				};
			}

			return this;
		}

		/**
   * Remove one or many callbacks. If `context` is null, removes all
   * callbacks with that function. If `callback` is null, removes all
   * callbacks for the event. If `events` is null, removes all bound
   * callbacks for all events.
   * @param {String} events
   * @param {Function} callback
   * @param {Object} context
   */

	}, {
		key: 'off',
		value: function off(events, callback, context) {
			var event, calls, node, tail, cb, ctx;

			// No events, or removing *all* events.
			if (!(calls = this._callbacks)) {
				return;
			}

			if (!(events || callback || context)) {
				delete this._callbacks;
				return this;
			}

			// Loop through the listed events and contexts, splicing them out of the
			// linked list of callbacks if appropriate.
			events = events ? events.split(eventSplitter) : Object.keys(calls);
			while (event = events.shift()) {
				node = calls[event];
				delete calls[event];
				if (!node || !(callback || context)) {
					continue;
				}

				// Create a new list, omitting the indicated callbacks.
				tail = node.tail;
				while ((node = node.next) !== tail) {
					cb = node.callback;
					ctx = node.context;
					if (callback && cb !== callback || context && ctx !== context) {
						this.on(event, cb, ctx);
					}
				}
			}

			return this;
		}

		/**
   * Trigger one or many events, firing all bound callbacks. Callbacks are
   * passed the same arguments as `trigger` is, apart from the event name
   * (unless you're listening on `"all"`, which will cause your callback
   * to receive the true name of the event as the first argument).
   * @param {String} events
   */

	}, {
		key: 'trigger',
		value: function trigger(events) {
			var event, node, calls, tail, args, all;
			if (!(calls = this._callbacks)) {
				return this;
			}

			all = calls.all;
			events = events.split(eventSplitter);

			// For each event, walk through the linked list of callbacks twice,
			// first to trigger the event, then to trigger any `"all"` callbacks.

			for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				rest[_key - 1] = arguments[_key];
			}

			while (event = events.shift()) {
				if (node = calls[event]) {
					tail = node.tail;
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, rest);
					}
				}
				if (node = all) {
					tail = node.tail;
					args = [event].concat(rest);
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, args);
					}
				}
			}

			return this;
		}
	}, {
		key: 'state',
		get: function get() {
			return this._state;
		}
	}]);

	return Scenario;
}();

exports.default = Scenario;
;

/**
 * Parses action call from string
 * @param {String} data
 * @returns {Object}
 */
function parseActionCall(data) {
	if (typeof data === 'string') {
		var parts = data.split(':');
		return {
			name: parts.shift(),
			options: parts.join(':')
		};
	} else {
		var name = Object.keys(data)[0];
		return {
			name: name,
			options: data[name]
		};
	}
}

function _requestTimer(fn, delay) {
	if (!delay) {
		fn();
	} else {
		return setTimeout(fn, delay);
	}
}

},{"./actions":1,"./utils":5,"./widgets/prompt":7,"./widgets/tooltip":8}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = tween;
exports.defaults = defaults;
exports._all = _all;
exports.stop = stop;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var global = window;
var time = Date.now ? function () {
	return Date.now();
} : function () {
	return +new Date();
};

var indexOf = 'indexOf' in Array.prototype ? function (array, value) {
	return array.indexOf(value);
} : function (array, value) {
	for (var i = 0, il = array.length; i < il; i++) {
		if (array[i] === value) {
			return i;
		}
	}

	return -1;
};

function extend(obj) {
	for (var i = 1, il = arguments.length, source; i < il; i++) {
		source = arguments[i];
		if (source) {
			for (var prop in source) {
				obj[prop] = source[prop];
			}
		}
	}

	return obj;
}

/**
 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 */
(function () {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
		global.requestAnimationFrame = global[vendors[x] + 'RequestAnimationFrame'];
		global.cancelAnimationFrame = global[vendors[x] + 'CancelAnimationFrame'] || global[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!global.requestAnimationFrame) global.requestAnimationFrame = function (callback, element) {
		var currTime = time();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = global.setTimeout(function () {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	if (!global.cancelAnimationFrame) global.cancelAnimationFrame = function (id) {
		clearTimeout(id);
	};
})();

var dummyFn = function dummyFn() {};
var anims = [];
var idCounter = 0;

var defaults = {
	duration: 500, // ms
	delay: 0,
	easing: 'linear',
	start: dummyFn,
	step: dummyFn,
	complete: dummyFn,
	autostart: true,
	reverse: false
};

var easings = exports.easings = {
	linear: function linear(t, b, c, d) {
		return c * t / d + b;
	},
	inQuad: function inQuad(t, b, c, d) {
		return c * (t /= d) * t + b;
	},
	outQuad: function outQuad(t, b, c, d) {
		return -c * (t /= d) * (t - 2) + b;
	},
	inOutQuad: function inOutQuad(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t + b;
		return -c / 2 * (--t * (t - 2) - 1) + b;
	},
	inCubic: function inCubic(t, b, c, d) {
		return c * (t /= d) * t * t + b;
	},
	outCubic: function outCubic(t, b, c, d) {
		return c * ((t = t / d - 1) * t * t + 1) + b;
	},
	inOutCubic: function inOutCubic(t, b, c, d) {
		if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
		return c / 2 * ((t -= 2) * t * t + 2) + b;
	},
	inExpo: function inExpo(t, b, c, d) {
		return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b - c * 0.001;
	},
	outExpo: function outExpo(t, b, c, d) {
		return t == d ? b + c : c * 1.001 * (-Math.pow(2, -10 * t / d) + 1) + b;
	},
	inOutExpo: function inOutExpo(t, b, c, d) {
		if (t == 0) return b;
		if (t == d) return b + c;
		if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b - c * 0.0005;
		return c / 2 * 1.0005 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	inElastic: function inElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	},
	outElastic: function outElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
	},
	inOutElastic: function inOutElastic(t, b, c, d, a, p) {
		var s;
		if (t == 0) return b;
		if ((t /= d / 2) == 2) return b + c;
		if (!p) p = d * (.3 * 1.5);
		if (!a || a < Math.abs(c)) {
			a = c;s = p / 4;
		} else s = p / (2 * Math.PI) * Math.asin(c / a);
		if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
	},
	inBack: function inBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * (t /= d) * t * ((s + 1) * t - s) + b;
	},
	outBack: function outBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	},
	inOutBack: function inOutBack(t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
		return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
	},
	inBounce: function inBounce(t, b, c, d) {
		return c - this.outBounce(t, d - t, 0, c, d) + b;
	},
	outBounce: function outBounce(t, b, c, d) {
		if ((t /= d) < 1 / 2.75) {
			return c * (7.5625 * t * t) + b;
		} else if (t < 2 / 2.75) {
			return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
		} else if (t < 2.5 / 2.75) {
			return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
		} else {
			return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
		}
	},
	inOutBounce: function inOutBounce(t, b, c, d) {
		if (t < d / 2) return this.inBounce(t * 2, 0, c, d) * .5 + b;
		return this.outBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
	},
	outHard: function outHard(t, b, c, d) {
		var ts = (t /= d) * t;
		var tc = ts * t;
		return b + c * (1.75 * tc * ts + -7.4475 * ts * ts + 12.995 * tc + -11.595 * ts + 5.2975 * t);
	}
};

function mainLoop() {
	if (!anims.length) {
		// no animations left, stop polling
		return;
	}

	var now = time();
	var filtered = [],
	    tween,
	    opt;

	// do not use Array.filter() of _.filter() function
	// since tween’s callbacks can add new animations
	// in runtime. In this case, filter function will loose
	// newly created animation
	for (var i = 0; i < anims.length; i++) {
		tween = anims[i];

		if (!tween.animating) {
			continue;
		}

		opt = tween.options;

		if (tween.startTime > now) {
			filtered.push(tween);
			continue;
		}

		if (tween.infinite) {
			// opt.step.call(tween, 0);
			opt.step(0, tween);
			filtered.push(tween);
		} else if (tween.pos === 1 || tween.endTime <= now) {
			tween.pos = 1;
			// opt.step.call(tween, opt.reverse ? 0 : 1);
			opt.step(opt.reverse ? 0 : 1, tween);
			tween.stop();
		} else {
			tween.pos = opt.easing(now - tween.startTime, 0, 1, opt.duration);
			// opt.step.call(tween, opt.reverse ? 1 - tween.pos : tween.pos);
			opt.step(opt.reverse ? 1 - tween.pos : tween.pos, tween);
			filtered.push(tween);
		}
	}

	anims = filtered;

	if (anims.length) {
		requestAnimationFrame(mainLoop);
	}
}

function addToQueue(tween) {
	if (indexOf(anims, tween) == -1) {
		anims.push(tween);
		if (anims.length == 1) {
			mainLoop();
		}
	}
}

var Tween = exports.Tween = function () {
	function Tween(options) {
		_classCallCheck(this, Tween);

		this.options = extend({}, defaults, options);

		var e = this.options.easing;
		if (typeof e == 'string') {
			if (!easings[e]) throw 'Unknown "' + e + '" easing function';
			this.options.easing = easings[e];
		}

		if (typeof this.options.easing != 'function') throw 'Easing should be a function';

		this._id = 'tw' + idCounter++;

		if (this.options.autostart) {
			this.start();
		}
	}

	/**
  * Start animation from the beginning
  */


	_createClass(Tween, [{
		key: 'start',
		value: function start() {
			if (!this.animating) {
				this.pos = 0;
				this.startTime = time() + (this.options.delay || 0);
				this.infinite = this.options.duration === 'infinite';
				this.endTime = this.infinite ? 0 : this.startTime + this.options.duration;
				this.animating = true;
				this.options.start(this);
				addToQueue(this);
			}

			return this;
		}

		/**
   * Stop animation
   */

	}, {
		key: 'stop',
		value: function stop() {
			if (this.animating) {
				this.animating = false;
				if (this.options.complete) {
					this.options.complete(this);
				}
			}
			return this;
		}
	}, {
		key: 'toggle',
		value: function toggle() {
			if (this.animating) {
				this.stop();
			} else {
				this.start();
			}
		}
	}]);

	return Tween;
}();

function tween(options) {
	return new Tween(options);
}

/**
 * Get or set default value
 * @param  {String} name
 * @param  {Object} value
 * @return {Object}
 */
function defaults(name, value) {
	if (typeof value != 'undefined') {
		defaults[name] = value;
	}

	return defaults[name];
}

/**
 * Returns all active animation objects.
 * For debugging mostly
 * @return {Array}
 */
function _all() {
	return anims;
}

function stop() {
	for (var i = 0; i < anims.length; i++) {
		anims[i].stop();
	}

	anims.length = 0;
};

},{}],7:[function(require,module,exports){
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

},{"../dom":2,"../utils":5,"../vendor/tween":6}],8:[function(require,module,exports){
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
	showTooltip: function showTooltip(_ref2) {
		var options = _ref2.options,
		    editor = _ref2.editor,
		    prev = _ref2.prev,
		    next = _ref2.next,
		    timer = _ref2.timer;

		options = (0, _utils.extend)({
			pos: 'caret' // position where tooltip should point to
		}, wrap('text', options));

		show({ text: options.text, prev: prev, next: next }, resolvePosition(options.pos, editor));
		next();
	},


	/**
  * Hides tooltip, previously shown by 'showTooltip' action
  */
	hideTooltip: function hideTooltip(_ref3) {
		var options = _ref3.options,
		    editor = _ref3.editor,
		    next = _ref3.next,
		    timer = _ref3.timer;

		hide(next);
	}
};

function show(_ref4, pos, callback) {
	var text = _ref4.text,
	    prev = _ref4.prev,
	    next = _ref4.next;

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

},{"../dom":2,"../utils":5,"../vendor/tween":6}]},{},[3])

//# sourceMappingURL=movie.js.map
