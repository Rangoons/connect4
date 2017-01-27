(function() {
  var getNode = function(s) {
    return document.querySelector(s);
  },
  textarea = getNode('.chat textarea'),
  messages = getNode('.chat-messages'),
  status = getNode('.chat-status span'),
  name = getNode('#username'),
  userbtn = getNode('#userSub'),
  statusDefault = status.textContent,
  setStatus = function(s){
    status.textContent = s

    if (s !== statusDefault) {
      var delay = setTimeout(function() {
        setStatus(statusDefault)
        clearInterval(delay)
      }, 3000)
    }
  }

  try {
    var socket = io.connect('http://127.0.0.1:3000')
  } catch(e) {

  }

  if (socket !== undefined) {
    console.log("OK");
    console.log(socket)
    socket.emit("addUserToLobby",{
      name: name.value
    })
    //listen for output
    socket.on('output', function(data) {
      if (data.length) {
        for (var x = 0; x < data.length; x++) {
          var message = document.createElement('div')
          message.setAttribute('class', 'chat-message')
          message.textContent = data[x].name + ': ' + data[x].message
          messages.appendChild(message)
          //messages.insertAfter(message, messages.lastChild);
        }
      }
    })
    //listen for a status
    socket.on('status', function(data) {
      setStatus((typeof data === 'object') ? data.message : data)

      if (data.clear === true) {
        textarea.value = ''
      }
    })

    textarea.addEventListener('keydown', function(event){
      var self = this

      if (event.which === 13 && event.shiftKey === false) {
        socket.emit('input', {
          name:name.value,
          message: self.value
        })
        event.preventDefault()
      }
    })
  }
})();
