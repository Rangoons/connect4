$(document).ready(function() {

    var socket = io.connect('http://127.0.0.1:3000');

    function Player(room, pid) {
        this.room = room;
        this.pid = pid;
    }

    var room = $('input').data('room');
    var player = new Player(room, '', '');

    socket.on('connect', function() {
        socket.emit('join', {room: room});
    });

    socket.on('assign', function(data) {
        player.color = data.color;
        player.pid = data.pid;
        if(player.pid == 1) {
            $('.p1-score p').addClass('current');
        }
        else {
            $('.p2-score p').addClass('current');
        }
    });

    socket.on('leave', function() {
        window.location = '/game/lobby';
    });

    socket.on('notify', function(data) {
        if(data.connected == 1) {
            if(data.turn)
                console.log('Players Connected! Your turn');
            else
                console.log('Players Connected! Opponent\'s turn');
        }
    });

    $('.box').click(function() {
        // find the box to drop the disc to
        var click = {
            row: $(this).data('row'),
            column: $(this).data('column')
        };
        socket.emit('click', click);
    });

    socket.on('drop', function(data) {
        var row = 0;
        stopVal = setInterval(function() {
            if(row == data.row)
                clearInterval(stopVal);
            fillBox(row, data.column, data.color);
            row++;
        }, 25);
    });

    function fillBox(row, column, color) {
        $('[data-row="'+(row-1)+'"][data-column="'+column+'"]').css('background', '');
        $('[data-row="'+row+'"][data-column="'+column+'"]').css('background', color);
    }

    socket.on('reset', function(data) {
        if(data.highlight) {
            setTimeout(function() {
                data.highlight.forEach(function(pair) {
                    $('[data-row="'+pair[0]+'"][data-column="'+pair[1]+'"]').css('background-color', '#65BD77');
                });
            }, 500);
        }

        setTimeout(function() {
            $('td').css('background-color', '')
            alertify.confirm(data.text, function(e) {
                if(e) {
                    socket.emit('continue');
                }
                else {
                    window.location = '/game/lobby';
                }
            });
        }, 1200)

        // Set Scores
        p1 = parseInt($('.p1-score p').html())+data['inc'][0];
        $('.p1-score p').html(p1);
        p2 = parseInt($('.p2-score p').html())+data['inc'][1];
        $('.p2-score p').html(p2);
    });
});
