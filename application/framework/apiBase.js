(function(factory) {
	module.exports = function(D, $) {
		return factory(D, $);
	};
})(function(D, $) {
	var Route = D.newClass(function(S) {
		this.extend({
			getCacheObj: function(_cachePath, _cacheKey) {
				var cachePath = _cachePath,
						cacheKey = _cacheKey;

				if (arguments.length === 1) {
					cacheKey = cachePath;
					cachePath = this.cache;
				} else if (arguments.length === 0) {
					cacheKey = this.cacheKey;
					cachePath = this.cache;
				}

				if (!cachePath)
					return;

				if (!cacheKey)
					return;

				if (cacheKey instanceof Function)
					cacheKey = cacheKey.call(this);

				var apiCache = this.API['_cache'],
						finalCachePath = cachePath + '.' + cacheKey,
						ret = D.get(apiCache, finalCachePath);

				if (ret && (this.cacheInvalid instanceof Function) && this.cacheInvalid.call(this, ret, finalCachePath) === true)
					return;

				return ret;
			},
			getCache: function(_cachePath, _cacheKey) {
				var cacheObj = this.getCacheObj.apply(this, arguments);
				return (cacheObj) ? cacheObj.value : undefined;
			},
			setCache: function(_cachePath, _cacheKey, _cacheGetter, _data) {
				var cachePath = _cachePath,
						cacheKey = _cacheKey,
						cacheGetter = _cacheGetter,
						data = _data;

				if (arguments.length === 3) {
					data = cacheGetter;
					cacheGetter = this.cacheGetter;
				} else if (arguments.length === 2) {
					data = cacheKey;
					cacheGetter = this.cacheGetter;
					cacheKey = cachePath;
					cachePath = this.cache;
				} else if (arguments.length === 1) {
					data = cachePath;
					cacheGetter = this.cacheGetter;
					cacheKey = this.cacheKey;
					cachePath = this.cache;
				}
				
				if (!cachePath)
					return;

				if (!cacheKey)
					return;

				if (cacheKey instanceof Function)
					cacheKey = cacheKey.call(this, data);

				if (D.utils.instanceOf(cacheGetter, 'string')) {
					var cacheGetterPropKey = cacheGetter;
					cacheGetter = function(data) {
						return D.get(data, cacheGetterPropKey);
					};
				} else if (D.utils.noe(cacheGetter)) {
					cacheGetter = function(data) {
						return data;
					};
				}

				var apiCache = this.API['_cache'],
						finalCachePath = cachePath + '.' + cacheKey,
						currentCache = D.get(apiCache, finalCachePath),
						ret = (D.utils.noe(data)) ? null : cacheGetter.call(this, data, currentCache, finalCachePath, apiCache);

				if (!D.utils.noe(ret)) {
					if (!currentCache) {
						currentCache = {};
						D.set(apiCache, finalCachePath, currentCache);
					}

					currentCache.value = ret;
					currentCache.ts = D.now();

					if (this.cacheUpdate instanceof Function)
						this.cacheUpdate(ret, currentCache);
				} else {
					D.set(apiCache, finalCachePath, null);
				}

				return ret;
			},
			before: function() {
			},
			beforeSuccess: function(data) {
			},
			success: function() {
			},
			beforeError: function() {
			},
			error: function() {
			},
			always: function() {
			},
			exec: function(data) {
				var self = D.data.extend(true, Object.create(this), this, {apiArguments: data});

				return new D.Deferred(function(resolve, reject) {
					function handleProcess(func, args) {
						var self = this;
						return new D.Deferred(function(resolve, reject) {
							var ret = func.apply(self, args);
							if (ret instanceof D.Deferred) {
								ret.proxy(this);
							} else {
								if (ret === false) {
									reject(false);
									return;
								}

								if (ret !== undefined)
									resolve.apply(undefined, [ret]);
								else
									resolve();
							}
						}, {immediate: true});
					}

					function onError(err) {
						if (err === false)
							self.cancelled = true;

						doFail.apply(self, arguments);
					}

					function handleError() {
						doFail.apply(self, arguments);
					}

					function doFail() {
						self.setCache(null);

						var args = arguments;
						handleProcess.call(self, self.beforeError, args).always(function() {
							var errorArgs = (arguments.length === 0) ? args : arguments;
							handleProcess.call(self, self.error, errorArgs).always(function() {
								handleProcess.call(self, self.always, errorArgs).always(function() {
									reject.apply(undefined, errorArgs);
								});
							});
						});
					}

					function handleSuccess() {
						var args = arguments;

						handleProcess.call(self, self.beforeSuccess, args).then(function() {
							var beforeSuccessArgs = (arguments.length === 0) ? args : arguments;
							handleProcess.call(self, self.success, beforeSuccessArgs).then(function() {
								var ret, successArgs = (arguments.length === 0) ? beforeSuccessArgs : arguments;
								if (successArgs && successArgs.length > 0)
									ret = self.setCache(successArgs[0]);

								if (ret)
									successArgs[0] = ret;
								
								handleProcess.call(self, self.always, successArgs).always(function() {
									resolve.apply(undefined, successArgs);	
								});
							}, onError);
						}, onError);
					}

					self.resolve = function() {
						resolve.apply(undefined, arguments);
					};

					self.reject = function() {
						reject.apply(undefined, arguments);
					};

					self.require = function() {
						for (var i = 0, il = arguments.length; i < il; i++) {
							var arg = arguments[i];
							if (D.utils.noe(D.get(data, arg)) && D.utils.noe(D.get(self, arg))) {
								var msg = 'Required argument: ' + arg + ', not found';
								console.error(msg);
								throw new Error(msg);
							}
						}
					};

					var cache = self.getCache();
					if (!D.utils.noe(cache)) {
						if (D.utils.instanceOf(cache, 'deferred')) {
							cache.proxy(this);
						} else if (self.force !== true && data.force !== true) {
							resolve(cache);
							return;
						}
					} else {
						//Set cache to pending deferred
						self.setCache(this);
					}	

					handleProcess.call(self, self.before, [data]).then(function() {
						var fakeData = (global.fakeAPIData) ? global.fakeAPIData[self.routeName] : null;

						if (arguments.length > 0) {
							handleSuccess.apply(self, arguments);
						} else if (fakeData) {
							handleSuccess.call(self, fakeData);
						} else {
							$.ajax(D.data.extend(true, {}, self, {
								success: handleSuccess.bind(self),
								error: handleError.bind(self)
							}));
						}
					}, onError);
				}, {immediate: true});
			}
		});

		return function APIRoute() {
			S.constructor.apply(this, arguments);
		};
	});

	return {
		Route: Route,
		apiFactory: function(initRoutes, _apiBase) {
			var apiBase = _apiBase || Route;
			
			var API = D.newClass(function(S) {
				function createRoute(name, _parent, _konstructor) {
					var api = this,
							konstructor = _konstructor,
							parent = _parent;

					if (arguments.length < 3) {
						konstructor = parent;
						parent = apiBase;
					} else {
						if (D.utils.instanceOf(parent, 'string'))
							parent = this.routes[parent];
					}

					//Generate a new class for this route
					var klass = parent.extend(function(S) {
						if (konstructor instanceof Function)
							konstructor.call(this, S);

						//Copy options for class construction
						var keys = Object.keys(this),
								options = {};

						for (var i = 0, il = keys.length; i < il; i++) {
							var key = keys[i],
									val = this[key];

							options[key] = val;
						}

						return function APIRoute() {
							S.constructor.apply(this, arguments);

							this.API = api;
							this.routeName = name;

							//Set options on this class
							D.data.extend(true, this, options);
						};
					});

					klass.routeName = name;

					return klass;
				}

				this.extend({
					register: function(name) {
						function createRouteInstance(_data, _konstructor) {
							var data = _data || {},
									konstructor = _konstructor;

							if (data instanceof Function) {
								konstructor = data;
								data = {};
							}

							var execRoute = createRoute.call(self, route.routeName, route, konstructor),
									instance = new execRoute();

							return instance;
						}

						function routeRunner(_data, _konstructor) {
							var data = _data || {},
									instance = createRouteInstance.apply(self, arguments);

							return instance.exec(data);
						}

						var self = this,
								route = createRoute.apply(self, arguments);

						//Wrapper function for route
						routeRunner.instantiate = createRouteInstance;
						this[name] = routeRunner;
					}
				});

				return function API() {
					S.constructor.apply(this, arguments);

					D.setROProperty(this, 'routes', {});
					D.setROProperty(this, '_cache', {});

					this.routes['base'] = apiBase;

					initRoutes.call(this, this);
				};
			});

			return new API();
		}
	};
});