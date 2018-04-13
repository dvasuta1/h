// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version
// http://developer.chrome.com/extensions/runtime.html#event-onInstalled
browser.runtime.onInstalled.addListener(function (details) {
console.log('details.reason', details.reason);
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

    browser.notifications.create({
        "type": "basic",
        "iconUrl": browser.extension.getURL("img/ext_icons/ic_bus_articulated_front_black_48dp.png"),
        "title": "Hepart вещает!",
        "message": "Я немножно обновился. Совсем немножко! Только фоновую картинку для диллеров, да и еще помелочи. Ничего особенного. Все работает так же как и работало."
      });

    switch (details.reason) {
        case 'install':
           /* browser.storage.local.clear();
            browser.storage.local.set({
                isNeedtoShowDealers: true
            });*/
            browser.notifications.create({
                "type": "basic",
                "iconUrl": browser.extension.getURL("img/ext_icons/heppart_logo_48.png"),
                "title": "Hepart вещает!",
                "message": "Я немножно обновился. Совсем немножко"
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
    // when an update is available - reload extension
    // update will be install immediately
    browser.runtime.reload();
});

browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var isOnSearchPage = ['/quickpick/', '/search/', '/vehicleFinderSearch/'].filter(function (page) {
        return tab.url.includes(page);
    });
    var isOnLotPage = tab.url.includes('/lot/');
    var action;

    if (changeInfo.status == 'complete' && tab.active) {
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