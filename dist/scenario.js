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