'use strict';

// Call this function when the page loads (the "ready" event)
$(document).on('ready', function() {

  var user = {};

  /*
   * Get user data from the server.
   */
  function refreshUserData() {
    $.post('/userdata', function(data) {
      user = data;
      // Update the gold badge
      $('span.badge.gold-badge').text(user.gold + ' gold');
    });
  };

  console.log("Javascript connected!");

  $('#failPurchase').hide();
  $('#successPurchase').hide();

  function buyItem(item, price) {
    $.post('/buy', {
      item:   item,
      price:  price,
      userid: user.userid
    });
  };

  // Set up buy button handler
  
  $(".buy-button").click(function(){

  	var item = $(this).parent().find('input.name-hack').val();
  	var price = Number.parseInt( $(this).parent().find('input.price-hack').val() );

    $('div.alert').hide();
		if ( user.gold - price < 0 ) {
      $('#failPurchase').show();
      $('#failPurchase').children('span').text(item);
      setTimeout(function(){
        $('#failPurchase').fadeOut(1000);
      },3000);
		}
		else {
      $('#successPurchase').show();
      $('#successPurchase').children('span').text(item);
      setTimeout(function(){
        $('#successPurchase').fadeOut(1000);
      },3000);
      buyItem(item,price);
			user.gold -= price;
		}
    refreshUserData();

  });
  
  refreshUserData();

});