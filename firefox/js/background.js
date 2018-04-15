// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version
// http://developer.chrome.com/extensions/runtime.html#event-onInstalled
browser.runtime.onInstalled.addListener(function (details) {
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
    //on update notification
    /*browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.extension.getURL("img/ext_icons/ic_bus_articulated_front_black_48dp.png"),
        "title": browser.i18n.getMessage('update_notification_title'),
        "message": browser.i18n.getMessage('update_notification_content')
    });
*/
    switch (details.reason) {
        case 'install':
            browser.storage.local.clear();
            browser.storage.local.set({
                isNeedtoShowDealers: true,
                isNeedToHideCountriesFooter: true,
                isNeedToHideAnnoyingFooter: false
            });
            break;
        case 'update':
            setDefaults();
            break;
        default:
            break;
    }
});

browser.runtime.onUpdateAvailable.addListener(function (details) {
    browser.runtime.reload();
});

browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var isOnSearchPage = ['/quickpick/', '/search/', '/vehicleFinderSearch/'].filter(function (page) {
        return tab.url.includes(page);
    });
    var isOnLotPage = tab.url.includes('/lot/');
    var action;

    if (changeInfo.status == 'complete') {
        if (isOnLotPage) {
            action = 'drawHepartBtn';
        } else if (isOnSearchPage) {
            action = 'drawDealers';
        }
    }
    if (action) {
        browser.tabs.sendMessage(tabId, {
            action: action
        });
    }
});


browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);
        if (request.type == "bookmarkAdded") {
            createBasicNotification({
                type: request.type,
                title: request.type,
                message: request.message
            });
        }

    });

function createBasicNotification(params) {
    var opt = {
        type: "basic",
        title: params.title,
        message: params.message,
        iconUrl: browser.extension.getURL("img/ext_icons/ic_bus_articulated_front_black_48dp.png"),
    }
    browser.notifications.create(params.type, opt);
    setTimeout(function () {
        browser.notifications.clear(params.type).then(() => {
            console.log("cleared");
        });
    }, 3000);
}


browser.storage.onChanged.addListener(function (changes, namespace) {
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


browser.browserAction.onClicked.addListener(function () {
    var creating = browser.tabs.create({
        url: "bookmarks.html"
    });
    creating.then(onCreated, onError);

    function onCreated(tab) {
        console.log(`Created new tab: ${tab.id}`)
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }
});