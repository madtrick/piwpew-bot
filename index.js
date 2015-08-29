'use strict';

var WebSocket = require('ws');
var _         = require('lodash');

var ws = new WebSocket('ws://localhost:8080');

function move (ws, direction, rotation) {
  rotation = rotation || 45;

  console.log('Direction', direction, 'rotation', rotation);

  ws.send(JSON.stringify({
    type: 'MovePlayerCommand',
    data: [
      {move: direction},
      {rotate: rotation}
    ]
  }));
}

function analyzeMessage (ws, message) {
  var data = message.data;
  var rotation = 45;
  var direction = 'forward';


  switch (message.type) {
    case 'RadarScanNotification':
      if (data.walls.length > 0) {
        rotation = _.random(rotation + 90, rotation + 270);
        move(ws, 'forward', rotation);
      }

      break;
    case 'RegisterPlayerAck':
      break;
    case 'StartGameOrder':
      move(ws, 'forward');
      break;
    case 'MovePlayerAck':
      if (data.x > 700) {
        direction = 'backward';
      } else if (data.x < 700 || data.x > 100) {
        direction = 'forward';
      }

      move(ws, direction);
      break;
    default:
      console.log('unexpected message');
  }
}

function analyzeMessages (ws, messages) {
  messages.forEach(_.partial(analyzeMessage, ws));
}

ws.on('open', function open () {
  ws.send(JSON.stringify({type: 'RegisterPlayerCommand', data: {}}), { mask: true });

  ws.on('message', function (json) {
    var messages = JSON.parse(json);

    analyzeMessages(ws, messages);
  });
});
