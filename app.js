var express = require('express')
var app = express()
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var exphbs = require('express-handlebars')
var expressValidator = require('express-validator')
var flash = require('connect-flash')
var session = require('express-session')
var passport = require('passport')
var LocalStrategy = require('passport-local'),Strategy
var mongo = require('mongodb')
var mongoose = require('mongoose')
var server = require('http').createServer(app)
var io = require('socket.io')(server)
var request = require('request')


// mongoose.connect('mongodb://localhost/434game')
// var db = mongoose.connection

mongoose.connect('mongodb://localhost/434game', function(err, db) {
  if (err) throw err;
var db = mongoose.connection
  io.on('connection', function(socket) {
    // allClients.push(socket);
    console.log(socket.id)
    var msg = db.collection('messages'),
    sendStatus = function(s){
      socket.emit('status', s)
    }

    /* Emit all messages */
    msg.find().limit(20).sort({_id: 1}).toArray(function(err, res) {
      if(err) throw err;
      socket.emit('output', res)
    })

    // var ip;
    //
    // /* Print ip of who connected to console */
    // request('http://ipinfo.io', function(error, res, body) {
    //   ip = JSON.parse(body)
    //   console.log(ip.ip + " has connected")
    // })
    //
    // /* Print ip of who disconnected to console */
    // socket.on('disconnect', function() {
    //   console.log(ip.ip " has disconnected");
    // });

    /* Handler user input */
    io.on('input', function(data){
      var name = data.name, message = data.message, whitespacePattern = /^\s*$/

      if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
        sendStatus('Name and message is required.')
      } else {
        msg.insert({name: name, message: message}, function() {
          io.emit('output', [data])
          sendStatus({
            message: "Message sent",
            clear: true
          })
        })
      }
    })
    /* End user input handler */
  })
})

// Helper function
function getPair(row, column, step) {
    l = [];
    for(var i = 0; i < 4; i++) {
        l.push([row, column]);
        row += step[0];
        column += step[1];
    }
    return l;
}

// a list to hold win cases
var check = [];

check.push(function check_horizontal(room, row, startColumn, callback) {
    for(var i = 1; i < 5; i++) {
        var count = 0;
        var column = startColumn + 1 - i;
        var columnEnd = startColumn + 4 - i;
        if(columnEnd > 6 || column < 0) {
            continue;
        }
        var pairs = getPair(row, column, [0,1]);
        for(var j = column; j < columnEnd + 1; j++) {
            count += games[room]['board'][row][j];
        }
        if(count == 4)
            callback(1, pairs);
        else if(count == -4)
            callback(2, pairs);
    }
});

check.push(function check_vertical(room, startRow, column, callback) {
    for(var i = 1; i < 5; i++) {
        var count = 0;
        var row = startRow + 1 - i;
        var rowEnd = startRow + 4 - i;
        if(rowEnd > 5 || row < 0) {
            continue;
        }
        var pairs = getPair(row, column, [1,0]);
        for(var j = row; j < rowEnd + 1; j++) {
            count += games[room]['board'][j][column];
        }
        if(count == 4)
            callback(1, pairs);
        else if(count == -4)
            callback(2, pairs);
    }
});

check.push(function check_leftDiagonal(room, startRow, startColumn, callback) {
    for(var i = 1; i < 5; i++) {
        var count = 0;
        var row = startRow + 1 - i;
        var rowEnd = startRow + 4 - i;
        var column = startColumn + 1 - i;
        var columnEnd = startColumn + 4 - i;
        if(column < 0 || columnEnd > 6 || rowEnd > 5 || row < 0) {
            continue;
        }
        var pairs = getPair(row, column, [1,1]);
        for(var j = 0; j < pairs.length; j++) {
            count += games[room]['board'][pairs[j][0]][pairs[j][1]];
        }
        if(count == 4)
            callback(1, pairs);
        else if(count == -4)
            callback(2, pairs);
    }
});


