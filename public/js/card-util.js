'use strict';
/**
 * card-util.js
 *
 * Included on multiple pages across this site, it
 * provides functionality for interacting with cards.
 * Hopefully more than flipping them, eventually.
 */

(function(){
$(document).on('ready', function cardUtilOnReady() {

	console.log('Loaded card-util.js');

	var navbarMargin = 70; // in pixels. Look at the bootstrap navbar-fixed-top CSS for why
	var desiredCardHeight = document.documentElement.clientHeight - (navbarMargin * 2);
	var user = {};

	// $('.card').css('height', desiredCardHeight + 'px');

	// Flip the card when clicked
	$('.card').on('click', function onCardClicked() {
		$(this).toggleClass('flipped');
	});

	// Copy the user data from the server into this closure so we have it
	function refreshUserData() {
		$.post('/userdata', function (data) {
			user = data;
			console.log('Updating the badges in the reroll chore buttons');
			$('.reroll-chore-btn').children('.badge').each(function(index,elt){
				if ( user.rerolls <= 0 ) {
					$(elt).text('');
				}
				else {
					$(elt).text(user.rerolls + ' left');
				}
			});
			if ( user.rerolls <= 0 ) {
				$('.reroll-chore-btn').attr('disabled', true);
			}
		});
	};
	refreshUserData();

});})();