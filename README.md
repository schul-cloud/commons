# Commons

[![npm version](https://badge.fury.io/js/%40schul-cloud%2Fcommons.svg)](https://www.npmjs.com/package/@schul-cloud/commons)
[![GitHub version](https://badge.fury.io/gh/schul-cloud%2Fcommons.svg)](https://github.com/schul-cloud/commons)

[![Test Action](https://github.com/schul-cloud/commons/workflows/Node%20CI/badge.svg)](https://github.com/schul-cloud/commons/actions)
[![Deployment Action](https://github.com/schul-cloud/commons/workflows/Build%20and%20Publish/badge.svg)](https://github.com/schul-cloud/commons/actions)


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
    npm run build
    npm test

## Contents

### Configuration

This is a singleton class that can be reused to hold a configuration that is validated by JSON Schema and holds validated data that is optionally overwritten by environment variables.
