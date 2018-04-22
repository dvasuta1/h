function save_options() {
    var isNeedtoShowDealers = $('#showDealersInSearchPage').prop('checked');
    var isNeedToHideCountriesFooter = $('#hideCountriesFooter').prop('checked');
    var isNeedToHideAnnoyingFooter = $('#hideAnnoyingFooter').prop('checked');
    chrome.storage.local.set({
        isNeedtoShowDealers: isNeedtoShowDealers,
        isNeedToHideCountriesFooter: isNeedToHideCountriesFooter,
        isNeedToHideAnnoyingFooter: isNeedToHideAnnoyingFooter,
    }, function() {
      var status = $('#status');
      status.text(chrome.i18n.getMessage('o_saved'));
      setTimeout(function() {
        status.text('');
      }, 1000);
    });
  }
  
 function restore_options() {
  browser.storage.local.get({
        isNeedtoShowDealers: true,
        isNeedToHideCountriesFooter: true,
        isNeedToHideAnnoyingFooter: false
    }, function(items) {
      $('#showDealersInSearchPage').attr('checked', items.isNeedtoShowDealers);
      $('#hideCountriesFooter').attr('checked', items.isNeedToHideCountriesFooter);
      $('#hideAnnoyingFooter').attr('checked', items.isNeedToHideAnnoyingFooter);
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  $('#save').on('click', save_options);


  // lotsearchSaletitletype  
  // ST - AL, 
  //CT - WI
  // - MI
  // - AK
  // HI