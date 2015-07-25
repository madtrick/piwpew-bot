'use strict';

var WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:8080');
var rotation = 30;

function move (ws, direction) {
  if (rotation === 30) {
    rotation = 330;
  } else {
    rotation = 30;
  }

  ws.send(JSON.stringify({type: 'MovePlayerCommand', data: [{move: direction}, {rotate: rotation}]}));
}

ws.on('open', function open () {
  var direction = 'forward';

  ws.send(JSON.stringify({type: 'RegisterPlayerCommand', data: {}}), { mask: true });

  ws.on('message', function (json) {
    var message = JSON.parse(json)[0];
    var data    = message.data;

    console.log('message received: ', message.type);

    switch (message.type) {
      case 'RegisterPlayerAck':
        break;
      case 'StartGameOrder':
        move(ws, 'forward');
        break;
      case 'MovePlayerAck':
        if (data.x > 700) {
          direction = 'backward';
        } else if (data.x < 100) {
          direction = 'forward';
        }

        move(ws, direction);
        break;
      default:
        console.log('unexpected message');
    }
  });
});
