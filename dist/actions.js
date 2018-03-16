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