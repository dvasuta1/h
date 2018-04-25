var storage = {
    // `sync` if you want. remember about QUOTAS https://developer.chrome.com/extensions/storage.html#sync-properties
    area: chrome.storage.local,
    default_options: {
        isNeedtoShowDealers: true,
        isNeedToHideCountriesFooter: true,
        isNeedToHideAnnoyingFooter: false
    }
};