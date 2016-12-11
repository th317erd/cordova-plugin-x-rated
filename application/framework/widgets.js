(function(factory) {
	module.exports = function(D, $) {
		return factory(D, $);
	};
})(function(D, $) {
	var Widget = D.newClass(function(S) {
		this.extend({
			_instantiate: function() {
			},
			_setOption: function(key, value) {
			},
			_create: function() {
			},
			_destroy: function() {
			}
		});

		return function Widget(elem, _opts) {
			S.constructor.apply(this, arguments);

			function initOptions(opts) {
				var options = {},
						shadow = {},
						keys = Object.keys(opts),
						self = this;

				D.setROProperty(this, 'options', options);

				for (var i = 0, il = keys.length; i < il; i++) {
					(function(key) {
						function setter(val) {
							if (!setter.locked && optFunc instanceof Function) {
								setter.locked = true;
								shadow[key] = val;
								var ret = optFunc.call(self, val);
								setter.locked = false;
							}

							return val;
						}

						function getter() {
							if (!getter.locked && optFunc instanceof Function) {
								getter.locked = true;
								var ret = optFunc.call(self);
								getter.locked = false;
								return ret;
							}

							return shadow[key];
						}

						var optFunc = this['_option_' + key];
						shadow[key] = opts[key];

						D.setROProperty(options, key, null, setter, getter);
					})(keys[i]);
				}
			}

			var self = this,
					opts = _opts || {};

			this.uid = D.id(this);
			this.element = $(elem);

			this.element.attr({
				'id': this.uid,
				'data-xr-widget': this.widgetName
			});

			this.element.data('xr-widget-instance', this);
			this.element.addClass('xr-widget');

			initOptions.call(this, opts);

			this._instantiate();
			process.nextTick(function() {
				self._create();	
			});
		};
	});

	Widget.create = function(_name, _parent, _konstructor) {
		var name = _name,
				parent = _parent,
				konstructor = _konstructor;

		if (arguments.length === 2) {
			konstructor = parent;
			parent = Widget;
		} else if (arguments.length > 2) {
			if (typeof parent === 'string' || parent instanceof String)
				parent = require('widget.' + parent);
		}

		if (!(parent instanceof Function))
			parent = Widget;

		var klass = D.newClass(konstructor, parent, function() {
			if (!this.hasOwnProperty('widgetName'))
				D.setROProperty(this, 'widgetName', name);

			this.element.addClass('xr-widget-' + name);
		});

		var S = parent.prototype,
				proto = klass.prototype;

		proto.extend({
			_instantiate: function() {
				S._instantiate.apply(this, arguments);
				this.element.addClass('xr-' + name);
			}
		});

		if (!(proto['_create'] instanceof Function)) {
			proto.extend({
				_create: function() {
					S._create.apply(this, arguments);
				}
			});
		}

		if (!(proto['_destroy'] instanceof Function)) {
			proto.extend({
				_destroy: function() {
					S._destroy.apply(this, arguments);
				}
			});
		}

		return klass;
	};

	Widget.bindActions = function bindActions(widget, $elem) {
		var self = widget;

		if (!self) {
			var parent = Widget.getParentWidget($elem);
			if (parent)
				self = parent.widget;
		}

		if (!self)
			return;

		var $actionElems = $elem.find('*').add($elem).filter(function() {
			var $elem = $(this),
					elem = $elem.get(0);

			if (!elem || elem.nodeType !== 1)
				return true;

			if (elem.hasAttributes()) {
				var attrs = elem.attributes;
       
				for(var i = attrs.length - 1; i >= 0; i--) {
					if (attrs[i].name.match(/^xr-action/))
						return true;
				}
			}

			return false;
		});

		$actionElems.each(function() {
			var elem = this;
			if (!elem || elem.nodeType !== 1)
				return true;
     	
     	var attrs = elem.attributes,
     			thisSelf = self;

     	if (elem !== $elem.get(0)) {
     		var parent = Widget.getParentWidget($(elem));

	     	if (parent)
	     		thisSelf = parent.widget;
     	}

			for(var i = attrs.length - 1; i >= 0; i--) {
				var attr = attrs[i],
						parts = attr.name.match(/^xr-action-(.*)/);

				if (parts && parts[1]) {
					(function(eventName, actionName, $elem) {
						$elem.off(eventName + '.xr-auto-binding').on(eventName + '.xr-auto-binding', function(e) {
							function fireAction(e) {
								var actionFunc = this['action_' + actionName];
								if (actionFunc instanceof Function)
									actionFunc.call(this, e, $elem);
								else if (this.parent)
									fireAction.call(this.parent, e);			
							}

							e.stopImmediatePropagation();

							fireAction.call(thisSelf, e);
						});
					})(parts[1], attr.value, $(elem));
				}
			}
		});	
	};

	Widget.getParentWidget = function getParentWidget($widget) {
		var $parents = $widget.parents(),
				$parent,
				w;

		if ($parents.length === 0)
			return;

		for (var i = 0, il = $parents.length; i < il; i++) {
			var parent = $parents[i];
			w = $(parent)._W();

			if (w) {
				$parent = $(parent);
				break;
			}
		}

		if (!$parent || $parent.length === 0)
			return;

		return {
			element: $parent,
			widget: w
		};
	};

	Widget.instantiate = function(_element, _opts) {
		var $element = $(_element),
				opts = _opts || {};

		$element.find('[data-xr-widget]').add($element).each(function() {
			var $widget = $(this),
					widgetName = $widget.attr('data-xr-widget');

			if (!widgetName)
				return true;

			var elementName = $widget.attr('xr-name'),
					w = $widget._W();

			if (!w) {
				var klass = require('widget.' + widgetName);
				w = new klass($widget, opts);

				Widget.bindActions(w, $widget);

				var parent = Widget.getParentWidget($widget);
				if (parent) {
					if (elementName)
						parent.widget[elementName] = w;	

					w.parent = parent.widget;
				}
			}
		});

		return $element._W();
	};

	Widget.build = function(_parent, _type, _opts) {
		var $parent = $(_parent),
				type = _type,
				opts = _opts || {};

		if (!$parent || $parent.length === 0)
			return;

		if (!type)
			return;

		return new D.Deferred(function(resolve, reject) {
			dust.render(type, opts.data || {}, function(err, src) {
				if (err) {
					reject(err);
					return;
				}

				var $elem = $(src);
				$parent.append($elem);

				if (opts.data)
					$elem.data('data', opts.data);

				try {
					var w = Widget.instantiate($elem, opts);
					if (!w)
						Widget.bindActions(null, $elem);	
				} catch(e) {
					console.error(e);
					reject(e);
				}

				resolve($elem, w);
			});
		}, {immediate: true});
	};

	$.fn.build = function(type, opts) {
		return Widget.build($(this).first(), type, opts);
	};

	$.fn.widget = $.fn._W = function() {
		return $(this).first().data('xr-widget-instance');
	};

	return Widget;
});