# exegesis-plugin-clientapi

[![Run Status](https://api.shippable.com/projects/5ca118e409683700078368d1/badge?branch=master)]()
[![Coverage Badge](https://api.shippable.com/projects/5ca118e409683700078368d1/coverageBadge?branch=master)]()
![](https://img.shields.io/github/issues/phil-mitchell/exegesis-plugin-clientapi.svg)
![](https://img.shields.io/github/license/phil-mitchell/exegesis-plugin-clientapi.svg)
![](https://img.shields.io/node/v/exegesis-plugin-clientapi.svg)

## Description

Adds exegesis support for generating client API code

## Installation

```sh
npm install exegesis-plugin-clientapi
```

## Example

Add this to your Exegesis options:

```js
const exegesisClientAPIPlugin = require( 'exegesis-plugin-clientapi' );

options = {
    plugins: [
        exegesisClientAPIPlugin()
    ]
};
```

By default the API will be generated as an ES6 module.
