# Changelog of commons

## Unreleased

### Changed

- SC-6294 remove ts paths, fix build
- OPS-1289 change the npm organisation namen

## 1.3.0

### Changes in 1.3.0

- reflect plainSecrets option to be applied in toObject()

## 1.2.8

- do not print hierarchy implicitly by default on startup
- general bugfixes

## 1.2.7

- fix static imports again
- define secret matches in config options as string

## 1.2.6

- fix static import pathes
- general dependency updates

## 1.2.5

- add `password` and `salt` to secrets to be not printed
- move secret expressions to configuration options

## 1.2.4

- fix non-relative imports to relative ones as they work in tests but not in the npm package

## 1.2.3

- print configuration hierarchy added, printing secrets disabled by default
- replace parsing NODE_ENV from env only, added env configuration hierarchy with options.loadFilesFromEnv

## 1.2.1

- cleanup eslint, fix support for markdown
- updated dependencies

## 1.2.0

- removed compatibility with node 8 due an update of mocha from version 7 to 8.
- add compatibility with node 14
- disable methods changing the config exept for test environment
- fix prettier/eslint
- fix fileEncoding type

## 1.1.1

- adding again parsing of default.json before NODE_ENV.json files. required attribute defaults have to be added here (json schema default is not working)

## 1.1.0

- added dependency ref support
- dependencies general updates of dependencies applied

## 1.0.19

- dependency/security updates
- use 'development' as default for NODE_ENV if not defined
- parsing a default.json as default has been removed and replaced by development.json, system defaults can be applied in the schema only

## 1.0.18

- dependency/security updates only

## 1.0.14

- fixed toObject() of config to return nested properties instead of with dot separator in the name (discussion for export option open).
- default export returns instance of configuration, options loaded from file optionally, manual init() is no more required for thew singleton access
- default node version updated to current 10.X

## 1.0.13

### Fixed in 1.0.13

- cache final (dotted) config object
- return errors on set/get for invalid values
- debugging: register tsconfig-paths
- eslint: require tabs for indention and semi after statements

### Added in 1.0.13

- coverage support using nyc mocha added
- improve test coverage

## 1.0.12

- Singleton import and initialization rewritten
- updated readme describing different imports using a sample

## 1.0.11

### Fixed in 1.0.11

- Singleton getInstance() Method

## 1.0.10

### Added in 1.0.10

- Singleton access to Configuration, public constructor is deprecated but enabled for tests
- Support for Dot-Notation and Nested Properties in Configuration for reading environment variables and using Configurations has, get and toObject
- File encoding added to configuration

### Fixed in 1.0.10

- Different spelling issues rewritten
