# About

Framework to build bots for [github.com/madtrick/pewpew](github.com/madtrick/pewpew).

## Framework

With this framework you can focus on the functionality of your bots and leave the communication with the server to the framework itself. Bots implemented with the framework have to implement the following interface:

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

    startGameNotification?: (state: S) => { state: S, actions: Action[] }

    joinGameNotification?: (state: S) => { state: S, actions: Action[] }
  }
}

```

For a list of all the types mentioned in this interface check: [types]() and [actions]()

## Usage

```shell
bin/bot -i <bot-id> -p <path-to-module-file>
```

The framework will write a log file with all the messages sent and received by the bot. The log file will be named `<bot-id>-messages.log`.

## Logs playback

If you need to you can replay the logs by running `bin/bot` with the `-f` flag. If you want to pause the playback (for example because you want to set a breakpoint) you can do so by adding a line with the text `[break]` anywere in the log file being replayed with `-f`.