'use strict';

var fs        = require('fs');
var path      = require('path');
var WebSocket = require('ws');
var _         = require('lodash');
var yargs     = require('yargs');

var Planner  = require('./lib/planner');
var Oracle   = require('./lib/oracle');
var Gunner   = require('./lib/gunner');

var ws              = new WebSocket('ws://localhost:8080');
var bot             = {};
var gunner          = new Gunner();
var argv            = yargs.demand(['i']).argv;
var messagesLogPath = path.join(__dirname, argv.i + '-messages.log');
var oracle;
var lastMovementConfirmed = false;

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

function shoot (ws) {
  var data = {
    type: 'PlayerShootCommand',
    data: {}
  };

  writeMessagesToFile('send', data);

  ws.send(JSON.stringify(data));
}

function analyzeMessage (ws, message) {
  var data = message.data;

  switch (message.type) {
    case 'RadarScanNotification':
      if (lastMovementConfirmed) {
        let action = oracle.decide(bot, data, bot.planner, gunner);

        if (action.type === 'move') {
          move(ws, action.data);
          lastMovementConfirmed = false;
        }

        if (action.type === 'shoot') {
          shoot(ws);
        }
      }
      //let movement = bot.planner.calculate(data);

      //move(ws, movement);

      break;
    case 'RegisterPlayerAck':
      let coordinates = {x: data.x, y: data.y};
      let rotation = _.random(0, 360);

      bot.planner = new Planner({
        tracker: argv.t,
        direction: 'forward',
        position: coordinates,
        rotation: rotation
      });

      oracle = new Oracle({shooter: argv.s});
      break;
    case 'StartGameOrder':
      move(ws, {direction: 'forward', rotation: 0});
      break;
    case 'MovePlayerAck':
      lastMovementConfirmed = true;
      bot.planner.locations.current = {x: data.x, y: data.y};
      bot.location = {
        coordinates: {x: data.x, y: data.y},
        rotation: data.rotation
      };

      break;
    case 'PlayerShootAck':
      break;
    default:
      var util = require('util');
      console.log(util.inspect(message, {showHidden: false, depth: null}));
      console.log('unexpected message');
      lastMovementConfirmed = true; // reset
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

ws.on('close', function close () {
  console.log('Connection closed');
  process.exit(0);
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
