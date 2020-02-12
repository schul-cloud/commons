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

This is a singleton class that can be reused to hold a configuration that is validated by JSON Schema and holds validated data that is optionally overwritten by environment variables. It will parse a config folder for default.json, overwrite the settings found there in a possible existing NODE_ENV.json and finally overwrite the settings based on equally named environment variables.

The default schema parser options remove all options not defined in the schema, applying default values and do a default type conversion especially for string to type conversion of environment variables. See https://ajv.js.org/coercion.html for details. Invalid input values will be thrown as Error.

To enable multiple inherited objects when parsing environment variables there may be a dot notation be used. When enabled, this gets applied for export, has, and get too.

### Sample

```javascript
// Access Configuration as Singleton, using default export (1)
import config from "@schul-cloud/commons";

// Access configuration as class (2)
import { Configuration } from "@schul-cloud/commons";
const config = new Configuration();

// Initialization must be executed exactly once per instance (2)
config.init(options);

// Initialization in (1) is done on first access

// Then you may run
config.has("key");
config.get("key");
config.set("key", "value");
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

#### Set options in singleton mode

Create a local file `sc-config.json` in your project root, it will be used on initialization to override default options. The file content must match `IConfigOptions` interface.

## JSON Schema

### Enhanced validation

Custom validation keywords may be added to get detailed error messages for specific checks:
https://medium.com/@moshfeu/test-json-schema-with-ajv-and-jest-c1d2984234c9
