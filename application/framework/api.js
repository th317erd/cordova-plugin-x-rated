(function(factory) {
	module.exports = function(D, $) {
		return factory(D, $, require('./apiBase')(D, $));
	};
})(function(D, $, R) {
	function initRoutes() {
		var API = this;

		this.register('test', function(S) {
			this.extend({
				method: 'GET',
				url: 'service/test',
				before: function(data) {
					S.before.apply(this, arguments);

					this.require('id');
					this.url += '/' + encodeURIComponent(data.id) + '.json';	
				},
				beforeSuccess: function(_data) {
					var data = _data,
							ret = S.beforeSuccess.apply(this, arguments);

					if (ret)
						data = ret;

					return data;
				}
			});
		});
	}

	var apiBase = R.Route.extend(function(S) {
		this.extend({
			cacheInvalid: function(cache) {
				var now = D.now();

				//All cache is invalid after one hour
				if ((now - cache.ts) > 3600000)
					return true;
			},
			before: function(data) {
				if (data && data.silent)
					this.silent = true;

				var ret = S.before.apply(this, arguments);
				if (ret)
					return (D.utils.indanceOf(ret, 'deferred')) ? ret : D.Deferred.resolve(ret);

				if (this.silent !== true)
					App.waitingScreen.visible(true);

				this.url = App.config.baseURL + '/' + this.url;
				this.headers = D.data.extend(true, {}, config.headers, this.headers);
			},
			beforeSuccess: function(_data) {
				var data = _data,
						ret = S.beforeSuccess.apply(this, arguments);

				if (ret !== undefined)
					data = ret;

				if (data && data.service_response) {
					var r = data.service_response;
					if (r.result === 'FAILURE')
						throw new Error(r.message);
				} else if (data.statusText && data.statusText !== 'OK')
					throw new Error(data.statusText);
			},
			beforeError: function(_data) {
				var data = _data;

				if (data.responseJSON && data.responseJSON instanceof Object)
					data = data.responseJSON;

				if (data && data.service_response) {
					var r = data.service_response;
					if (r.result === 'FAILURE')
						return r.message;
				} else if (data.statusText && data.statusText !== 'OK')
					return data.statusText;
			},
			always: function() {
				if (this.silent !== true)
					App.waitingScreen.visible(false);
			}
		});

		return function APIBase() {
			S.constructor.apply(this, arguments);

			//Default options
			D.data.extend(true, this, {
				method: 'GET'
			});
		};
	});

	return R.apiFactory(initRoutes, apiBase);
});