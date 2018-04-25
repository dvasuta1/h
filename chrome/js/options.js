function save_options() {
    var isNeedtoShowDealers = $('#showDealersInSearchPage').prop('checked');
    var isNeedToHideCountriesFooter = $('#hideCountriesFooter').prop('checked');
    var isNeedToHideAnnoyingFooter = $('#hideAnnoyingFooter').prop('checked');
    analytics('hepart.send', 'event', 'options', 'buttonsState', 'showDealersInSearchPage', Number(isNeedtoShowDealers));
    analytics('hepart.send', 'event', 'options', 'buttonsState', 'hideCountriesFooter',  Number(isNeedToHideCountriesFooter));
    analytics('hepart.send', 'event', 'options', 'buttonsState', 'hideAnnoyingFooter',  Number(isNeedToHideAnnoyingFooter));
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
  chrome.storage.local.get({
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


  analytics('send', 'pageview', 'options.html');