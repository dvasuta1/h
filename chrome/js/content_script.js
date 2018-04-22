'use strict';

//TODO:
//All this fucking crap must be refactored in next major version

var Opts = {};
var preferences = browser.storage.local.get(["isNeedtoShowDealers", "isNeedToHideCountriesFooter", "isNeedToHideAnnoyingFooter"]);
preferences
	.then((prefs) => {
		Opts.isNeedtoShowDealers = prefs.isNeedtoShowDealers;
		Opts.isNeedToHideCountriesFooter = prefs.isNeedToHideCountriesFooter;
		Opts.isNeedToHideAnnoyingFooter = prefs.isNeedToHideAnnoyingFooter;

		if (Opts.isNeedToHideAnnoyingFooter) {
			$('.footer.footer .footer-mid').addClass('hidden');
			$(function () {
				$(`<div id="showbtn" title="getTranslatedText("hepart_show_footer")"></div>`).appendTo('.footer.footer .footer-top .row:first-child');
			});
			$(document).on('click', '#showbtn', function (e) {
				$('.footer.footer .footer-mid').toggleClass('hidden');
				$('#showbtn').toggleClass('off');
				window.scrollTo(0, document.body.scrollHeight);
			});
		}

		if (Opts.isNeedToHideCountriesFooter) {
			$('.footer-bottom.footer-btm').addClass('hidden');
		}

		chrome.runtime.onMessage.addListener(
			function (request, sender, sendResponse) {
				if (request.action === "drawHepartBtn") {
					var i = setInterval(
						function () {
							if ($('#email').length === 0) return;
							clearInterval(i);
							drawHepardButton();
						}, 1000);
				}
				if (request.action === "drawDealers" && Opts.isNeedtoShowDealers) {
					var i = setInterval(
						function () {
							if ($('#serverSideDataTable tr').length === 0) return;
							clearInterval(i);
							console.log('LOADED');
							listenMutations();
						}, 2000);
				}
				if (request.action === "addToBookmarks") {
					addToBookmarks();
				}
			}
		);
	})
	.catch((error) => console.error(`Error: ${error}`));

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
			getLotinfoById();
		});
}

function getLotId() {
	var url = window.location.href.replace(/\/$/, '');
	return url.substr(url.lastIndexOf('/') + 1);
}

function getLotinfoById() {
	var lotId = getLotId();
	if (lotId) {
		 fetch("https://www.copart.com/public/data/lotdetails/solr/" + lotId)
		 .then((response) => {
			 return response.json();
 		 })
		 .then((data) => {
			data && data.data.lotDetails && insertTableRows(data.data.lotDetails);
		 })
		 .catch((error) => console.error(`Error: ${error}`));
	} else {
		throw new Error('Wrong lot id!');
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
		var tmpl = `<div id='hepart_seller_type'><div class='details hepart_row'><label>${getTranslatedText("hepart_seller_type")}</label><span class='lot-details-desc col-md-6'>${data.std}</span></div></div>`;
		tmpl += `<div id='hepart_seller_name'><div class='details hepart_row'><label>${getTranslatedText("hepart_seller_name")}</label><span  class='lot-details-desc col-md-6'>${data.snm}</span></div></div>`;
		container.prepend($(tmpl));
		if (data.std.toLowerCase().indexOf('dealer') !== -1) {
			storeDataToDB('dealersList', data.lotNumberStr);
		}
	}
	if (data.rc) {
		var container = $(document.querySelectorAll('[data-uname~="lotdetailVin"]'));
		container = container.parent().parent();
		var tmpl = `<div id='hepart_repair_cost'><div class='details hepart_row'><label>${getTranslatedText("hepart_repair_cost")}</label><span class='lot-details-desc col-md-6'>${formatter.format(data.rc)} ${data.cuc}</span></div></div>`;
		container.prepend($(tmpl));
	}
	if (data.ahb !== 0) {
		var container = $(document.querySelectorAll('[name=counterBidForm] .sold-bid .sold'));
		var tmpl = `<div id='hepart_final_price' class='sold hepart_final_price'>${getTranslatedText("hepart_final_price")} ${formatter.format(data.ahb)} ${data.cuc} </div>`;
		container.after($(tmpl));
	}
	if (data.ifs) {
		var container = $(document.querySelectorAll('[data-uname~=lotdetailSaleinformationsaledatelabel]')).parent().hide();
		var a = new Date(data.ad);
		var tmpl = `<div class="details auction_date"><label>${getTranslatedText("hepart_sale_date")}</label><div><div><span class="col1 lot-details-desc padding-right sale-date">${dateFormat(a, "ddd. mmm dS, yyyy h:MM TT")}</span></div></div></div>`;
		container.after($(tmpl));
	}
	if (!isSellerRowDataAvailable && !isRepairCostDataAvailable && !isFinalPriceDataAvailable && !data.ifs) {
		var container = $('#hepart_button');
		var tmpl = `<span id='hepart_no_data'>${getTranslatedText("hepart_no_data")}</span>`;
		container.before($(tmpl));
	}
}

var formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});


/*
Options start
*/
/*
$(function () {
	
	$('ul.navbar-nav').append(`<li><a href="#" class="menu_click goToBookmarks">Bookmarks</a></li>`)
});
*/
/*
Options end
*/

function storeDataToDB(storageName, lotId) {
	browser.storage.local.get(storageName).then((obj) => {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (_.isUndefined(obj[storageName])) {
			var d = JSON.stringify(new Array(lotId));
			putIntoStore(storageName, d)
		} else if (storedData && _.indexOf(storedData, lotId) === -1) {
			storedData.push(lotId);
			storedData = JSON.stringify(storedData);
			putIntoStore(storageName, storedData);
		}
	}).catch((error) => console.error(`Error: ${error}`));

}

function putIntoStore(storageName, storedData, callback) {
	console.debug('putIntoStore');
	var dataToStore = {};
	dataToStore[storageName] = storedData;
	browser.storage.local.set(dataToStore).then(() => {
		if (chrome.runtime.lastError) {
			console.error("Runtime error.");
		}
		callback && callback();
	}).catch((error) => console.error(`Error: ${error}`));

}

function markDealersOnTable(storageName, element) {

	if (!Opts.isNeedtoShowDealers) return;
	var selector = $(element);
	browser.storage.local.get(storageName).then((obj) => {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (storedData) {
			_.each(storedData, function (item) {
				selector.find('a[data-url="./lot/' + item + '"]').closest('tr').removeClass('dealer').addClass('dealer');
			});
		}
	}).catch((error) => console.error(`Error: ${error}`));

}

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
	mo.observe(document.getElementById('serverSideDataTable_paginate'), options);
	markDealersOnTable('dealersList', '#serverSideDataTable tr');
}

/**
 * Boolmarks start
 */

function drawFavBtn() {
	if ($('#hepart_fav_button').length != 0) return;

	var d = document.createElement('span');
	$(d).attr('id', 'hepart_fav_button')
		.text('FAV')
		.insertAfter($(".lot-vehicle-info"))
		.click(function () {
			$(this).addClass('active');
			$(this).off('click');
			addToBookmarks();
		});
}

function addToBookmarks() {
	var lotTitle = $('h1.lot-vehicle-info').html()
		.replaceAll('../images/global/highlightIcons-us.png', '../../img/highlightIcons-us.png')
		.replace(/<\!--.*?-->/g, "")
		.replace(/[\n\r]+/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.replace(/^\s+|\s+$/, '');
	var fav = {};
	fav.img = $('#carouselcontainer a.active img.img-responsive').prop('src');
	fav.title = lotTitle;
	fav.cleanTitle = $('h1.lot-vehicle-info .title').text();
	fav.lotId = getLotId();
	fav.saleDate = $('.lot-details-desc.sale-date').text().replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/, '');
	storeBookmarkToDB('bookmark_' + fav.lotId, fav);
}


String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

function storeBookmarkToDB(storageName, data) {
	console.debug('storeBookmarkToDB');
	browser.storage.local.get(storageName).then((obj) => {
		var storedData = !_.isEmpty(obj) && JSON.parse(obj[storageName]);
		if (_.isUndefined(obj[storageName])) {
			console.log('data', data);
			putIntoStore(storageName, JSON.stringify(data), addBookmarkNotification(data));
		}
	}).catch((error) => console.error(`Error: ${error}`));;
}

function addBookmarkNotification(data) {
	console.debug('addBookmarkNotification');
	chrome.runtime.sendMessage({
		id: "bookmarkAdded",
		title: chrome.i18n.getMessage("notification_bookmark_added_title"),
		message: chrome.i18n.getMessage("notification_bookmark_added_message", data.cleanTitle),
		iconUrl: data.img
	});
}

/* Boormarks end */