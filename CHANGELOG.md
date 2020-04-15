# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [5.1.1] - 2020-04-15

### Fixed

* Do not override with `undefined` an existing `inFlightRequest` if the `tickNotification` handler does not return a new request

## [5.1.0] - 2020-04-13

### Added

* Exit on `SIGTERM` signal

## [5.0.2] - 2020-04-13

### Fixed

* Install `Typescript` as a prod dependency so installs which only have `Typescript` as dev dependency and prune non-prod dependencies can still execute their `Typescript` bots.

## [5.0.1] - 2020-04-12

### Fixed

* The message dispatcher was resetting the `inFlighRequest` when a notification was received

## [5.0.0] - 2020-04-12

### Changed

* Bump the protocol version to `2.1.2`

### Added

* The `tickNotification` handler takes now an object as a second argument. This object has an `inFlightRequest` property which is set to the last sent but not responded request or `undefined`
* `deployMineRequest` a new request helper to deploy mines

## [4.1.1] - 2020-04-08

### Fixed

* By mistake the return type from the `tickNotification` handler required a `request`. This property is now optional

## [4.1.0] - 2020-04-08

### Added

* Update to protocol version [`2.1.0`](https://github.com/madtrick/piwpew-docs/commit/60562bffc178c1e60546c6ccb79ace13c0144dea)

## [4.0.0] - 2020-04-07

### Changed

* Update to protocol version [`2.0.0`](https://github.com/madtrick/piwpew-docs/commit/6be6a424d18604c74c69d1877701f9c42a5ea576)
* Redesign the `BotAPI` interface. Only the `tickNotification` method can return a single `request` to be sent to the server

### Added

- New handler method `tickNotification`