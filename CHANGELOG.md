# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.0] - 2020-04-08

### Added

* Update to protocol version [`2.1.0`](https://github.com/madtrick/piwpew-docs/commit/60562bffc178c1e60546c6ccb79ace13c0144dea)

## [4.0.0] - 2020-04-07

### Changed

* Update to protocol version [`2.0.0`](https://github.com/madtrick/piwpew-docs/commit/6be6a424d18604c74c69d1877701f9c42a5ea576)
* Redesign the `BotAPI` interface. Only the `tickNotification` method can return a single `request` to be sent to the server.

### Added

- New handler method `tickNotification`