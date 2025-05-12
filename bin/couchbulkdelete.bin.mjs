#!/usr/bin/env node

import { readFile } from 'fs/promises'
import { parseArgs } from 'node:util'
import { couchbulkdelete } from '../index.mjs'

const syntax = 
`Syntax:
--url/-u           (COUCH_URL)      CouchDB URL                     (required)
--database/--db/-d (COUCH_DATABASE) CouchDB Datbase name            (required)
--selector/-s                       Selector                        (required)
--dryrun                            Dry-run only - no data deleted  (default: false)
--version/v                         Show app version                (default: false)
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
  db: {
    type: 'string',
    default: db
  },
  dryrun: {
    type: 'boolean',
    default: false
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

// must supply URL & database
if (!values.url || !values.database || !values.selector) {
  console.error('Error: You must supply a url, database and selector name')
  process.exit(3)
}

// try parsing the selector
try {
  values.selector = JSON.parse(values.selector)
} catch (e) {
  console.error('selector does not parse as JSON')
  process.exit(4)
}

// start the snapshot
couchbulkdelete(values)
  .then(console.log)
  .catch(console.error)
