# About

Framework to build bots for Pewpew

## Framework

With this framework you can focus on the functionality of your bots and leave the plumbing to the framework. Bots implemented with the framework have to implement the following interface:

```typescript
interface BotAPI<S> {
  handlers: {
    radarScanNotification?: (
      scan: {
        players: { position: Position }[],
        shots: { position: Position }[],
        unknown: { position: Position }[]
      },
      state: S
    ) => { state: S, actions: Action[] }

    registerPlayerResponse?: (
      data: SuccessfulRegisterPlayerResponse | FailedRegisterPlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    rotatePlayerResponse?: (
      data: SuccessfulRotatePlayerResponse | FailedRotatePlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    movePlayerResponse?: (
      data: SuccessfulMovePlayerResponse | FailedMovePlayerResponse,
      state: S
    ) => { state: S, actions: Action[] }

    shootResponse?: (
      data: SuccessfulShootResponse | FailedShootResponse,
      state: S
    ) => { state: S, actions: Action[] }

		shotHitNotification?: (
      data: PlayerShotHitNotification,
      state: S
    ) => { state: S, actions: Action[] }

    startGameNotification?: (state: S) => { state: S, actions: Action[] }

    joinGameNotification?: (state: S) => { state: S, actions: Action[] }
  }
}

```

For a list of all the types mentioned in this interface check: [types]() and [actions]()

## Usage

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

## Logs playback

If you want to you can replay the logs by running `bin/bot` with the `-r` flag. When replaying the logs, you can pause the playback (for example because you want to set a breakpoint) by adding a line with the text `[break]` in the log file being replayed with `-r`.

## Examples

This repo contains several example bots in the folder `examples/`