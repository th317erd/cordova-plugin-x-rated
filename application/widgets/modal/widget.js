(function() {
	module.exports = Widget.create('modal', function(S) {
		this.extend({
			_create: function() {
				S._create.apply(this, arguments);
			},
			visible: function(set) {
				if (arguments.length === 0)
					return this.element.hasClass('.xr-hide');

				this.element.toggleClass('xr-hide', !set);

				return this;
			},
			action_close: function(e) {
				if (!$(e.target).hasClass('xr-modal'))
					return;

				this.visible(false);
			}
		});

		return function ModalWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();