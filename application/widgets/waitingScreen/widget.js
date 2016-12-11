(function() {
	module.exports = Widget.create('waitingScreen', function(S) {
		this.extend({
			_create: function() {
				S._create.apply(this, arguments);
			},
			visible: function(set) {
				if (set) {
					if (this.semaphore === 0)
						$('body').find('.xr-waitingScreen').removeClass('xr-hide');

					this.semaphore++;
				} else {
					this.semaphore--;

					if (this.semaphore < 0)
						this.semaphore = 0;

					if (this.semaphore === 0)
						$('body').find('.xr-waitingScreen').addClass('xr-hide');
				}
			}
		});
		
		return function WaitingScreenWidget() {
			S.constructor.apply(this, arguments);
			this.semaphore = 0;
		};
	});
})();