check.push(function check_rightDiagonal(room, startRow, startColumn, callback) {
    for(var i = 1; i < 5; i++) {
        var count = 0;
        var row = startRow + 1 - i;
        var rowEnd = startRow + 4 - i;
        var column = startColumn -1 + i;
        var columnEnd = startColumn - 4 + i;
        if(column < 0 || columnEnd > 6 || rowEnd > 5 || row < 0) {
            continue;
        }
        var pairs = getPair(row, column, [1,-1]);
        for(var j = 0; j < pairs.length; j++) {
            count += games[room]['board'][pairs[j][0]][pairs[j][1]];
        }
        if(count == 4)
            callback(1, pairs);
        else if(count == -4)
            callback(2, pairs);
        else {
            check_draw(room, function() {
                games[room].board = [[0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0]];
                io.sockets.in(room).emit('reset', {'text': 'Game Drawn', 'inc': [0,0]});
            });
        }
    }
});

// Function to check for draw
function check_draw(room, callback) {
    for(var index in games[room]['board'][0]) {
        if(games[room]['board'][0][index] == 0)
            return;
    }
    callback();
}

// an object to hold all gamestates. Key denotes room id
var games = {};

io.sockets.on('connection', function(socket) {
    socket.on('join', function(data) {
        if(data.room in games) {
            if(typeof games[data.room].player2 != "undefined") {
                socket.emit('leave');
                return;
            }
            socket.join(data.room);
            socket.room = data.room
            socket.color = '#FB6B5B'
            socket.pid = -1
            games[data.room].player2 = socket
            // Set opponents
            socket.opponent = games[data.room].player1
            games[data.room].player1.opponent = games[data.room].player2

            // Set turn
            socket.turn = false
            socket.opponent = function(err, opponent) {
                opponent.turn = true
            }

            socket.emit('assign', {pid: 2});

            games[data.room].player1.emit('notify', {connected: 1, turn: true});
            socket.emit('notify', {connected: 1, turn: false});
        }
        else {
            socket.join(data.room);
            socket.room = data.room
            socket.color = '#FFC333'
            socket.pid = 1
            socket.turn = false
            games[data.room] = {
                player1: socket,
                board: [[0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0]],
            };
            socket.emit('assign', {pid: 1});
        }
    });

    socket.on('click', function(data) {
      console.log(socket)
      var results = [socket.turn, socket.opponent, socket.room, socket.pid];
            if(results[0]) {
                socket.turn = false
                results[1].set('turn', true);

                var i = 5;
                while(i >= 0) {
                    if(games[results[2]].board[i][data.column] == 0) {
                        break;
                    }
                    i--;
                }
                if(i >= 0 && data.column >= 0) {
                    games[results[2]].board[i][data.column] = results[3];
                    socket.color = function(err, color) {
                        socket.emit('drop', {row: i, column: data.column, color: color});
                        results[1].emit('drop', {row: i, column: data.column, color: color});
                    }
                    var win = false;
                    check.forEach(function(method) {
                        method(results[2], i, data.column, function(player, pairs) {
                            if(player == 1) {
                                games[results[2]].player1.emit('reset', {text: 'You Won!', 'inc': [1,0], highlight: pairs });
                                games[results[2]].player2.emit('reset', {text: 'You Lost!', 'inc': [1,0], highlight: pairs });
                            }
                            else {
                                games[results[2]].player1.emit('reset', {text: 'You Lost!', 'inc': [0,1], highlight: pairs });
                                games[results[2]].player2.emit('reset', {text: 'You Won!', 'inc': [0,1], highlight: pairs });
                            }
                            games[results[2]].board = [[0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0]];
                        });
                    });
                }
            }
    });

    socket.on('continue', function() {
        socket.turn = function(err, turn) {
            socket.emit('notify', {connected: 1, turn: turn});
        }
    });

    socket.on('disconnect', function() {
        console.log('Disconnected');
        socket.room = function(err, room) {
            io.sockets.in(room).emit('leave');
            if(room in games) {
                delete games.room;
            }
        }
    });
});



var routes = require('./routes/index')
var users = require('./routes/users')
var game = require('./routes/game')



app.set('views', path.join(__dirname, 'views'))
app.engine('handlebars', exphbs({defaultLayout:'layout'}))
app.set('view engine','handlebars')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())

app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'node_modules')))

app.use(session({
  secret:'secret',
  saveUninitialized:true,
  resave:true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash())

app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null
  next()
})

app.use('/', routes)
app.use('/users', users)
app.use('/game', game)

app.set('port', (process.env.PORT || 3000))
server.listen(app.get('port'), function(){
  console.log('Server started on port ' +app.get('port'))
})
