(function(factory) {
	module.exports = function(D) {
		return factory(D);
	};
})(function(D, App) {
	var PersistentStorage = D.newClass(function(S) {
		function containsNonLatinCodepoints(s) { // check for UTF-16
		  return (/[^\u0000-\u00ff]/).test(s);
		}

		function replacer(key, value) {
			if ((typeof value === 'number' || (value instanceof Number))) {
				if (isNaN(value))
					return "___NaN___";
				else if (!isFinite(value))
					return "___Infinity___";
			}

			return value;
		}

		function reviver(key, value) {
			if (value === '___NaN___')
				return NaN;
			else if (value === '___Infinity___')
				return Infinity;
			return value;
		}

		function loadNamespaceStorage() {
			function loadStorage(storageObj) {
				var storage = storageObj.getItem(this.namespace);
				if (storage && ((storage instanceof String) || typeof storage === 'string')) {
					if (this.compression && containsNonLatinCodepoints(storage)) {
						try {
							storage = LZString.decompressFromUTF16(storage);
						} catch(e) {}	
					}
					
					try {
						storage = JSON.parse(storage, reviver);
					} catch(e) {}
				}

				return storage || {};
			}

			var storage = global._appStorageCache;
			if (!storage) {
				storage = global._appStorageCache = {
					session: null,
					local: null
				};
			}

			if (!storage.session)
				storage.session = loadStorage.call(this, sessionStorage);

			if (!storage.local)
				storage.local = loadStorage.call(this, localStorage);

			return storage;
		}

		function saveNamespaceStorage() {
			function saveStorage(storageObj, _storage) {
				var storage = _storage;
				try {
					storage = JSON.stringify(storage, replacer);
				} catch(e){}

				if (this.compression && global.LZString && storage.length > 128) {
					try {
						storage = LZString.compressToUTF16(storage);
					} catch(e){}
				}

				storageObj.setItem(this.namespace, storage);
			}

			if (!global._appStorageCache) {
				global._appStorageCache = {
					session: {},
					local: {}
				};
			}

			saveStorage.call(this, sessionStorage, global._appStorageCache.session);
			saveStorage.call(this, localStorage, global._appStorageCache.local);
		}

		this.extend({
			get: function(key, _default, _opts) {
				var opts = _opts || {},
						storage = loadNamespaceStorage.call(this),
						prefix = this.namespace + '.',
						value;

				if (opts.session !== false)
					value = D.get(storage, 'session.' + key);

				if (!value && opts.session !== true)
					value = D.get(storage, 'local.' + key);

				return (D.utils.noe(value)) ? _default : value;
			},
			set: function(key, _value, _opts) {
				var opts = _opts || {},
						storage = loadNamespaceStorage.call(this),
						value = _value;

				if (opts.session === true)
					D.set(storage, 'session.' + key, value);

				if (opts.session !== true)
					D.set(storage,  'local.' + key, value);

				saveNamespaceStorage.call(this);
			},
			remove: function(key, _opts) {
				var opts = _opts || {},
						storage = loadNamespaceStorage.call(this);

				if (opts.session !== false)
					D.remove(storage, 'session.' + key, this.removeKeys);
				
				if (opts.session !== true)
					D.remove(storage, 'local.' + key, this.removeKeys);

				saveNamespaceStorage.call(this);
			},
			clear: function(_opts) {
				var opts = _opts || {},
						storage = loadNamespaceStorage.call(this),
						prefix = this.namespace + '.';

				if (opts.session !== false)
					storage.session = {};
				
				if (opts.session !== true)
					storage.local = {};

				saveNamespaceStorage.call(this);
			}
		});

		return function PersistentStorage(_opts) {
			var opts = _opts || {};

			S.constructor.apply(this, arguments);

			this.compression = !!opts.compression;
		  if (!global.LZString)
		    this.compression = false;

		  this.namespace = opts.namespace;
		  if (D.utils.noe(this.namespace))
		  	this.namespace = 'XR';

		  this.removeKeys = opts.removeKeys;

		  loadNamespaceStorage.call(this);
		};
	});

	return PersistentStorage;
});
