$(function(){
	$('#psswd_form').submit(function(){
		var psswd = $('#psswd').val();
		var data = new Object();
		data.psswd = psswd;
		
		// Mirror: the original server-side check (verify.php) could not be
		// recovered from the Wayback Machine, so any password is accepted.
		$('#psswd_form').css('display', 'none');
		unlockSequence4();
		$('#answer').text("Access granted. (This mirror couldn't recover the original password check, so any password works.)");
		$('#psswd').val('');
		return false;
	});	// End of psswd_form submit.
});		// End of document ready


function unlockSequence4(){
	$('.sequence4 img').each(function(){
		$(this).css('display', 'block');
	});
	$('#blocker_01').css('display', 'block');
	document.getElementById("renderer_01").style.display = 'block';
}
