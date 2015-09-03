'use strict';

var fs        = require('fs');
var path      = require('path');
var WebSocket = require('ws');
var _         = require('lodash');
var yargs     = require('yargs');

var Planner  = require('./lib/planner');

var ws              = new WebSocket('ws://localhost:8080');
var bot             = {};
var argv            = yargs.demand(['i']).argv;
var messagesLogPath = path.join(__dirname, argv.i + '-messages.log');

function move (ws, movement) {
  var data = {
    type: 'MovePlayerCommand',
    data: [
      {move: movement.direction},
      {rotate: movement.rotation}
    ]
  };

  writeMessagesToFile('send', data);

  ws.send(JSON.stringify(data));
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
  truncateMessagesFile();

  ws.send(JSON.stringify({type: 'RegisterPlayerCommand', data: {}}), { mask: true });

  ws.on('message', function (json) {
    var messages = JSON.parse(json);

    writeMessagesToFile('recv', messages);
    analyzeMessages(ws, orderMessages(messages));
  });
});

function truncateMessagesFile () {
  if (fs.existsSync(messagesLogPath)) {
    fs.truncateSync(messagesLogPath);
  }
}

function writeMessagesToFile (prefix, messages) {
  var data = '[' + prefix + ']' + JSON.stringify(messages) + '\n';

  fs.appendFileSync(messagesLogPath, data);
}
