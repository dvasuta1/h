'use strict';

//TODO:
//All this fucking crap must be refactored in next major version

var AppState = {
	Opts: {
		isNeedtoShowDealers: true
	}
};

function drawHepardButton() {
	if ($('#hepart_button').length != 0) return;

	var d = document.createElement('span');
	$(d).attr('id', 'hepart_button')
		.attr('data-content', getTranslatedText("hepart_run"))
		.prependTo($("#exportLotDetails"))
		.css({
			width: $('#hepart_button').css('width'),
		})
		.click(function () {
			$(this).addClass('active');
			$(this).off('click');
			getLotinfoById(insertTableRows);
		});
}

function getLotinfoById(callback) {
	var url = window.location.href.replace(/\/$/, '');
	var lotId = url.substr(url.lastIndexOf('/') + 1);

	if (lotId) {
		$.get("https://www.copart.com/public/data/lotdetails/solr/" + lotId, function (data) {
			if (data && data.data.lotDetails) {
				callback && callback(data.data.lotDetails);
			}
		}, "json");
	} else {
		console.debug('Wrong lot id', lotId);
	}
}

function insertTableRows(data) {
	var sellerRow = document.querySelectorAll('[data-uname~="lotdetailSeller"]');
	var isSellerRowDataAvailable = sellerRow.length === 0 && data.std && data.snm;
	var isRepairCostDataAvailable = data.rc;
	var isFinalPriceDataAvailable = data.ahb !== 0;

	if (isSellerRowDataAvailable) {
		var container = $(document.querySelectorAll('[data-uname~="lotdetailPrimarydamage"]'));
		container = container.parent().parent();
		var tmpl = "<div id='hepart_seller_type'><div class='details hepart_row'><label>" + getTranslatedText("hepart_seller_type") + "</label><span class='lot-details-desc col-md-6'>" + data.std + "</span></div></div>"
		tmpl += "<div id='hepart_seller_name'><div class='details hepart_row'><label>" + getTranslatedText("hepart_seller_name") + "</label><span  class='lot-details-desc col-md-6'>" + data.snm + "</span></div></div>"
		container.prepend($(tmpl));
		if (data.std.toLowerCase().indexOf('dealer') !== -1) {
			storeDataToDB('dealersList', data.lotNumberStr);
		}
	}
	if (data.rc) {
		var container = $(document.querySelectorAll('[data-uname~="lotdetailVin"]'));
		container = container.parent().parent();
		var tmpl = "<div id='hepart_repair_cost'><div class='details hepart_row'><label>" + getTranslatedText("hepart_repair_cost") + "</label><span class='lot-details-desc col-md-6'>" + formatter1.format(data.rc) + " " + data.cuc + "</span></div></div>"
		container.prepend($(tmpl));
	}
	if (data.ahb !== 0) {
		var container = $(document.querySelectorAll('[name=counterBidForm] .sold-bid .sold'));
		var tmpl = "<div id='hepart_final_price' class='sold hepart_final_price'>" + getTranslatedText("hepart_final_price") + formatter1.format(data.ahb) + " " + data.cuc + "</div>"
		container.after($(tmpl));
	}

	if (data.ifs) {
		var container = $(document.querySelectorAll('[data-uname~=lotdetailSaleinformationsaledatelabel]')).parent().hide();
		var a = new Date(data.ad);
		var tmpl = '<div class="details auction_date"><label>' + getTranslatedText("hepart_sale_date") + '</label><div><div><span class="col1 lot-details-desc padding-right sale-date">' + dateFormat(a, "ddd. mmm dS, yyyy h:MM TT") + '</span></div></div></div>';
		container.after($(tmpl));
	}

	if (!isSellerRowDataAvailable && !isRepairCostDataAvailable && !isFinalPriceDataAvailable && !data.ifs) {
		var container = $('#hepart_button');
		var tmpl = "<span id='hepart_no_data'>" + getTranslatedText("hepart_no_data") + "</span>";
		container.before($(tmpl));
	}
}

var formatter1 = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

chrome.extension.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.action === "drawHepartBtn") {
			var i = setInterval(
				function () {
					if ($('#email').length === 0) return;
					clearInterval(i);
					drawHepardButton();
				}, 1000);
		}
		if (request.action === "drawDealers") {
			var i = setInterval(
				function () {
					if ($('#serverSideDataTable tr').length === 0) return;
					clearInterval(i);
					console.log('LOADED');
					if (!AppState.Opts.isNeedtoShowDealers) return;
				 	listenMutations();
				}, 2000);
		}
	}
);

function listenMutations() {
	var callback = function (allmutations) {
		console.log('MUTATIONS');
		markDealersOnTable('dealersList', '#serverSideDataTable tr');
	},
		mo = new MutationObserver(callback),
		options = {
			'attributeFilter': ['class'],
			'childList': true,
			'subtree': false,
			'attributes': true
		}
	mo.observe($('#serverSideDataTable_paginate')[0], options);
	markDealersOnTable('dealersList', '#serverSideDataTable tr');

}

/*
Options start
*/
$(function () {
	chrome.storage.local.get("isNeedtoShowDealers", function (item) {
		if (chrome.runtime.lastError) {
			console.log("Error retrieving entry: " + chrome.runtime.lastError);
			return;
		}
		if (!_.isUndefined(item.isNeedtoShowDealers)) {
			AppState.Opts.isNeedtoShowDealers = item.isNeedtoShowDealers;
		} else {
			AppState.Opts.isNeedtoShowDealers = true;
		}
	});
});

/*
Options end
*/


function storeDataToDB(storageName, lotId) {
	chrome.storage.local.get(storageName, function (obj) {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (_.isUndefined(obj[storageName])) {
			var d = JSON.stringify(new Array(lotId));
			putIntoStore(storageName, d)
		} else if (storedData && _.indexOf(storedData, lotId) === -1) {
			storedData.push(lotId);
			storedData = JSON.stringify(storedData);
			putIntoStore(storageName, storedData);
		}
	});
}

function putIntoStore(storageName, storedData) {
	var dataToStore = {};
	dataToStore[storageName] = storedData;
	chrome.storage.local.set(dataToStore, function () {
		if (chrome.runtime.error) {
			console.log("Runtime error.");
		}
	});
}

function markDealersOnTable(storageName, element) {

	if (!AppState.Opts.isNeedtoShowDealers) return;

	var selector = $(element);
	chrome.storage.local.get(storageName, function (obj) {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (storedData) {
			_.each(storedData, function (item) {
				selector.find('a[data-url="./lot/' + item + '"]').closest('tr').removeClass('dealer').addClass('dealer');
			});
		}
	});
}


function findAndMarkForbiddenStates() {
	var mainTable = $('#serverSideDataTable tr');
	var doctypePosition = $('#serverSideDataTable th span.title:contains("Doc Type")')
	var doctypeIndex = $('#serverSideDataTable th span.title').index(doctypePosition) || 0;
	var stateColumn = mainTable.find('td:nth-child('+ (doctypeIndex - 1) +') a span');

	$.each(stateColumn, function (idx, value) {
		var el = $(value).text();
		var isOnSearchPage = ['WI -', 'MI -', 'AL -', 'HI -', 'AK -'].find(function (state) {
			return el.includes(state);
		});
		if (isOnSearchPage) {
			mainTable.eq(idx - 1).removeClass('dealer').addClass('dealer')
		}
	});

}




