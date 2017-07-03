'use strict';

let Background = (function() {
	let _searchTabId = null;
	let _profileTabId = null;
	let _step = null;
	let _urls = [];
	let _profiles = [];
	/**
	 * Start the automatic process. This will be executed by "Start" button on popup screen.
	 * @param {string} keyword 
	 * @return {void}
	 */
	const start = (keyword, callback) => {
		localStorage._page = JSON.stringify(1);
		localStorage._started = JSON.stringify(true);
		LinkedInScraper.openSearch(1, (tabId) => {
			_searchTabId = tabId;
			_step = "search";
			if (typeof callback === "function") {
				callback();
			}
		});
	}

	const stop = (callback) => {
		localStorage._started = JSON.stringify(false);
		
		if (typeof callback === "function") {
			callback();
		}
	}

	const openSearchPage = (page, callback) => {
		LinkedInScraper.openSearch(page, (tabId) => {
			_searchTabId = tabId;
			_step = "search";

			if (typeof callback === "function") {
				callback();
			}
		});
	}

	const visitProfile = (url) => {
		_step = "profile";
		LinkedInScraper.openProfile(url, (tabId) => {
			_profileTabId = tabId;
		})
	}

	const checkUrls = () => {
		if (_urls.length > 0) {
			let url = _urls.pop();
			visitProfile(url);
		} else {
			let page = JSON.parse(localStorage._page);

			openSearchPage(page + 1, () => {
				if (_profileTabId) {
					chrome.tabs.remove(_profileTabId);
				}
			})
		}
	}

	/**
	 * Getter and Setter of state.
	 * @param {object} params 
	 * @return {object}
	 */
	const state = (params) => {
		if (!params) {
			return {
				started: JSON.parse(localStorage._started || "false")
			}
		} else {
			for (let p in params) {
				localStorage[p] = JSON.stringify(params[p]);
			}
		}
	}

	const profiles = () => {
		return _profiles;
	}

	/**
	 * Initializer.
	 */
	const init = () => {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch(request.from) {
				case "popup":
					//	To do 
					break;

				case "linkedin":
					if (request.action == "status") {
						sendResponse({
							started: JSON.parse(localStorage._started || "false"),
							step: _step,
							searchTabId: _searchTabId,
							profileTabId: _profileTabId
						});
					} else if (request.action == "urls") {
						if (_searchTabId == sender.tab.id) {
							_urls = request.urls;
							chrome.tabs.remove(_searchTabId, () => {
								_searchTabId = null;
								checkUrls();
							})
						}
					} else if (request.action == "profile") {
						if (_profileTabId == sender.tab.id) {
							let profile = request.profile;
							_profiles.push(profile);
							if (_profileTabId) {
								chrome.tabs.remove(_profileTabId, () => {
									_profileTabId = null;
									checkUrls();
								});
							}
						}
					}
					break;

				default:
					console.log("Unknown message arrived.");
					break;
			}
		});
	}

	return {
		init: init,
		start: start,
		stop: stop,
		state: state,
		profiles: profiles
	};
})();

(function(window, jQuery) {
	window.Background = Background;
	window.Background.init();
})(window, $);