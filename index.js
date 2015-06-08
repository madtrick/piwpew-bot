'use strict';

var WebSocket = require('ws');

var ws = new WebSocket('ws://localhost:8080');

function move (ws) {
  var movements = [
    {type: 'MovePlayerCommand', data: [{move: 'forward'}]},
    {type: 'MovePlayerCommand', data: [{move: 'backward'}]}
  ];
  var  momevement = movements[Math.round(Math.random())];

  ws.send(JSON.stringify(momevement));
}

ws.on('open', function open () {
  ws.send(JSON.stringify({type: 'RegisterPlayerCommand', data: {}}), { mask: true });
  ws.on('message', function (data) {
    var message = JSON.parse(data);

    console.log('message received: ', message.type);

    switch (message.type) {
      case 'RegisterPlayerAck':
        break;
      case 'StartGameOrder':
        move(ws);
        break;
      case 'MovePlayerAck':
        move(ws);
        break;
      default:
        console.log('unexpected message: ', message);
    }
  });
});
