(function() {
	module.exports = Widget.create('homePage', 'page', function(S) {
		this.extend({
			_create: function() {
				var self = this;

				S._create.apply(this, arguments);

				this.element.on('show', function(e) {
				});
			}
		});
		
		return function HomePageWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();