var mongoose = require('mongoose'),
 client = require('socket.io').listen(3000).sockets,
 request = require('request');

mongoose.connect('mongodb://localhost/434game', function(err, db) {
  if (err) throw err;
var db = mongoose.connection
  client.on('connection', function(socket) {
    allClients.push(socket);

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
    socket.on('input', function(data){
      var name = data.name, message = data.message, whitespacePattern = /^\s*$/

      if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
        sendStatus('Name and message is required.')
      } else {
        msg.insert({name: name, message: message}, function() {
          client.emit('output', [data])
          sendStatus({
            message: "Message sent",
            clear: true
          })
        })
      }
    })
    /* End user input handler */
  })
})()
