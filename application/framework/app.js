(function(factory) {
	module.exports = function(D, $, appBase) {
		var app = factory(D, $, appBase);
		return new app();
	};
})(function(D, $, appBase) {
	var Application = appBase.extend(function(S) {
		this.extend({
			init: function() {
				var self = this;

				S.init.apply(this, arguments);

				if (window.screen && window.screen.lockOrientation) 
	        window.screen.lockOrientation('portrait');

	      this.element.addClass('xr-app');
			}
		});

		return function Application() {
			S.constructor.apply(this, arguments);
		};
	});

	//Lazy image loading
	$.fn.loadImage = function() {
		$(this).each(function() {
			var $img = $(this);

			(function($img) {
				if (!$img.hasClass('xr-image-loaded')) {
					var imageID = $img.attr('xr-src-id');
					if (!D.utils.noe(imageID)) {
						API.getItemImage({imageID: imageID}).then(function(image) {
							var imgStr = 'data:' + image.content_type + ';' + image.encoding_used + ',' + image.data;
							$img.addClass('xr-image-loaded').attr('style', "background-image: url('" + imgStr + "');");
						});
					}
				}
			})($img);
		});
	};

	return Application;
});