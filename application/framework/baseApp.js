(function(factory) {
	module.exports = function(D, $, Widget) {
		return factory(D, $, Widget);
	};
})(function(D, $, Widget) {
	var BaseApplication = Widget.extend(function(S) {
		this.extend({
			_create: function() {
				S._create.apply(this, arguments);

				this.element.attr('data-xr-widget', 'widget');
			},
			init: function() {
				function initWidgets() {
					$('[data-xr-widget]').each(function() {
						if ($(this).is('body'))
							return true;

						Widget.instantiate($(this));
					});
				}

		    initWidgets();

		    $(document).on('tap', function(e) {
		    	$('input:focus').blur();
		    });
			},
			requestPermission: function(permission) {
				return new D.Deferred(function(resolve, reject) {
		      if (cordova.plugins && cordova.plugins.permissions) {
		        var p = cordova.plugins.permissions,
		            perm = (D.utils.instanceOf(permission, 'string')) ? p[('' + permission.toUpperCase())] : permission;

		        if (!perm) {
		        	resolve();
		        	return;
		        }

		        p.hasPermission(perm, function(status) {
		          if (!status.hasPermission) {
		            p.requestPermissions((perm === p.CAMERA) ? [p.CAMERA, p.MODIFY_AUDIO_SETTINGS, p.RECORD_AUDIO] : [perm], function(status) {
		              if(!status.hasPermission) {
		                reject('declined');
		                return;
		              }

		              resolve();
		            }, function(err) {
		              reject(err);
		            });

		            return;
		          }

		          resolve();
		        }, function(err) {
		          reject(err);
		        });
		      } else {
		        resolve();
		      }
		    });
			},
			askForPermissions: function(permissions) {
		    function getPermissions(_permissions) {
		    	var permissions = _permissions;
		    	if (!(permissions instanceof Array))
		    		permissions = [permissions];

	        var finalPermissions = [],
	        		p = cordova.plugins.permissions;

	        if (permissions.indexOf('CAMERA') > -1) {
	        	if (permissions.indexOf('MODIFY_AUDIO_SETTINGS') < 0)
	        		permissions.push('MODIFY_AUDIO_SETTINGS');

	        	if (permissions.indexOf('RECORD_AUDIO') < 0)
	        		permissions.push('RECORD_AUDIO');
	        }

	        for (var i = 0, il = permissions.length; i < il; i++) {
	        	var permission = permissions[i],
	        			perm = (D.utils.instanceOf(permission, 'string')) ? p[permission] : permission;

	        	if (perm && finalPermissions.indexOf(perm) < 0)
	        		finalPermissions.push(perm);
	        }

	        return finalPermissions;
		    } 

		    if (cordova.plugins && cordova.plugins.permissions) {
		    	var permissions = getPermissions(permissions),
		    			defs = [];

			    for (var i = 0, il = permissions.length; i < il; i++) {
			    	var perm = permissions[i];
			    	defs.push(this.requestPermission(perm));
			    }

			    return D.Deferred.all(defs);
			  } else {
		    	return D.Deferred.resolve();
		    }
		  },
		  alert: function(message, _title, _buttonCaption) {
		  	var title = _title || "Alert",
		  			buttonCaption = _buttonCaption || "OK";

		  	return new D.Deferred(function(resolve, reject) {
		  		navigator.notification.alert(message, function() {
		  			resolve();
		  		}, title, buttonCaption);
		  	});
		  },
		  confirm: function(message, _title, _buttonCaptions) {
		  	var title = _title || "Alert",
		  			buttonCaptions = _buttonCaptions || ["Yes", "No"];

		  	return new D.Deferred(function(resolve, reject) {
		  		navigator.notification.confirm(message, function(index) {
		  			if (index === 1)
		  				resolve();
		  			else
		  				reject();
		  		}, title, buttonCaptions);
		  	});
		  }
		});

		return function BaseApplication() {
			var $body = $('body');
			D.setROProperty(this, 'widgetName', 'App');

			S.constructor.call(this, $body);
		};
	});

	$.fn.scrollIntoView = function() {
		function getAsNumber(num) {
			var thisNum = parseFloat(('' + num).replace(/[^\d.-]/g,''));
			return (isNaN(thisNum)) ? 0 : thisNum;
		}

		var $elem = $(this).last(),
	      $view = $elem.closest('.xr-view');

		return new D.Deferred(function(resolve, reject) {
	    if ($elem.length === 0 || $view.length === 0) {
	    	reject();
	      return;
	    }

	    var co = $elem.get(0).getBoundingClientRect(),
	        vo = $view.get(0).getBoundingClientRect();

	    if (!co || !vo) {
	    	reject();
	      return;
	    }

	    var margin = getAsNumber($view.css('margin-top')),
	    		border = getAsNumber($view.css('border-top-width')),
	    		offset = (margin + border),
	    		yOff = co.top - (vo.top + offset),
	        voScroll = $view.scrollTop();

    	$view.animate({
	      scrollTop: voScroll + (yOff - 5),
	    }, {
	    	duration: 250,
	    	done: function() {
		    	resolve();
		    }
	    });
    });
  };

  $.event.special.destroyed = {
    remove: function(o) {
      if (o.handler) {
      	var e = jQuery.Event("destroyed", o);
    		e.target = this;
        
        return o.handler(e);
      }
    }
  };

  var monitorUIDCounter = 0;
  $.fn.monitorVisible = function() {
  	function getWatchedElements($view) {
  		var watchedElements = $view.data('xr-watched-elements');
			if (!watchedElements) {
				watchedElements = {};
				$view.data('xr-watched-elements', watchedElements);
			}

			return watchedElements;
  	}

  	function watchView($view) {
  		var watchedElements = $view.data('xr-watched-elements');
  		if (watchedElements)
  			return;

  		$view.on('scroll', function(e) {
  			var watchedElements = getWatchedElements($view),
  					viewRect = $view.get(0).getBoundingClientRect();

  			var keys = Object.keys(watchedElements);
  			for (var i = 0, il = keys.length; i < il; i++) {
  				var key = keys[i],
  						watched = watchedElements[key];

  				if (!watched)
  					continue;

  				if (!watched.elem || !watched.elem.parentNode)
  					continue;

  				var elem = watched.elem,
  						$elem = $(watched.elem),
  						elemRect = elem.getBoundingClientRect(),
  						lastVisibleState = watched.state,
  						x1 = elemRect.right - viewRect.left,
  						x2 = elemRect.left - viewRect.right,
  						y1 = elemRect.bottom - viewRect.top,
  						y2 = elemRect.top - viewRect.bottom;

  				if (((x1 * x2) > 0) || ((y1 * y2) > 0)) {
  					if (lastVisibleState === null || lastVisibleState === true) {
  						watched.state = false;
  						$elem.trigger('viewVisible', [false, $elem]);
  					}
  					//Not visible
  				} else {
  					if (lastVisibleState === null || lastVisibleState === false) {
  						watched.state = true;
  						$elem.trigger('viewVisible', [true, $elem]);
  					}
  					//Visible
  				}
  			}
  		});
  	}

  	function watchElement($view, $elem, uid) {
  		var watchedElements = getWatchedElements($view);
  		watchedElements[uid] = {
  			state: null,
  			elem: $elem.get(0)
  		};
  		
  		$elem.on('destroyed', function(e) {
  			delete watchedElements[uid];
  		});
  	}

  	$(this).each(function() {
  		var $elem = $(this),
  				$view = $elem.closest('.xr-view'),
  				uid = 'ID_' + monitorUIDCounter;

  		if ($view.length === 0)
  			return true;

  		monitorUIDCounter++;

  		watchView($view);
  		watchElement($view, $elem, uid);
  	});
  };

	return BaseApplication;
});