# About

Framework to build bots for Pewpew

## Game

Pewpew is a game where bots, coded by you or others, fight agains each other. The game dynamics are quite simple:

1. Your bot registers in the game.
2. The game engine notifies the bot when the game starts.
3. Your bot sends requests to the game engine. Requests can be: move forward, move backward, shoot, etc.
4. The game engine takes all the requests received in one tick, calculates the new game state, evaluates the requests with these new state and sends the appropiate responses.
5. The bot receives the response and decides what to do next.

Steps 1 and 2 happen only once per game. 3, 4 and 5 repeat until the game ends or your bot is destroyed.

TODO add gif

### Ticks

The pace of the game engine is driven by ticks, that is, the moments in time when the game state is updated and the messages received between the previous tick and the current one are processed.

### Game arena

The arena is the game happens. Bots can move freely within the boundaries of the arena. 

Positions in the arena are returned as a pair of coordinates `(x, y)`. These coordinates are relative to the origin of the arena in the bottom left corner (`(0,0)`). Moving to the right from the origin increases the `x` coordinate. Moving up from the origin increases the `y` coordinate.

Rotations in the arena are returned in degrees (value in the range `[0, 360]`). Rotation values are relative to the origin.

TODO example

### Bots

Bots are the players of the game. They interact with the game by sending requests to the game engine. Bots have the following properties:

- Id, chosen by you.
- Life, starts at `100` and decrements with each shot or mine hit.
- Position, coordinates of the bot in the game arena.
- Rotation, orientation of the bot.
- Shots, number of available shots TODO, how many initial shots.
- Mines, number of available mines TODO, how many initial mines.

### Bot requests

Bots interact with the game engine by sending requests. The game engine validates the request, executes it and updates its internal state. A response is sent indicating if the request was successful or not. If the request was successful the response includes data that describes how the bot state changed as a consequence of it.

Bots can only have one in-flight request per tick. That is, they shouldn't send a request before getting the response to a previous one, as later requests will overwrite previous ones. Basically bots have an inbox which can only hold one message at a time. 

Responses are sent at the end of each tick.

#### Register

Register the player in the game. The game engine replies with a `Response` object telling if the player was registered or not. If the player was registered the response includes the initial position and rotation for the player.

#### Move

Move the player in the desired direction. The direction can be `forward` or `backward`. The game engine replies with a `Response` object telling if the movement was successful together with the new player coordinates.

#### Rotate

Rotate the player to a desired angle. The new angle has to be a value in the range `[0, 360]`. The game engine replies with a `Response` object telling if the rotation was successful together with the new player rotation.

#### Shoot

Fire a shot. The game engine replies with a response object telling if the shot was successful together with the number of remaining shots.

#### Deploy mine

Deploy a mine. The game engine replies with a `Response` object telling if the mine was deployed together with the number of remaining mines.

### Notifications

On each tick the game will send notifications to let players know of events which happened in the game. 

Notifications are sent at the end of each tick.

#### Radar scan

Notification sent to each player containing the players, shots, mines and also any other unknown objects detected in its proximity.

TODO: add mines to the radar scan

#### Shot hit

Notification sent when a player is hit by a shot. The notification includes the coordinates of the shot as well as the remaining life of the player.

#### Mine hit

Notification sent when a player is hit by a mine. The notification includes the coordinates of the mine as well as the remaining life of the player.

TODO: Should a mine hit also affect other players which are in the explosion radius

## Writing a bot

To write a bot all you have to do is implement the parts you want from the following interface. The methods in the interface map to the request's responses and notifications introduced above.

```typescript
interface BotAPI<S> {
  initState?: () => S

  handlers: {
    radarScanNotification?: (
      data: RadarScanNotification,
      state: S
    ) => { state: S, requests: Request[] }

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => { state: S, requests: Request[] }

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => { state: S, requests: Request[] }

		deployMineResponse?: (
      data: SuccessfulDeployMineResponse | FailedDeployMineResponse,
      state: S
    ) => { state: S, requests: Request[] }

		shotHitNotification?: (
      data: PlayerShotHitNotification,
      state: S
    ) => { state: S, requests: Request[] }

    startGameNotification?: (state: S) => { state: S, requests: Request[] }

    joinGameNotification?: (state: S) => { state: S, requests: Request[] }
  }
}

```

For a list of all the types mentioned in this interface check: [types](./src/types.ts) and [requests](./src/requests.ts)

### Bot registration

You don't have to take care of registering the bot in the game, the library will take care of doing that for you.

### Bot state

Each handler as an argument any state that you want to keep between handler invocations.  Each handler must return the new state that will be passed in as an argument to the next handler invocation. You can init the state before receiving any message from the game engine by implementing the `initState` method. The default bot state is an empty object `{}`.

## Usage

Use the `bin/bot` tool to execute a bot writen with this framework.

```shell
bin/bot -h
Options:
  -i, --id      Bot id                              [string] [required]
  -m, --module  Module implementing the BotAPI      [string] [required]
  -r, --replay  Log file to be replayed                        [string]
  -s, --server  Address of the game engine
                                   [string] [default: "localhost:8889"]
```

The framework will write a log file with all the messages sent and received by the bot. The log file will be named `<bot-id>-messages.log`.

TODO write files to `./logs`

## Logs playback

If you want to you can replay the logs by running `bin/bot` with the `-r` flag. When replaying the logs, you can pause the playback (for example because you want to set a breakpoint) by adding a line with the text `[break]` in the log file being replayed with `-r`.

## Examples

This repo contains several example bots in the folder `examples/`

