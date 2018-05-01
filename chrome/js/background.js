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
            console.log('install');
            chrome.storage.local.clear();
            chrome.storage.local.set({
                isNeedtoShowDealers: true,
                isNeedToHideCountriesFooter: true,
                isNeedToHideAnnoyingFooter: false
            });
            break;
        case 'update':
            console.log('update');
             chrome.tabs.create({
                 url: "https://www.facebook.com/hepart/posts/583662778666558"
             }); 
            setDefaults();
            break;
        default:
            break;
    }
});

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
        console.log(request);
        if (request.id == "bookmarkAdded") {
            createBasicNotification({
                title: request.title,
                message: request.message,
                iconUrl: request.iconUrl,
                id: request.id
            });
        }
        if (request.id == "saveDealerItemToGA") {
            console.log('request.lotId', request.lotId);
            analytics('hepart.send', 'event', 'lot', 'storeDealerLot', request.lotId);
        }
    });

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
            console.log("cleared");
        });
    }, 5000);
}

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
            console.log("linkto_bookmarks:" + chrome.runtime.lastError);
        } else {
            console.log("linkto_bookmarks created successfully");
        }
    }
}

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
        console.log("error creating item:" + chrome.runtime.lastError);
    } else {
        console.log("item created successfully");
    }
}

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