function save_options() {
    var isNeedtoShowDealers =  $('#showDealersInSearchPage').prop('checked');
    console.log('showDealersInSearchPage', isNeedtoShowDealers);
    browser.storage.local.set({
        isNeedtoShowDealers: isNeedtoShowDealers
    }, function() {
      var status = $('#status');
      status.text(chrome.i18n.getMessage('o_saved'));
      setTimeout(function() {
        status.text('');
      }, 1000);
    });
  }
  
 function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    browser.storage.local.get({
        isNeedtoShowDealers: true
    }, function(items) {
      $('#showDealersInSearchPage').attr('checked', items.isNeedtoShowDealers)
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  $('#save').on('click', save_options);