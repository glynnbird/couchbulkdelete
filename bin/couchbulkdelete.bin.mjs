#!/usr/bin/env node

import { readFile } from 'fs/promises'
import { parseArgs } from 'node:util'
import { couchbulkdelete } from '../index.mjs'
import { parse } from 'sqltomango'

const syntax = 
`Syntax:
--url/-u           (COUCH_URL)      CouchDB URL                     (required)
--database/--db/-d (COUCH_DATABASE) CouchDB Datbase name            (required)
--selector/-s                       Selector                        *
--where/-w                          SQL instead of selector         *
--version/v                         Show app version                (default: false)

* one of selector or where is required.
`
const url = process.env.COUCH_URL || 'http://localhost:5984'
const db = process.env.COUCH_DATABASE


// load the npm package meta
const app = JSON.parse(await readFile('./package.json'))

// chop up argv
const argv = process.argv.slice(2)
const options = {
  url: {
    type: 'string',
    short: 'u',
    default: url
  },
  database: {
    type: 'string',
    short: 'd',
    default: db
  },
  selector: {
    type: 'string',
    short: 's'
  },
  where: {
    type: 'string',
    short: 'w'
  },
  db: {
    type: 'string',
    default: db
  },
  version: {
    type: 'boolean',
    short: 'v',
    default: false
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false
  }
}

// parse command-line options
const { values } = parseArgs({ argv, options })
if (values.db) {
  values.database = values.db
  delete values.db
}
// version mode
if (values.version) {
  console.log(`${app.name} ${app.version}`)
  process.exit(0)
}

// help mode
if (values.help) {
  console.log(syntax)
  process.exit(0)
}

// if where is supplied, use it to generate the selector
if (values.where) {
  const parsed = parse(`SELECT * FROM ${values.database} WHERE ${values.where}`)
  values.selector = parsed.selector
}

// must supply URL & database
if (!values.url || !values.database || !values.selector) {
  console.error('Error: You must supply a url, database and selector name')
  process.exit(3)
}

// try parsing the selector
try {
  if (typeof values.selector === 'string') {
    values.selector = JSON.parse(values.selector)
  }
} catch (e) {
  console.error('selector does not parse as JSON')
  process.exit(4)
}

// start the snapshot
couchbulkdelete(values)
  .catch(console.error)
