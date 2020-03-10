# Commons

[![npm version](https://badge.fury.io/js/%40schul-cloud%2Fcommons.svg)](https://www.npmjs.com/package/@schul-cloud/commons)
[![Test Action](https://github.com/schul-cloud/commons/workflows/Node%20CI/badge.svg)](https://github.com/schul-cloud/commons/actions)
[![Deployment Action](https://github.com/schul-cloud/commons/workflows/Build%20and%20Publish/badge.svg)](https://github.com/schul-cloud/commons/actions)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/fd0d792b16a342a69df80cc4e96ef1f8)](https://www.codacy.com/manual/schul-cloud/commons?utm_source=github.com&utm_medium=referral&utm_content=schul-cloud/commons&utm_campaign=Badge_Grade)

<!--
[![Build Status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Coverage percentage][coveralls-image]][coveralls-url]
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
-->

## Install

    npm install @schul-cloud/commons --save

## Test

    npm install
    npm test

## Usage

### Configuration

The `Configuration` is a singleton that can be reused to hold a configuration that is validated by JSON Schema. A JSON-Schema has to be defined as `default.schema.json` inside a `config` folder. The configuration is build by parsing multiple sources in the following order:

1. File `default.json` from config folder, then extended or overridden by
2. NODE_ENV.json from config folder (optionally)
3. .env file from execution/project root directory
4. existing environment variables finally override everything from before.

The default schema parser options

1. remove all options from upper sources not defined in the schema file
2. applying default values
3. do a [type conversion](https://ajv.js.org/coercion.html) especially for string to type conversion values not defined in the json files (string to X).

Invalid input values will raise an error by default.

To enable multiple inherited objects when parsing environment variables there may be a dot notation be used. When enabled, this gets applied for export, has, and get too. Currently only `__` (double underscore) is supported as separator due to the dependency [dotenv](https://www.npmjs.com/package/dotenv#should-i-have-multiple-env-files) and bad support of `.` (single dot) in many terminals.

### Sample

```javascript
// Access Configuration as Singleton, using default export
// Initialization is done on first access
// uses IConfigOptions optionally defined in a sc-config.json file
import { Configuration as config } from "@schul-cloud/commons";

// Access configuration as class
// IConfigOptions can be set in constructor options
import { TestConfiguration } from "@schul-cloud/commons";
const config = new TestConfiguration(options);

// Then you may run...
config.has("key");
config.toObject();
// and when the property key has been defined in the schema...
config.get("key");
config.set("key", "value");
// or updating multiple entries
config.update({...});
```

### Options

| Option&nbsp;key | Value(s)&nbsp;or&nbsp;Type | default                                                                               | Description                                                                                                                             |
| --------------- | -------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| logger          | any                        | console                                                                               | a logger instance                                                                                                                       |
| throwOnError    | boolean                    | true                                                                                  | enable throwing an error when an undefined configuration value is requested                                                             |
| notFoundValue   | any                        | null                                                                                  | if throwOnError is not set true, an alternate default value may returned                                                                |
| configDir       | string                     | config                                                                                | directory where schema and configuration files are located                                                                              |
| schemaFileName  | string                     | default.schema.json                                                                   | default schema file name                                                                                                                |
| baseDir         | string                     | process.cwd()                                                                         | path to folder where configDir is located                                                                                               |
| ajvOptions      | object                     | removeAdditional:&nbsp;'all' <br>useDefaults:&nbsp;true <br>coerceTypes:&nbsp;'array' | Schema Parser Options, see https://github.com/epoberezkin/ajv#options                                                                   |
| useDotNotation  | boolean                    | true                                                                                  | enables dot notation for parsing environment variables (not json files!) and exporting the current config using has, get, and toObject. |
| fileEncoding    | string                     | 'utf8'                                                                                | set file encoding for imported schema and configuration files                                                                           |

## JSON Schema

### Enhanced validation

Custom validation keywords may be added to get detailed error messages for specific checks:
https://medium.com/@moshfeu/test-json-schema-with-ajv-and-jest-c1d2984234c9

### Dependencies

Multiple supported [keywords](https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#keywords) exist in ajv to define dependencies.

## Use cases

- To apply local defaults, set values using .env file (never commit this file!)
- To apply NODE_ENV-specific defaults, use NODE_ENV.json-file in config folder
- To apply global defaults, set default in schema file itself
- To applu feature-flag conditions, see dependency [keywords](https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#keywords) above.
