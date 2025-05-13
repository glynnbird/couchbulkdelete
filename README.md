# couchbulkdelete

A command-line utility that allows many documents to be deleted from a Apache CouchDB database. The tool expects a Mango "selector" that defines the slice of data that is to be deleted. The tool can be paired with [couchimport](www.npmjs.com/package/couchimport) which will bulk delete the documents found.

## Installation

```sh
npm install -g couchbulkdelete
```

## Reference

Environment variables (or command-line parameters):

- `COUCH_URL` (`--url`/`-u`) - the URL of your CouchDB service e.g. `http://user:pass@myhost.com`
- `COUCH_DATABASE` (`--database`/`--db`/`-d`) - the name of the database to work with e.g. `orders`
- `IAM_API_KEY` - (optional) if using IBM IAM for authentication
- (`--selector`/`-s`) - the CouchDB "mango" selector to be used to select the slice of data to delete
- (`--where`/`-w`) - instead of supplying a `selector` a `where` parameter may be used to express the slice of data as a SQL WHERE clause.

## Usage

Set your `COUCH_URL` (an optionally `IAM_API_KEY`) as environment variables, then supply the other parameters as command-line arguments e.g.

```sh
# delete documents where team="red"
$ couchbulkdelete --db users --selector '{"team":"red"}'
{"_id":"e15a6a03f75d844a0ac117a3a742f589","_rev":"1-c4f1369224db88c99fa8020c2f177477","_deleted":true}
{"_id":"e15a6a03f75d844a0ac117a3a748a0d0","_rev":"1-c9b0eb03324c3e744b0068e04f36fb52","_deleted":true}
...

# delete documents where team="blue" OR date > '2020-02-01'
$ couchbulkdelete --db users --selector '{"$or":[{"team":{"$eq":"red"}},{"date": {"$gte": "2020-02-01"}}]}'
{"_id":"e15a6a03f75d844a0ac117a3a742f589","_rev":"1-c4f1369224db88c99fa8020c2f177477","_deleted":true}
{"_id":"e15a6a03f75d844a0ac117a3a748a0d0","_rev":"1-c9b0eb03324c3e744b0068e04f36fb52","_deleted":true}
...

# delete documents using a SQL-like where clause
$ couchbulkdelete --db users --where"(team='red' OR team='blue') AND date>'2020-02-01'"
{"_id":"e15a6a03f75d844a0ac117a3a742f589","_rev":"1-c4f1369224db88c99fa8020c2f177477","_deleted":true}
{"_id":"e15a6a03f75d844a0ac117a3a748a0d0","_rev":"1-c9b0eb03324c3e744b0068e04f36fb52","_deleted":true}
...
```

The tool outputs the deletion JSON to stdout so that it can be inspected for accuracy. To actually delete the data, install [couchimport](www.npmjs.com/package/couchimport) and use the two tools together:

```sh
couchbulkdelete --db users --selector '{"team":"red"}' | couchimport --db users
```

## How does this work?

A filtered changes feed is set up, using the supplied _selector_ as the filter. Any documents meeting the selector's criteria are turned into JSON objects which when written to CouchDB would delete the documents. The couchimport already batches and writes data in bulk to CouchDB, so there's no need to copy that code to this tool.
