(function() {
	module.exports = Widget.create('tabs', function(S) {
		function rebuildButtons($container) {
			function buildButton($page, title) {
				var $btn = $('<div class="xr-button"><span>' + title + '</span></div>');
				
				$btn.on('tap', function(e) {
					e.stopImmediatePropagation();
					e.preventDefault();

					self.element.find('.xr-tabs-body > .xr-tabs-page').removeClass('xr-active');
					self.element.find('.xr-tabs-buttons > .xr-button').removeClass('xr-active');

					$btn.addClass('xr-active');
					$page.addClass('xr-active');
				});

				return $btn;
			}

			var self = this;

			$container.empty();

			this.element.find('.xr-tabs-body > .xr-tabs-page').each(function() {
				var $page = $(this),
						title = $page.attr('xr-page-title'),
						$btn = buildButton($page, title);

				$container.append($btn);
			}).first().addClass('xr-active');

			this.element.find('.xr-tabs-buttons > .xr-button').first().addClass('xr-active');
		}

		this.extend({
			_create: function() {
				S._create.apply(this, arguments);

				rebuildButtons.call(this, this.element.find('.xr-tabs-buttons'));
			}	
		});

		return function TabsWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();