
/*
 * TP class holds methods for all TP elements
 */
if (!window.TP) {
	window.TP = {

		_oldBrowser: (typeof window.addEventListener == 'undefined') ? true : false,
		_callbacks: {},
		_manifests: {},
		_protocol: document.location.protocol == 'https:' ? 'https://' : 'http://',
		
		engagerBaseUrl: function() { return TP._protocol + 'ssl.trustpilot.com/TPElements/'; },
		s3BaseUrl: function () { return TP._protocol + 's3-eu-west-1.amazonaws.com/s.trustpilot.com/tpelements/'; },

		getSettings: function (target, defaultSettings) {
			var fragments = target.getAttribute('data-tp-settings').replace(/ /g, '').split(',');

			var settings = {};

			var key;
			for (var i = 0; i < fragments.length; i++) {
				var keyValue = fragments[i].split(':');
				key = keyValue[0];
				var value = keyValue[1];
				if (value.match(/^\d+$/))
					value = parseInt(value);
				else if (value.match(/^true$/i))
					value = true;
				else if (value.match(/^false$/i))
					value = false;

				settings[key] = value;
			}

			for (var defaultKey in defaultSettings) {
				var found = false;
				for (key in settings) {
					if (key.toLowerCase() === defaultKey.toLowerCase()) {
						found = true;
						break;
					}
				}
				if (!found)
					settings[defaultKey] = defaultSettings[defaultKey];
			}

			return settings;
		},
		showLoader: function (target, type, id, width) {
			var loader = document.createElement('div');
			loader.setAttribute('id', 'tploader-' + type + id);
			loader.innerHTML = '<div style="position: absolute; top: 0; width: 16px; left: 50%; margin-left: -8px; overflow: hidden;"><img src="' + TP._protocol + 's3-eu-west-1.amazonaws.com/images.trustpilot.com/static/widget/tp_widget_loader.gif" alt="trustpilot widget loader"></div>';
			loader.style.position = "relative";
			loader.style.width = width + 'px';
			//loader.style.height = '20px';
			target.appendChild(loader);
		},
		hideLoader: function (type, id) {
			var loader = document.getElementById('tploader-' + type + id);
			if (loader)
				loader.parentNode.removeChild(loader);
		},
		getElementsByClass: function (className) {
			// For modern browsers
			if (typeof document.getElementsByClassName == 'function')
				return document.getElementsByClassName(className);

			// For IE 5.5+
			var elements = [];
			var allAlements = document.getElementsByTagName('*');
			var regex = new RegExp('\\b' + className + '\\b');

			for (var i = 0; i < allAlements.length; i++)
				if (allAlements[i].className.match(regex))
					elements.push(elements[i]);
			return elements;


		},
		insertIframe: function (action, target, type, index, height, width, settings, defaultSettings) {


			// If this target has more than one chilkd, it was already processed
			if (target.children.length > 1)
				return;

			// Hide link inside.
			target.children[0].style.display = 'none';

			// Show loader
			TP.showLoader(target, type, index, width);

			// Build url
			var path = action;
			path += '?index=' + index;
			path += '&type=' + type;
			for (var key in settings) {
				var foundDefault = false;
				for (var defaultKey in defaultSettings)
					if (key.toLowerCase() === defaultKey.toLowerCase()) {
						if (settings[key] != defaultSettings[defaultKey])
							path += '&' + key + '=' + settings[key];
						foundDefault = true;
						break;
					}
				if (!foundDefault)
					path += '&' + key + '=' + settings[key];
			}
			if (window.dontUpdateCloud) {
				path += '&updateCloud=false';
				path += '&b2bSetting=true';
			}

			var iframe = document.createElement('iframe');
			iframe.setAttribute('id', 'tpiframe-' + type + index);
			iframe.frameBorder = 0;
			iframe.width = width;
			iframe.height = height;
			iframe.index = index;
			iframe.type = type;
			iframe.path = path;
			
			// Full scrollbar on old browsers as they can't resize
			if (TP._oldBrowser)
				iframe.scrolling = 'auto';
			else
				iframe.scrolling = 'no';
			//iframe.style.display = 'none';

			if (window.dontUpdateCloud) {

				// Just load from Engager without callback
				iframe.onload = function () {
					iframe.style.display = 'block';
					TP.hideLoader(type, index);
				};
				iframe.src = TP.engagerBaseUrl() + path;
			}
			else {
				// Load from S3 with Engager fallback
				// Diff between HTML5 browsers and crappy browsers

				if (TP._oldBrowser) {
					TP.oldBrowserFallback(path, iframe, target, type, index, 0);
					return;
				}
				else {
					TP._callbacks[type + index] = false;
					iframe.onload = function () {
						var t = this.type;
						var i = this.index;
						var p = this.path;

						setTimeout(function () {
							TP.checkCallBack(t, i, p);
						}, 500);
					};
				}
				iframe.src = TP.makeS3Url(path);
			}

			var wrapper = document.createElement('div');
			wrapper.className = 'tpiframe-wrapper';
			wrapper.appendChild(iframe);
			target.appendChild(wrapper);

		},

		oldBrowserFallback: function (path, iframe, target, type, index, millis, scriptAdded) {
			// Find manifest to determine which files are on S3

			var domainId = /domainId=(\d+)/i.exec(path)[1];

			// Wait at most 1 second
			var didTimeOut = false;
			if (millis > 1000) {
				TP._manifests[domainId] = [];
				didTimeOut = true;
			}

			if (TP._manifests[domainId]) {
				// Manifest is loaded

				iframe.onload = function () {
					iframe.style.display = 'block';
					TP.hideLoader(type, index);
				};

				var s3Url = TP.makeS3Url(path);
				var filePaths = s3Url.split('/');
				var fileName = filePaths[filePaths.length - 1].split('?')[0];
				var found = false;
				for (var i = 0; i < TP._manifests[domainId].length; i++)
					if (TP._manifests[domainId][i] == fileName) {
						found = true;
						break;
					}
				if (found)
					iframe.src = s3Url;
				else {
					if (didTimeOut)
						iframe.src = TP.engagerBaseUrl() + path + '&forceManifest=true';
					else
						iframe.src = TP.engagerBaseUrl() + path;
				}


				var wrapper = document.createElement('div');
				wrapper.className = 'tpiframe-wrapper';
				wrapper.appendChild(iframe);
				target.appendChild(wrapper);



			}
			else {
				if (!scriptAdded) {

					// Manifest is not loaded - load it and try again in a little while
					var script = document.createElement('script');
					script.src = TP.s3BaseUrl() + domainId + '/manifest.jsonp';
					document.getElementsByTagName("head")[0].appendChild(script);
				}
				var timeOut = 50;
				setTimeout(function () {
					TP.oldBrowserFallback(path, iframe, target, type, index, millis + timeOut, true);
				}, timeOut);
			}

		},

		makeS3Url: function (path) {
			var domainId = /domainId=(\d+)/i.exec(path)[1];
			var type = /type=([a-z]+)/i.exec(path)[1];
			var index = /index=(\d+)/i.exec(path)[1];

			path = path.replace(/\?index=\d+/gi, '');

			return TP.s3BaseUrl() + domainId + '/' + TP.md5(path) + '.html?type=' + type + '&index=' + index;
		},
		checkCallBack: function (type, index, path) {
			var iframe = document.getElementById('tpiframe-' + type + index);
			if (!TP._callbacks[type + index])
				// Did not load
				iframe.src = TP.engagerBaseUrl() + path;
			else {
				// Did load
				iframe.style.display = 'block';
				TP.hideLoader(type, index);
			}
		},

		loadBadges: function () {
			var heights = { 100: 86, 120: 103, 140: 120, 180: 155, 220: 189, 280: 240 };
			var defaultSettings = {
				size: 140,
				categoryId: 0
			};
			var placeholders = TP.getElementsByClass('tp_-_category-badge');
			for (var i = 0; i < placeholders.length; i++) {

				var badge = placeholders[i];
				var settings = TP.getSettings(badge, defaultSettings);

				TP.insertIframe('CategoryBadge', badge, 'badge', i, heights[settings.size], settings.size, settings, defaultSettings);

			}
		},

		loadBoxes: function () {
			var placeholders = TP.getElementsByClass('tp_-_box');

			var defaultSettings = {
				linkColor: 'CE5600',
				fontSize: 11,
				fontFamily: 'Helvetica',
				fontColor: '444444',
				bgColor: 'FFFFFF',
				bgBarColor: 'DDDDDD',
				borderRadius: '5',
				borderWidth: '1',
				borderColor: '444444',
				showReviews: true,
				showHeader: true,
				showRatingText: true,
				showComplementaryText: true,
				showUserImage: true,
				showDate: true,
				usePopup: true,
				width: 180,
				numOfReviews: 3,
				fontBarColor: '444444',
				useDarkLogo: true,
				useDynamicHeight: true,
				height: 500
			};


			for (var i = 0; i < placeholders.length; i++) {

				var widget = placeholders[i];
				var settings = TP.getSettings(widget, defaultSettings);
				TP.insertIframe('Box', widget, 'box', i, settings.height, settings.width, settings, defaultSettings);
			}
		},


		md5: function (str) {

			function md5Cycle(x, k) {
				var a = x[0], b = x[1], c = x[2], d = x[3];

				a = ff(a, b, c, d, k[0], 7, -680876936);
				d = ff(d, a, b, c, k[1], 12, -389564586);
				c = ff(c, d, a, b, k[2], 17, 606105819);
				b = ff(b, c, d, a, k[3], 22, -1044525330);
				a = ff(a, b, c, d, k[4], 7, -176418897);
				d = ff(d, a, b, c, k[5], 12, 1200080426);
				c = ff(c, d, a, b, k[6], 17, -1473231341);
				b = ff(b, c, d, a, k[7], 22, -45705983);
				a = ff(a, b, c, d, k[8], 7, 1770035416);
				d = ff(d, a, b, c, k[9], 12, -1958414417);
				c = ff(c, d, a, b, k[10], 17, -42063);
				b = ff(b, c, d, a, k[11], 22, -1990404162);
				a = ff(a, b, c, d, k[12], 7, 1804603682);
				d = ff(d, a, b, c, k[13], 12, -40341101);
				c = ff(c, d, a, b, k[14], 17, -1502002290);
				b = ff(b, c, d, a, k[15], 22, 1236535329);

				a = gg(a, b, c, d, k[1], 5, -165796510);
				d = gg(d, a, b, c, k[6], 9, -1069501632);
				c = gg(c, d, a, b, k[11], 14, 643717713);
				b = gg(b, c, d, a, k[0], 20, -373897302);
				a = gg(a, b, c, d, k[5], 5, -701558691);
				d = gg(d, a, b, c, k[10], 9, 38016083);
				c = gg(c, d, a, b, k[15], 14, -660478335);
				b = gg(b, c, d, a, k[4], 20, -405537848);
				a = gg(a, b, c, d, k[9], 5, 568446438);
				d = gg(d, a, b, c, k[14], 9, -1019803690);
				c = gg(c, d, a, b, k[3], 14, -187363961);
				b = gg(b, c, d, a, k[8], 20, 1163531501);
				a = gg(a, b, c, d, k[13], 5, -1444681467);
				d = gg(d, a, b, c, k[2], 9, -51403784);
				c = gg(c, d, a, b, k[7], 14, 1735328473);
				b = gg(b, c, d, a, k[12], 20, -1926607734);

				a = hh(a, b, c, d, k[5], 4, -378558);
				d = hh(d, a, b, c, k[8], 11, -2022574463);
				c = hh(c, d, a, b, k[11], 16, 1839030562);
				b = hh(b, c, d, a, k[14], 23, -35309556);
				a = hh(a, b, c, d, k[1], 4, -1530992060);
				d = hh(d, a, b, c, k[4], 11, 1272893353);
				c = hh(c, d, a, b, k[7], 16, -155497632);
				b = hh(b, c, d, a, k[10], 23, -1094730640);
				a = hh(a, b, c, d, k[13], 4, 681279174);
				d = hh(d, a, b, c, k[0], 11, -358537222);
				c = hh(c, d, a, b, k[3], 16, -722521979);
				b = hh(b, c, d, a, k[6], 23, 76029189);
				a = hh(a, b, c, d, k[9], 4, -640364487);
				d = hh(d, a, b, c, k[12], 11, -421815835);
				c = hh(c, d, a, b, k[15], 16, 530742520);
				b = hh(b, c, d, a, k[2], 23, -995338651);

				a = ii(a, b, c, d, k[0], 6, -198630844);
				d = ii(d, a, b, c, k[7], 10, 1126891415);
				c = ii(c, d, a, b, k[14], 15, -1416354905);
				b = ii(b, c, d, a, k[5], 21, -57434055);
				a = ii(a, b, c, d, k[12], 6, 1700485571);
				d = ii(d, a, b, c, k[3], 10, -1894986606);
				c = ii(c, d, a, b, k[10], 15, -1051523);
				b = ii(b, c, d, a, k[1], 21, -2054922799);
				a = ii(a, b, c, d, k[8], 6, 1873313359);
				d = ii(d, a, b, c, k[15], 10, -30611744);
				c = ii(c, d, a, b, k[6], 15, -1560198380);
				b = ii(b, c, d, a, k[13], 21, 1309151649);
				a = ii(a, b, c, d, k[4], 6, -145523070);
				d = ii(d, a, b, c, k[11], 10, -1120210379);
				c = ii(c, d, a, b, k[2], 15, 718787259);
				b = ii(b, c, d, a, k[9], 21, -343485551);

				x[0] = add32(a, x[0]);
				x[1] = add32(b, x[1]);
				x[2] = add32(c, x[2]);
				x[3] = add32(d, x[3]);

			}

			function cmn(q, a, b, x, s, t) {
				a = add32(add32(a, q), add32(x, t));
				return add32((a << s) | (a >>> (32 - s)), b);
			}

			function ff(a, b, c, d, x, s, t) {
				return cmn((b & c) | ((~b) & d), a, b, x, s, t);
			}

			function gg(a, b, c, d, x, s, t) {
				return cmn((b & d) | (c & (~d)), a, b, x, s, t);
			}

			function hh(a, b, c, d, x, s, t) {
				return cmn(b ^ c ^ d, a, b, x, s, t);
			}

			function ii(a, b, c, d, x, s, t) {
				return cmn(c ^ (b | (~d)), a, b, x, s, t);
			}

			function md51(s) {
				var n = s.length,
				    state = [1732584193, -271733879, -1732584194, 271733878], i;
				for (i = 64; i <= s.length; i += 64) {
					md5Cycle(state, md5Blk(s.substring(i - 64, i)));
				}
				s = s.substring(i - 64);
				var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				for (i = 0; i < s.length; i++)
					tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
				tail[i >> 2] |= 0x80 << ((i % 4) << 3);
				if (i > 55) {
					md5Cycle(state, tail);
					for (i = 0; i < 16; i++) tail[i] = 0;
				}
				tail[14] = n * 8;
				md5Cycle(state, tail);
				return state;
			}

			/* there needs to be support for Unicode here,
			* unless we pretend that we can redefine the MD-5
			* algorithm for multi-byte characters (perhaps
			* by adding every four 16-bit characters and
			* shortening the sum to 32 bits). Otherwise
			* I suggest performing MD-5 as if every character
			* was two bytes--e.g., 0040 0025 = @%--but then
			* how will an ordinary MD-5 sum be matched?
			* There is no way to standardize text to something
			* like UTF-8 before transformation; speed cost is
			* utterly prohibitive. The JavaScript standard
			* itself needs to look at this: it should start
			* providing access to strings as preformed UTF-8
			* 8-bit unsigned value arrays.
			*/
			function md5Blk(s) { /* I figured global was faster.   */
				var md5Blks = [], i; /* Andy King said do it this way. */
				for (i = 0; i < 64; i += 4) {
					md5Blks[i >> 2] = s.charCodeAt(i)
						+ (s.charCodeAt(i + 1) << 8)
							+ (s.charCodeAt(i + 2) << 16)
								+ (s.charCodeAt(i + 3) << 24);
				}
				return md5Blks;
			}

			var hexChr = '0123456789abcdef'.split('');

			function rhex(n) {
				var s = '', j = 0;
				for (; j < 4; j++)
					s += hexChr[(n >> (j * 8 + 4)) & 0x0F]
						+ hexChr[(n >> (j * 8)) & 0x0F];
				return s;
			}

			function hex(x) {
				for (var i = 0; i < x.length; i++)
					x[i] = rhex(x[i]);
				return x.join('');
			}


			/* this function is much faster,
			so if possible we use it. Some IEs
			are the only ones I know of that
			need the idiotic second function,
			generated by an if clause.  */

			function add32(a, b) {
				return (a + b) & 0xFFFFFFFF;
			}

			if (!window.checkedMd5SumCapabilities) {
				window.checkedMd5SumCapabilities = true;
				if (TP.md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
					function add32(x, y) {
						var lsw = (x & 0xFFFF) + (y & 0xFFFF),
						    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
						return (msw << 16) | (lsw & 0xFFFF);
					}
				}
			}

			return hex(md51(str));

		}


	};
	
	//
	// Set up an event listener for doing fit-frame-to-content
	// dynamically and when the iframe sends back a postmessage
	//
	if (!TP._oldBrowser) {

		window.addEventListener('message', function (e) {
			// Register the callback
			var data = e.data.split(':');
			var type = data[0];
			var index = data[1];
			TP._callbacks[type + index] = true;

			// Set height
			var height = data[2];
			if (height)
				document.getElementById('tpiframe-' + type + index).height = parseInt(height, 10);

		}, false);
	}

	var trustpilot_manifest_callback = function (domainId, files) {
		TP._manifests[domainId] = files;
	};



}

// Load badges
TP.loadBadges();

// Load boxes
TP.loadBoxes();


