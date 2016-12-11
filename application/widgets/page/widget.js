(function() {
	module.exports = Widget.create('page', function(S) {
		this.extend({
			_create: function() {
				S._create.apply(this, arguments);
			},
			visible: function() {
				if (arguments.length === 0)
					return !this.element.hasClass('xr-hide');
			},
			toggleAltView: function(set) {
				var self = this;

				if (arguments.length === 0)
					this.element.toggleClass('xr-alt-view-active');
				else
					this.element.toggleClass('xr-alt-view-active', !!set);

				this.element.trigger('expandView', [this.element.hasClass('xr-alt-view-active')]);
			},
			action_expandView: function() {
				this.toggleAltView();
			}		
		});

		return function PageWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();