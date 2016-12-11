(function() {
	module.exports = Widget.create('pages', function(S) {
		this.extend({
			_create: function() {
				S._create.apply(this, arguments);
				
				this.element.children('.xr-page').addClass('xr-hide').first().removeClass('xr-hide');
			},
			page: function(pageName, _opts) {
				var opts = _opts || {},
						$currentPage = this.element.find('.xr-page:not(.xr-hide)');

				if (arguments.length === 0)
					return ($currentPage.length > 0) ? $currentPage.first().attr('xr-name') : null;

				$('.xr-pane').removeClass('xr-state-active');
				
				var $page = this.element.find('.xr-page[xr-name="' + pageName + '"]').first();
				if ($page.length > 0) {
					if ($currentPage.get(0) === $page.get(0))
						return this;

					$currentPage.addClass('xr-hide');
					$currentPage.trigger('hide');

					if (opts.data)
						$page.data('page-data', opts.data);

					$page.removeClass('xr-hide');
					$page.trigger('show', opts.data);
				}

				return this;
			}
		});
		
		return function PagesWidget() {
			S.constructor.apply(this, arguments);
		};
	});
})();