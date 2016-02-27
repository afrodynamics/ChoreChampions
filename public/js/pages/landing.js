/**
 * Landing page. Shows/hides the forms for create/joining
 * a house.
 */

(function(){
	$(document).on('ready', function() {

		// Enable collapse plugin
		$('#buttonContainer').collapse({
			toggle: true
		})
		$('#create-form').collapse({
			toggle: false
		});
		$('#join-form').collapse({
			toggle: false
		});

		// If the join/create forms are opened, hide the button container
		$('#create-form').on('show.bs.collapse', function(){
			$('#buttonContainer').collapse('hide');
		});
		$('#join-form').on('show.bs.collapse', function(){
			$('#buttonContainer').collapse('hide');
		});
		// ... but if they are hidden, we must show the button container
		$('#create-form').on('hide.bs.collapse', function(){
			$('#buttonContainer').collapse('show');
		});
		$('#join-form').on('hide.bs.collapse', function(){
			$('#buttonContainer').collapse('show');
		});

		$("#info-btn").click(function(e){
			ga("send", "event", "info", "click");
		});

		$("#next-btn").click(function(e){
			ga("send", "event", "next", "click");
		});

	})
})();