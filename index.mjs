import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { readFile } from 'fs/promises'
import * as jsonpour from 'jsonpour'
import * as ccurllib from 'ccurllib'

const WRITE_BATCH_SIZE = 500

// load the npm package meta
const pkg = JSON.parse(await readFile('./package.json'))
const h = {
  'user-agent': `${pkg.name}@${pkg.version}`,
  'content-type': 'application/json'
}

// stream-processing function. Removes deleted docs.
// returns bulk_docs-ready objects
function changeProcessor() {
  // create stream transformer
  const filter = new Transform({
    objectMode: true,
    transform: function (obj, encoding, done) {
      const retval = {
        _id: obj.id,
        _rev: obj.changes[0].rev,
        _deleted: true
      }
      this.push(JSON.stringify(retval) + '\n')
      done()
    }
  })
  return filter
}

// feed the changes 
async function spoolChanges(opts) {
  // spool changes
  // get lastSeq
  const req = {
    method: 'post',
    headers: h,
    url: `${opts.url}/${opts.database}/_changes`,
    data: {
      selector: opts.selector
    },
    qs: {
      since: opts.since,
      filter: '_selector',
      include_docs: false,
      seq_interval: 10000
    }
  }

  // spool changes
  return await ccurllib.requestStream(req)
}

export async function couchbulkdelete(opts) {
  // override defaults
  const defaults = {
    url: 'http://localhost:5984',
    since: 0,
    ws: process.stdout,
    selector: null
  }
  opts = Object.assign(defaults, opts)

  // check URL is valid
  try {
    new URL(opts.url)
  } catch (e) {
    console.error('Invalid URL', e)
    process.exit(1)
  }

  // check we have a selector
  if (!opts.selector || Object.keys(opts.selector).length === 0) {
    console.error('Invalid selector',)
    process.exit(2)
  }

  try {
    // stream pipeline
    await pipeline(
      await spoolChanges(opts),
      jsonpour.parse('results.*'),
      changeProcessor(),
      opts.ws)

    // close the write stream
    opts.ws.end()
  } catch (e) {
    console.error('Failed to spool changes from CouchDB')
    console.error(e.toString())
    process.exit(2)
  }
}

