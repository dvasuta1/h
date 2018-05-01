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
//analytics('hepart.set', 'dimension1', chrome.runtime.getManifest().version);