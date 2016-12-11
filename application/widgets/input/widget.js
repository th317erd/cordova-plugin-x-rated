(function() {
	module.exports = Widget.create('input', function(S) {
		function initType(type) {
			var self = this;

			if (type.match(/button/i)) {
				this.element.on('tap', function(e) {
					function fireEvent(e, state) {
						var actionFunc = this['action_' + action];
						if (actionFunc instanceof Function)
							actionFunc.call(this, e, state);
						else if (this.parent)
							fireEvent.call(this.parent, e, state);
					}

					e.preventDefault();
					e.stopImmediatePropagation();

					var state = false,
							action = self.element.attr('xr-data-action'),
							buttonType = self.element.attr('xr-button-type');

					if (!buttonType)
						buttonType = 'button';

					if (buttonType.match(/toggle/i)) {
						state = !self.element.hasClass('xr-state-active');
						self.element.toggleClass('xr-state-active', state);
					}

					if (!action)
						return;

					fireEvent.call(self, e, state);
				});
			}
		}

		function bindFormattersAndValidators(formatters, validators) {
			if (!D.utils.noe(formatters))
				this.formatFunc = D.data.formatterFunction(formatters);

			if (!D.utils.noe(validators)) {
				if (validators.match(/\brequired\b/))
					this.element.addClass('xr-required');
				
				this.validateFunc = D.data.validatorFunction(validators);
			}
		}

		function getSetValue(val) {
			var $input = this.element.find('.xr-input-field'),
					inputType = ('' + this.element.attr('xr-type'));

			if (arguments.length === 0) {
				//Get
				if (inputType === 'radio') {
					var $parent = $input.closest('.xr-form,.xr-group,.xr-view'),
							name = $input.attr('name');

					if ($parent.length === 0 || D.utils.noe(name))
						return null;

					return $parent.find('.xr-input-field[type="radio"][name="' + name + '"]:checked').val();
				} else {
					if (('' + $input.attr('type')).match(/checkbox/i))
		        return $input.prop('checked');
		      else
		        return $input.val();
				}
			} else {
				//Set
				if (inputType === 'radio') {
					var $parent = $input.closest('.xr-form,.xr-group,.xr-view'),
							name = $input.attr('name');

					if ($parent.length === 0 || D.utils.noe(name))
						return;

					$parent.find('.xr-input-field[type="radio"][value="' + val + '"]').prop('checked', true);
				} else {
					if (('' + $input.attr('type')).match(/checkbox/i))
		        $input.prop('checked', !!val);
		      else
		        $input.val(val);
				}
			}
		}

		this.extend({
			_create: function() {
				S._create.apply(this, arguments);

				initType.call(this, '' + this.element.attr('xr-type'));
				bindFormattersAndValidators.call(this, this.element.attr('xr-formatters'), this.element.attr('xr-validators'));

				this.element.on('tap', function(e) {
					e.stopImmediatePropagation();
				});
			},
			value: function(val) {
				var formattedValue = val;

				if (arguments.length === 0) {
					formattedValue = getSetValue.call(this);

					if (this.formatFunc instanceof Function)
						formattedValue = this.formatFunc.call(this, formattedValue, 'unformat', this.options);

					return formattedValue;
				}

				if (this.formatFunc instanceof Function)
					formattedValue = this.formatFunc.call(this, val, 'format', this.options);

				getSetValue.call(this, formattedValue);

				return this;
			},
			validate: function(value) {
				if (this.validateFunc instanceof Function) {
					var val = (arguments.length === 0) ? this.value() : value;
					return this.validateFunc.call(this, val, 'validate', this.options);
				}

				return D.Deferred.resolve();
			},
			action_togglePasswordVisibility: function() {
				var $input = this.element.find('input');
				if ($input.length === 0)
					return;

				var isPassword = !(('' + $input.attr('type')).match(/text/i));
				$input.attr('type', (isPassword) ? 'text' : 'password');
				this.element.toggleClass('xr-password-hidden', !isPassword);
			}
		});

		return function InputWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();