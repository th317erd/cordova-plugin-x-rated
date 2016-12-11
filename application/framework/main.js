(function(factory) {
	module.exports = factory();
})(function() {
	function initDust(D, dust) {
		function testRequiredAttributes() {
			for(var i = 0, il = arguments.length; i < il; i++) {
				var k = arguments[i],
						v = this[k];

				if (D.utils.noe(v))
					throw new Error(k + ' required');
			}
		}

	  function unwrapContext(context) {
	  	var objs = [],
	  			stack = context.stack;
	  	
	  	while(stack) {
	  		if (!stack.head)
	  			break;

	  		objs.push(stack.head);

	  		stack = stack.tail;
	  	}

	  	objs.reverse();
	  	objs.unshift({});

	  	return D.data.extend.apply(D.data.extend, objs);
	  }

		D.data.extend(dust.filters, {
			'T': function() {
				return '<div>DERP</div>';
			},
			//No foreign objects
			'X': function(value) {
				if (typeof value === 'string' || value instanceof String)
					return value.replace(/<\s*(script|object|iframe|frame|embed)[^>]*>.*?<\s*\/\1[^>]*>/ig,'');
				return value;
			},
			//No scripts, no frames
			'S': function(value) {
				if (typeof value === 'string' || value instanceof String)
					return value.replace(/<\s*(script|iframe|frame)[^>]*>.*?<\s*\/\1[^>]*>/ig,'');
				return value;
			},
			'q': function(value) {
				if (typeof value === 'string' || value instanceof String)
					return value.replace(/(['"])/g,'\\$1');
				return value;
			}
		});

		D.data.extend(dust.helpers, {
			'config': function(chunk, context, bodies, params) {
				testRequiredAttributes.call(params, 'key');
				
				var body = bodies.block,
						key = context.resolve(params['key']),
						config = global.config;

				var data = D.get(config, key),
						lastPart;

				key.replace(/([^.]+)$/, function(match, p1) {
					lastPart = p1;
				});

				var obj = {};
				obj[lastPart] = data;

				return chunk.render(body, context.push(obj));
			},
			'loop': function(chunk, context, bodies, params) {
				function getLoopContext(context, key, val) {
					var loopContext = {};
					if (index)
						loopContext[index] = key;

					if (value)
						loopContext[value] = val;

					return context.push(loopContext);
				}

				var items, scopeContext;
				var range = {start: 0, end: 0, step: 1};

				if (D.utils.noe(params.items)) {
					testRequiredAttributes.call(params, 'start', 'end');

					var loopKeys = ['start','end','step'];
					for (var i = 0, il = loopKeys.length; i < il; i++) {
						var v = loopKeys[i],
								val = params[v];

						if (D.utils.noe(val))
							continue;

						if (('' + val).match(/\D/))
							val = context.get(val);
						else
							val = parseFloat(val);

						if (isNaN(val))
							throw new Error('Invalid value for [' + v + ']: ' + val);

						range[v] = val;
					}
				} else if (!D.utils.noe(params.items)) {
					testRequiredAttributes.call(params, 'value');

					if (params.items === '.') {
						items = unwrapContext(context);
					} else {
						items = context.get(context.resolve(params.items));
					}
					
					if (D.utils.noe(items))
						return chunk;
				}

				var index = params.key;
				var value = params.value;
				var fragments = [];

				if (items) {
					var keys = Object.keys(items),
							keyFilter;

					if (!D.utils.noe(params.keyFilter)) {
						keyFilter = context.resolve(params.keyFilter);
						if (keyFilter) {
							var flags = "";
							keyFilter = keyFilter.replace(/^\/(.*)\/(\w+)?/, function(m, re, args) {
								if (args)
									flags = args;
								return re;
							});

							keyFilter = new RegExp(keyFilter, flags);
						}
					}

					for (var i = 0, il = keys.length; i < il; i++) {
						var k = keys[i],
								v = items[k];

						if (keyFilter && !keyFilter.test(k))
							continue;

						var scopeContext = getLoopContext(context, k, v);
						chunk = chunk.map(function(chunk) {
							chunk.render(bodies.block, scopeContext).end();
						});

						if (scopeContext.get('_break'))
							break;
					}
				} else {
					var reverse = (range.start > range.end);

					if (range.step === 0)
						range.step = 1;

					if (reverse && range.step > 0)
						range.step *= -1;

					for (var i = range.start, end = range.end, step = range.step;; i += step) {
						if (reverse && i < end)
							break;

						else if (!reverse && i > end)
							break;

						var scopeContext = getLoopContext(context, i, i);
						chunk = chunk.map(function(chunk) {
							chunk.render(bodies.block, scopeContext).end();
						});

						if (scopeContext.get('_break'))
							break;
					}
				}

				return chunk;
			},
			'break': function(chunk, context, bodies, params) {
		  	context.stack.head._break = true;
				return chunk.end();
			},
			'noe': function(chunk, context, bodies, params) {
				var body = bodies.block,
    				skip = bodies['else'];

				testRequiredAttributes.call(params, 'key');

				var val = context.get(context.resolve(params['key']));
				
				if (D.utils.noe(val))
					return chunk.render(body, context);
				else if (skip)
					return chunk.render(skip, context);

				return chunk;
			},
			'value': function(chunk, context, bodies, params, extraData, formatterFunc) {
				function convertDefaultValue(val) {
					if (('' + val).match(/^(true|false)$/i))
						return ('' + val).match(/^true$/i);

					if (('' + val).match(/^[\de.-]$/i)) {
						var num = parseFloat(val);
						if (!isNaN(num) && isFinite(num))
							return num;
					}

					return val;
				}

				testRequiredAttributes.call(params, 'key');

				var formatter, formatterArgs = Object.create(context);
				if (!D.utils.noe(params.formatter))
					formatter = D.data.formatterFunction(context.resolve(params['formatter']));
				else
					formatter = D.data.formatterFunction(formatterFunc);

				var keys = Object.keys(params);
				for (var i = 0, il = keys.length; i < il; i++) {
					var k = keys[i],
							v = params[k];

					if (k === 'formatter' || k === 'default' || k === 'key')
						continue;

					formatterArgs[k] = context.resolve(params[k]);
				}

				var defaultValue = '';
				if (!D.utils.noe(params['default']))
					defaultValue = convertDefaultValue(context.resolve(params['default']));

				var val = context.get(context.resolve(params['key']));
				
				if (D.utils.noe(val))
					val = defaultValue;
				
				if (formatter)
					val = formatter(val, 'format', D.data.extend(formatterArgs, extraData));

				return chunk.write(val);
			}
		});
	}

	function initAppFormatters(D) {
		D.data.extend(D.data.formatters, {
			state: function(val, op, args) {
				function findState(_val) {
					var val = _val,
							stateList = config.data.states;

					if (!stateList)
						return {name: val, code: val};

					val = val.toUpperCase();
					for (var i = 0, il = stateList.length; i < il; i++) {
						var state = stateList[i],
								name = state.name,
								code = state.code;

						if (name.toUpperCase() === val || code.toUpperCase() === val)
							return state;
					}

					return {name: val, code: val};
				}

				if (op === 'format') {
					if (args.code)
						return findState(val).code;
					return findState(val).name;
				}

				return val;
			}
		});
	}

	if (typeof jQuery !== 'undefined') {
		(function($) {
			function startApp() {
				var D = global.D = require('devoir'),
						dust = global.dust = require('dustjs-linkedin'),
						dustH = require('dustjs-helpers');
				
				initDust(D, dust);
				initAppFormatters(D);

				var moment = global.moment = require('moment'),
						ct = require('compiledTemplates')(), //Compiled widget templates
						w = global.Widget = require('./widgets')(D, $),
						baseApp = require('./baseApp')(D, $, w),
						app = global.App = require('./app')(D, $, baseApp),
						API = global.API = require('./api')(D, $),
						config = require('./config')();

				global.LZString = require('lz-string');
				App.storage = new (require('./storage')(D))({compression: true});

				global.config = app.config = config;
				if (config.hasOwnProperty('fakeAPIData'))
					global.fakeAPIData = config.fakeAPIData;

				var oldPassValidator = D.data.validators['password'];
				D.data.validators['password'] = function(val, op, args) {
					if (oldPassValidator instanceof Function) {
						var ret = oldPassValidator.apply(this, arguments);
						if (ret)
							return ret;
					}

					if (args.match) {
						var $parent = this.element.closest('.xr-form');
						if ($parent.length === 0)
							$parent = $('body');

						var $match = $parent.find('.xr-input[xr-name="' + args.match + '"]'),
								otherVal = $match._W().value();

						if (val !== otherVal)
							return ['error', 'Passwords don\'t match'];
					}
				};
				
				app.init();
				$('.xr-app').removeClass('xr-loading');

				if (global.debug)
					global.config.baseURL = "/api";
			}

			var isIOS = global.isIOS = navigator.userAgent.match(/(iPhone|iPod|iPad|iOS)/);
			var isAndroid = global.isAndroid = navigator.userAgent.match(/Android/);

			global.isMobile = (isIOS || isAndroid || navigator.userAgent.match(/(BlackBerry)/));
			global.isMobileApp = (!~document.URL.indexOf('http://') && !~document.URL.indexOf( 'https://'));

			if (!global.isMobileApp)
				global.debug = true;

			$(document).bind('mobileinit', function() {
				$.event.special.tap.tapholdThreshold = 1000;
				$.event.special.swipe.durationThreshold = 999;
			});

			if (isMobile){
				document.addEventListener('deviceready', function() {
					$('body').addClass('platform' + (isIOS ? 'IOS' : 'Android'));
					startApp();
				}, false);
			} else {
				$(document).ready(startApp); // no mobile
			}
		})(jQuery);
	}

	return {
		init: function(D, dust) {
			initDust(D, dust);
			initAppFormatters(D);
		}
	};
});