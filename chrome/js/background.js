// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version
// http://developer.chrome.com/extensions/runtime.html#event-onInstalled
chrome.runtime.onInstalled.addListener(function (details) {
    // good place to set default options
    function setDefaults(callback) {
        storage.area.get(function (stored_options) {
            var default_options = storage.default_options,
                option,
                new_options = {};
            for (option in default_options) {
                if (!stored_options.hasOwnProperty(option)) {
                    new_options[option] = default_options[option];
                }
            }
            if (Object.keys(new_options).length !== 0) {
                // save to area if new default options is appeared
                storage.area.set(new_options, function () {
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            } else {
                if (typeof callback === 'function') {
                    callback();
                }
            }
        });

    }
    switch (details.reason) {
        case 'install':
            console.info('install');
            chrome.storage.local.clear();
            chrome.storage.local.set({
                isNeedtoShowDealers: true,
                isNeedToHideCountriesFooter: true,
                isNeedToHideAnnoyingFooter: false
            });
            break;
        case 'update':
            console.info('update');
            chrome.tabs.create({
                url: "https://www.facebook.com/hepart/posts/587266801639489"
            }); 
            setDefaults();
            storeDataToDB('dealersList', importedDealerLots);
            break;
        default:
            break;
    }
});

function storeDataToDB(storageName, lotId) {
    chrome.storage.local.get(storageName, (obj) => {
        var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);

        if (_.isUndefined(obj[storageName])) {
            var d = JSON.stringify(lotId);
            putIntoStore(storageName, d)
        } else if (storedData && _.indexOf(storedData, lotId) === -1) {
            storedData = _.uniq(lotId);
            storedData = JSON.stringify(storedData);
            putIntoStore(storageName, storedData);
        }
    });

}

function putIntoStore(storageName, storedData, callback) {
    console.debug('putIntoStore');
    var dataToStore = {};
    dataToStore[storageName] = storedData;
    console.log(JSON.parse(storedData).length);
    chrome.storage.local.set(dataToStore, () => {
        if (chrome.extension.lastError) {
            console.error("Runtime error.", chrome.extension.lastError);
        }
        callback && callback();
    });

}


chrome.runtime.onUpdateAvailable.addListener(function (details) {
    chrome.runtime.reload();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var isOnSearchPage = ['/quickpick/', '/search/', '/vehicleFinderSearch/'].filter(function (page) {
        return tab.url.includes(page);
    });
    var isOnLotPage = tab.url.includes('/lot/');
    var action;

    if (changeInfo.status == 'complete') {
        if (isOnLotPage) {
            //analytics('hepart.send', 'event', 'main', 'drawHepartBtn');
            action = 'drawHepartBtn';
        } else if (isOnSearchPage) {
            action = 'drawDealers';
        }
    }
    if (action) {
        chrome.tabs.sendMessage(tabId, {
            action: action
        });
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.id == "bookmarkAdded") {
            createBasicNotification({
                title: request.title,
                message: request.message,
                iconUrl: request.iconUrl,
                id: request.id
            });
        } else if (request.id == "saveDealerItemToGA") {
            console.info('saveDealerItem request', request);
            if (!request.isSold) {
                if (request.auctionDate) {
                    analytics('hepart.send', 'event', 'lot', 'storeDealerLotWithTime', request.lotId + '_' + request.auctionDate);
                } else {
                    analytics('hepart.send', 'event', 'lot', 'storeDealerLot', request.lotId);
                }
            }

        } else if (request.id == "resetAlert") {
            //console.log('resetAlert');
            //resetAlert(request.itemId, sendResponse, 'reset_alert_for_' + request.itemId);
            // sendResponse({ farewell: 'reset_alert_for_' + request.itemId });
            console.info('resetAlert in bg', request.itemId);

            chrome.alarms.clear(request.itemId);
        }
    }
);
/*
function resetAlert(id, func, params) {
    chrome.storage.local.get(id, (obj) => {
        var storedData = !_.isEmpty(obj) && JSON.parse(obj[id]);
        if (storedData) {
            var dataToStore = {};
            dataToStore[id] = JSON.stringify(_.omit(storedData, ['alarmHour', 'alarmMinute']));
            chrome.storage.local.set(dataToStore, () => {
                if (chrome.extension.lastError) {
                    console.error("Runtime error.", chrome.extension.lastError.message);
                }
                console.log('successfully reset');
                chrome.alarms.clear(id, () => {
                    console.log('resetAlert in bg');
                    func && func(params);
                });
            });
        }
    });
}
*/
function createBasicNotification(params) {
    var opt = {
        type: "basic",
        title: params.title || "",
        message: params.message || "",
        iconUrl: params.iconUrl || chrome.runtime.getURL("img/ext_icons/ic_bus_articulated_front_black_48dp.png")
    };
    chrome.notifications.create(params.id, opt);

    setTimeout(function () {
        chrome.notifications.clear(params.id, () => {
            console.info("notifications cleared");
        });
    }, 5000);
}

chrome.notifications.onClicked.addListener(function (notificationId) {
    if (notificationId.includes('bookmark_')) {
        var lotId = notificationId.split('_');
        chrome.tabs.create({
            url: "https://www.copart.com/lot/" + lotId[1]
        }, (tab) => {
            chrome.notifications.clear(notificationId, () => {
                console.info(`Notification ${notificationId} is removed`);
            });
        });

    }
});

/*
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            key,
            namespace,
            storageChange.oldValue,
            storageChange.newValue);
    }
});
*/
function openBookmarksPage() {
    var creating = chrome.tabs.create({
        url: chrome.i18n.getMessage("linkto_bookmarks")
    }, () => onCreated);

    function onCreated() {
        if (chrome.runtime.lastError) {
            analytics('hepart.send', 'exception', {
                'exDescription': chrome.runtime.lastError.message
            });
            console.error("linkto_bookmarks:", chrome.runtime.lastError.message);
        } else {
            console.info("linkto_bookmarks created successfully");
        }
    }
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        id: "addToBookmarks",
        title: chrome.i18n.getMessage("contextMenuItemAddToBookmarks"),
        documentUrlPatterns: ["https://www.copart.com/lot/*", "https://www.copart.com/ru/lot/*"],
        contexts: ["all"]
    }, onMenuItemCreated);

    chrome.contextMenus.create({
        id: "toBookmarks",
        title: chrome.i18n.getMessage("contextMenuItemGoToBookmarks"),
        documentUrlPatterns: ["https://www.copart.com/*"],
        contexts: ["all"]
    }, onMenuItemCreated);

    function onMenuItemCreated() {
        if (chrome.runtime.lastError) {
            analytics('hepart.send', 'exception', {
                'exDescription': chrome.runtime.lastError.message
            });
            console.error("error creating menu item", chrome.runtime.lastError.message);
        } else {
            console.info("munu item successfully created");
        }
    }
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == "addToBookmarks") {
        analytics('hepart.send', 'event', 'bookmarks', 'add');
        chrome.tabs.sendMessage(tab.id, {
            action: 'addToBookmarks'
        });
    } else if (info.menuItemId == "toBookmarks") {
        analytics('hepart.send', 'event', 'bookmarks', 'goto');
        openBookmarksPage();
    }
});

