function initDropdownList(min, max, step, activeItem = '') {
    var output = [];
    for (var i = min; i <= max; i += step) {
        var val = i < 10 ? '0' + i : i;
        if (val == activeItem) {
            output.push('<option selected value="' + val + '">' + val + '</option>');
        } else {
            output.push('<option value="' + val + '">' + val + '</option>');
        }
    }
    return output.join('');
}


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
            var auctionHappened = item.saleDateNoTZ && moment().isAfter(item.saleDateNoTZ);
            auctionHappened = auctionHappened == null ? true : auctionHappened;
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
            <td data-title="${chrome.i18n.getMessage('bookmarks_alert')}" class='setAlert' data-parent="bookmark_${item.lotId}">
            <div class="alertContainer ${auctionHappened  ? `hidden` : ''} ">    
                    <ul class='time'> 
                        <li>
                            <select name='alertForHours' ${item['alarmHour'] !== undefined ? `disabled` : ""} class='alertForHours'>
                                <option value='-1' disabled selected >hh</option>
                                ${initDropdownList(0, 23, 1, item.alarmHour)}
                            </select> :&nbsp;</li><li><select name='alertForMinutes' ${item['alarmMinute'] !== undefined ? `disabled` : ""} class='alertForMinutes'>
                                <option value='-1' disabled selected >mm</option>
                                ${initDropdownList(0, 55, 5, item.alarmMinute)}
                            </select>
                        </li>
                    </ul>
                    <ul class='actions'>
                        <li>
                        ${item['alarmMinute'] !== undefined ? `<div class='resetAlert' data-id="bookmark_${item.lotId}">Reset</div>` : ""}
                        ${item['alarmMinute'] == undefined ? `<div class='saveAlert' data-id="bookmark_${item.lotId}" >Start</div>` : ""}
                        <li>
                    </ul>
                </div>
            </td>
            <td><span data-id="bookmark_${item.lotId}" class="removeBookmark">${chrome.i18n.getMessage('general_remove')}</span></td>`;
        };

        data.forEach(function (element) {
            var auctionHappened = element.saleDateNoTZ && moment().isAfter(element.saleDateNoTZ);
            console.info('auctionHappened', auctionHappened);
            console.info('saleDate', element.saleDate);

            console.info('saleDateNoTZ', moment(element.saleDateNoTZ).format('DD.MM.YYYY HH:mm'));

            var tr = document.createElement('tr');
            auctionHappened && tr.classList.add('row_auction_happened');
            tr.classList.add('row_' + element.lotId);
            tr.innerHTML = drawBookmarkRow(element);
            fragment.appendChild(tr);
        });

        table[0].appendChild(fragment);
    }
}

renderBookmarkTable();

document.addEventListener('DOMContentLoaded', function () {
    $(document).on('click', '.removeBookmark', function (e) {
        if (e.currentTarget.dataset.id) {
            analytics('hepart.send', 'event', 'bookmarks', 'remove');
            chrome.storage.local.remove(e.currentTarget.dataset.id);
        }
    });
    $(document).on('click', '.saveAlert', function (e) {
        var id = e.currentTarget.dataset.id;
        var hoursSelect = $('.alertForHours', '[data-parent="' + id + '"]');
        var minutesSelect = $('.alertForMinutes', '[data-parent="' + id + '"]');
        var hoursVal = hoursSelect.val();
        var minutesVal = minutesSelect.val();

        if (hoursVal == null || minutesVal == null || (hoursVal == '00' && minutesVal == '00')) {
            alert(chrome.i18n.getMessage('bookmarks_select_correct_inverval'));
            return;
        }

        if (id) {
            chrome.storage.local.get(id, (obj) => {
                var storedData = !_.isEmpty(obj) && JSON.parse(obj[id]);
                var duration = moment.duration(`${hoursVal}:${minutesVal}:00`);
                var time = moment(storedData.saleDateNoTZ).subtract(duration);
                var startTime = +time.format('x')

                if (Number.isNaN(startTime)) {
                    alert('Damn');
                    return;
                }

                if (moment().isAfter(time)) {
                    //alert('Выбраный временной интервал указывает на время в прошлом');
                    alert(chrome.i18n.getMessage('bookmarks_select_correct_inverval_in_future', time.format('DD.MM.YYYY HH:mm')));

                } else if (storedData) {
                    var dataToStore = {};
                    dataToStore[id] = JSON.stringify(_.extend(storedData, { 'alarmHour': hoursVal, 'alarmMinute': minutesVal }));
                    chrome.storage.local.set(dataToStore, () => {
                        if (chrome.runtime.lastError) {
                            analytics('hepart.send', 'exception', {
                                'exDescription': chrome.runtime.lastError.message
                            });
                            console.error("Runtime error.", chrome.runtime.lastError.message);
                        }
                        console.info('Alert created');
                        // console.log('a', +time.format('x'));
                        chrome.alarms.clear(id, function () {
                            chrome.alarms.create(id, { when: startTime });
                        });
                    });
                }
                // renderBookmarkTable();
            });
        }
    });
    $(document).on('click', '.resetAlert', function (e) {
        console.info('reset alert');
        var bookmarkId = e.currentTarget.dataset.id;
        if (bookmarkId) {
            resetAlert(bookmarkId);
        }
    });
});


function resetAlert(id) {
    chrome.storage.local.get(id, (obj) => {
        var storedData = !_.isEmpty(obj) && JSON.parse(obj[id]);
        if (storedData) {
            var dataToStore = {};
            dataToStore[id] = JSON.stringify(_.omit(storedData, ['alarmHour', 'alarmMinute']));
            chrome.storage.local.set(dataToStore, () => {
                if (chrome.runtime.lastError) {
                    analytics('hepart.send', 'exception', {
                        'exDescription': chrome.runtime.lastError.message
                    });
                    console.error("Runtime error.", chrome.runtime.lastError.message);
                    return;
                }
                console.info('alert is successfully reset');
                chrome.runtime.sendMessage({
                    id: "resetAlert",
                    itemId: id
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        analytics('hepart.send', 'exception', {
                            'exDescription': chrome.runtime.lastError.message
                        });
                        console.error("Runtime error.", chrome.runtime.lastError.message);
                        return;
                    }
                    console.info('response cb in bookmarks', response.farewell);

                    // renderBookmarkTable();
                });

            });
        }
    });
}

/*
function resetAlert(id) {
    chrome.storage.local.get(id, (obj) => {
        var storedData = !_.isEmpty(obj) && JSON.parse(obj[id]);
        if (storedData) {
            var dataToStore = {};
            dataToStore[id] = JSON.stringify(_.omit(storedData, ['alarmHour', 'alarmMinute']));
            chrome.runtime.sendMessage({
                id: "resetAlert",
                itemId: id
            }, function (response) {
                if (chrome.extension.lastError) {
                    console.error("Runtime error.", chrome.extension.lastError.message);
                    return;
                }
                console.log('response cb in bookmarks', response.farewell);
               
                renderBookmarkTable();
            });
            // chrome.storage.local.set(dataToStore, () => {
            //     if (chrome.extension.lastError) {
            //         console.error("Runtime error.", chrome.extension.lastError.message);
            //     }
            //     console.log('alarms are removed from storage');
 
            // });
        }
    });
}
*/


chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];

        if (key.includes('bookmark_')) {
            renderBookmarkTable();
        }
    }
});

analytics('hepart.send', 'pageview', 'bookmarks.html');