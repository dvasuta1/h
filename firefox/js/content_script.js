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
		var tmpl = "<div id='hepart_repair_cost'><div class='details hepart_row'><label>" + getTranslatedText("hepart_repair_cost") + "</label><span class='lot-details-desc col-md-6'>" + formatter.format(data.rc) + " " + data.cuc + "</span></div></div>"
		container.prepend($(tmpl));
	}
	if (data.ahb !== 0) {
		var container = $(document.querySelectorAll('[name=counterBidForm] .sold-bid .sold'));
		var tmpl = "<div id='hepart_final_price' class='sold hepart_final_price'>" + getTranslatedText("hepart_final_price") + formatter.format(data.ahb) + " " + data.cuc + "</div>"
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

var formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

browser.runtime.onMessage.addListener(
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
					listenMutations();
					//markDealersOnTable('dealersList', '#serverSideDataTable tr');
					
				}, 2000);
		}
	}
);


/*
Options start
*/
$(function () {
	var isNeedtoShowDealers = browser.storage.local.get("isNeedtoShowDealers");
	isNeedtoShowDealers.then(function (item) {
		if (!_.isUndefined(item.isNeedtoShowDealers)) {
			AppState.Opts.isNeedtoShowDealers = item.isNeedtoShowDealers;
		} else {
			AppState.Opts.isNeedtoShowDealers = true;
		}
	}, function (error) {
		console.error(`Error: ${error}`);
	});
});

/*
Options end
*/

function storeDataToDB(storageName, lotId) {
	browser.storage.local.get(storageName, function (obj) {
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
	browser.storage.local.set(dataToStore, function () {
		if (browser.runtime.lastError) {
			console.error("Runtime error.");
		}
	});
}

function markDealersOnTable(storageName, element) {

	if (!AppState.Opts.isNeedtoShowDealers) return;

	var selector = $(element);
	browser.storage.local.get(storageName, function (obj) {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (storedData) {
			_.each(storedData, function (item) {
				selector.find('a[data-url="./lot/' + item + '"]').closest('tr').removeClass('dealer').addClass('dealer');
			});
		}
	});
}

function listenMutations(){
	var callback = function(allmutations){
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
	mo.observe(document.getElementById('serverSideDataTable_paginate'), options);	
	markDealersOnTable('dealersList', '#serverSideDataTable tr');
	
}

function markForbiddenState() {
	var states = ['- AL', ' - WI', '- MI', '- AK', '- HI'];
	//$('#serverSideDataTable tr td span[data-uname="lotsearchLotyardname"]:contains("AL -")').closest('tr').addClass('forbiddenState');
	/*
		var callback = function(allmutations){
			// allmutations — массив, и мы можем использовать соответствующие методы JavaScript.
			allmutations.map( function(mr){
				var mt = 'Тип изменения: ' + mr.type;  // записываем тип изменения
				mt += 'Измененный элемент: ' + mr.target; // записываем измененный элемент.
				console.debug( mt );
			});
		
		},
		mo = new MutationObserver(callback),
		options = {
			// обязательный параметр: наблюдаем за добавлением и удалением дочерних элементов.
			'childList': true,
			// наблюдаем за добавлением и удалением дочерних элементов любого уровня вложенности.
			'subtree': true,
			'attributes': true
		}
		mo.observe($('#serverSideDataTable tr')[0], options); */
}

/*
document.addEventListener('DOMContentLoaded', function () {
	var targetNode = $('#serverSideDataTable')[0];

	var observer = new MutationObserver(function (mutationRecords) {
		$('#serverSideDataTable tr td span[data-uname="lotsearchLotyardname"]:contains("AL -")').closest('tr').addClass('forbiddenState');
	});

	observer.observe(targetNode,
		{  // options:
			subtree: true,  // observe the subtree rooted at myNode
			childList: true
		});
});
*/