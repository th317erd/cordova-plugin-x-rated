(function() {
	module.exports = Widget.create('form', function(S) {
		function validateField($input) {
			$input.removeClass('xr-state-error xr-validate-warning');
			$input.attr('xr-validate-message', '');
			$input.find('.xr-input-caption').attr('xr-validate-message', '');

			if ($input.hasClass('xr-hide'))
				return;

			var w = $input._W(),
					ret = w.validate();

			ret.fail(function(data) {
				var type, msg;

				if (data instanceof Array) {
					type = data[0];
					msg = data[1];
				} else if (data instanceof Object) {
					type = data.type;
					msg = data.message;
				} else {
					return;
				}

				$input.addClass('xr-state-' + type);
				$input.attr('xr-validate-message', msg);
				$input.find('.xr-input-caption').attr('xr-validate-message', msg);
			});
		}

		function getInputFields() {
			return this.element.find('.xr-input[xr-type]');
		}

		this.extend({
			_create: function() {
				var self = this;

				S._create.apply(this, arguments);

				this.element.on('focusout', function(e) {
					setTimeout(function() {
						var $input = $(e.target).closest('.xr-input');
						validateField.call(self, $input);
					}, 0);
				});
			},
			validate: function() {
				var self = this,
						$inputs = getInputFields.call(this),
						defs = [];

				$inputs.each(function() {
					var ret = validateField.call(self, $(this));

					if (!ret)
						return true;

					defs.push(ret);
				});

				return D.Deferred.every(defs);
			},
			data: function(_data, _opts) {
				if (arguments.length === 0) {
					//Get
					var data = {},
							$inputs = getInputFields.call(this);

					$inputs.each(function() {
						var $input = $(this),
								field = $input.attr('xr-field'),
								w = $input._W();

						if (D.utils.noe(field))
							field = $input.attr('xr-name');

						if (!field)
							return true;

						D.set(data, field, w.value());
					});

					return data;
				} else {
					//Set
					var data = _data,
							$inputs = getInputFields.call(this);

					$inputs.each(function() {
						var $input = $(this),
								field = $input.attr('xr-field'),
								w = $input._W();

						if (D.utils.noe(field))
							field = $input.attr('xr-name');

						if (!field)
							return true;

						var val = D.get(data, field, '');
						w.value(val);
					});
				}

				return this;
			}
		});

		return function FormWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();