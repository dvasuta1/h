function save_options() {
    var isNeedtoShowDealers =  $('#showDealersInSearchPage').prop('checked');
    chrome.storage.sync.set({
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
    chrome.storage.sync.get({
        isNeedtoShowDealers: true
    }, function(items) {
      $('#showDealersInSearchPage').attr('checked', items.isNeedtoShowDealers)
    });
  }
  document.addEventListener('DOMContentLoaded', restore_options);
  $('#save').on('click', save_options);