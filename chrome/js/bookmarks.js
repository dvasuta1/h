function renderBookmarkTable() {
    chrome.storage.local.get(results => {
        var bookmarks = [];
        Object.keys(results).forEach(function (key) {
            if (key.includes('bookmark_')) {
                bookmarks.push(JSON.parse(results[key]));
            }
        });
        return drawBookmarkTable(bookmarks);
    });

    function drawBookmarkTable(data) {
        if (data.length === 0) {
            $('#noBookmarks').removeClass('hidden');
        }
        var fragment = document.createDocumentFragment();
        var table = $('#table tbody').empty();
        var drawBookmarkRow = function (item) {
            //debugger;
            return `<td data-title="${chrome.i18n.getMessage('bookmarks_lotid')}">
                <a href="https://copart.com/lot/${item.lotId}" target="_blank">${item.lotId}</a>
            </td>
            <td data-title="${chrome.i18n.getMessage('bookmarks_vehicle')}">${item.title}</td>
            <td data-title="${chrome.i18n.getMessage('bookmarks_photo')}">
                <a href="https://copart.com/lot/${item.lotId}" target="_blank">
                    <img src=${item.img}>
                </a>
            </td>
            <td data-title="${chrome.i18n.getMessage('bookmarks_saledate')}" class='saleDate'>${item.saleDate}</td>
            <td><span id="bookmark_${item.lotId}" class="removeBookmark">${chrome.i18n.getMessage('general_remove')}</span></td>`;
        };

        data.forEach(function (element) {
            var tr = document.createElement('tr');
            tr.innerHTML = drawBookmarkRow(element);
            fragment.appendChild(tr);
        });

        table[0].appendChild(fragment);
    }
}

renderBookmarkTable();

document.addEventListener('DOMContentLoaded', function () {
    $(document).on('click', '.removeBookmark', function (e) {
        if (e.currentTarget.id) {
            analytics('hepart.send', 'event', 'bookmarks', 'remove');
            chrome.storage.local.remove(e.currentTarget.id, renderBookmarkTable);
        }
    });
});

analytics('hepart.send', 'pageview', 'bookmarks.html');