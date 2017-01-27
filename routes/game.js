var express = require('express')
var router = express.Router()

router.get('/lobby', function(req,res){

  res.render('lobby')
})

router.get('/game', function(req,res){
    share = generateRoom(6);
    console.log("share: "+share)
  res.render('game', {shareURL: req.protocol + '://' + req.get('host') +'/game/game/' + share, share: share})
})
router.get('/game/:room([A-Za-z0-9]{6})', function(req, res) {
    share = req.params.room;
    res.render('game', {shareURL: req.protocol + '://' + req.get('host') + '/' + share, share: share});
})

function generateRoom(length) {
    var haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var room = '';

    for(var i = 0; i < length; i++) {
        room += haystack.charAt(Math.floor(Math.random() * 62));
    }

    return room;
};


module.exports = router
