'use strict';

var WebSocket = require('ws');
var _         = require('lodash');

var Planner  = require('./lib/planner');

var ws = new WebSocket('ws://localhost:8080');
var bot = {};

function move (ws, movement) {
  var util = require('util');
  console.log(util.inspect(movement, {showHidden: false, depth: null}));
  ws.send(JSON.stringify({
    type: 'MovePlayerCommand',
    data: [
      {move: movement.direction},
      {rotate: movement.rotation}
    ]
  }));
}

function analyzeMessage (ws, message) {
  var data = message.data;

  switch (message.type) {
    case 'RadarScanNotification':
      let movement = bot.planner.calculate(data);

      move(ws, movement);

      break;
    case 'RegisterPlayerAck':
      let coordinates = {x: data.x, y: data.y};
      let rotation = _.random(0, 360);

      bot.planner = new Planner({direction: 'forward', position: coordinates, rotation: rotation});
      break;
    case 'StartGameOrder':
      move(ws, 'forward');
      break;
    case 'MovePlayerAck':
      bot.planner.locations.current = {x: data.x, y: data.y};
      break;
    default:
      var util = require('util');
      console.log(util.inspect(message, {showHidden: false, depth: null}));
      console.log('unexpected message');
  }
}

function orderMessages (messages) {
  let order = ['MovePlayerAck', 'RadarScanNotification'];

  return messages.sort((messageA, messageB) => {
    let indexA = order.indexOf(messageA.type);
    let indexB = order.indexOf(messageB.type);

    if (indexA && indexB) {
      return indexA - indexB;
    }

    if (indexA || indexB) {
      return -1;
    }

    return 0;
  });
}

function analyzeMessages (ws, messages) {
  messages.forEach(_.partial(analyzeMessage, ws));
}

ws.on('open', function open () {
  ws.send(JSON.stringify({type: 'RegisterPlayerCommand', data: {}}), { mask: true });

  ws.on('message', function (json) {
    var messages = JSON.parse(json);

    analyzeMessages(ws, orderMessages(messages));
  });
});