//                renderBookmarkTable();
chrome.alarms.onAlarm.addListener(function (alarm) {
    console.info("Alarm Elapsed Name " + alarm.name);

    if (alarm.name.includes('bookmark_')) {
        chrome.alarms.clear(alarm.name);
        chrome.storage.local.get(alarm.name, (obj) => {
            var storedData = !_.isEmpty(obj) && JSON.parse(obj[alarm.name]);

            if (storedData) {
                var opt = {
                    type: "basic",
                    title: chrome.i18n.getMessage('notification_bookmark_alert_title'),
                    message: chrome.i18n.getMessage('notification_bookmark_clickme', storedData.cleanTitle) || "Text",
                    contextMessage: String(new Date(storedData.saleDateNoTZ)),
                    priority: 2,
                    requireInteraction: true,
                    iconUrl: storedData.img || chrome.runtime.getURL("img/ext_icons/ic_bus_articulated_front_black_48dp.png")
                };

                chrome.notifications.create(alarm.name, opt, () => {
                    console.info("notification was cleared");
                    var dataToStore = {};
                    dataToStore[alarm.name] = JSON.stringify(_.omit(storedData, ['alarmHour', 'alarmMinute']));
                    chrome.storage.local.set(dataToStore, () => {
                        if (chrome.runtime.lastError) {
                            analytics('hepart.send', 'exception', {
                                'exDescription': chrome.runtime.lastError.message
                            });
                            console.error("Runtime error.", chrome.runtime.lastError.message);
                            return;
                        }
                        console.info('Alert has reset on tick');
                    });
                });
            }
        });
    }
});


(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date();
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'analytics');

analytics('create', 'UA-117936283-1', 'auto', 'hepart'); // Replace with your property ID.
analytics('hepart.send', 'pageview');
analytics('hepart.set', 'checkProtocolTask', function () {});
analytics('hepart.require', 'displayfeatures');
// analytics('hepart.set', 'dimension1', chrome.runtime.getManifest().version);