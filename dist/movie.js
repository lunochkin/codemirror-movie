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