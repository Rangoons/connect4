$(document).ready(function() {
    for(var i = 0; i < 6; i++){
        $('#board table').append('');
        for(var j = 0; j < 7; j++) {
            $('#board tr').last().append('');
            $('#board td').last().addClass('box').attr('data-row', i).attr('data-column', j);
        }
    }
});
