# couchbulkdelete

A command-line utility that allows many documents to be deleted from a Apache CouchDB database. The tool expects a Mango "selector" that defines the slice of data that is to be deleted.

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
- (`--dryrun`)  - when supplied, no data is actually deleted. 

## Usage

Set your `COUCH_URL` (an optionally `IAM_API_KEY`) as environment variables, then supply the other parameters as command-line arguments e.g.

```sh
# delete documents where team="red"
$ couchbulkdelete --db users --selector '{"team":"red"}'
DELETED: 89e0860dac35d42ae52aeef6eb58fe99 OK {"ok":1,"failed":0}
DELETED: 89e0860dac35d42ae52aeef6eb4adf2d OK {"ok":2,"failed":0}
...

# delete documents where team="blue" OR date > '2020-02-01'
$ couchbulkdelete --db users --selector '{"$or":[{"team":{"$eq":"red"}},{"date": {"$gte": "2020-02-01"}}]}'
DELETED: 89e0860dac35d42ae52aeef6eb58fe99 OK {"ok":1,"failed":0}
DELETED: 89e0860dac35d42ae52aeef6eb4adf2d OK {"ok":2,"failed":0}
...

# delete documents using a SQL-like where clause
$ couchbulkdelete --db users --where"(team='red' OR team='blue') AND date>'2020-02-01'"
DELETED: 89e0860dac35d42ae52aeef6eb58fe99 OK {"ok":1,"failed":0}
DELETED: 89e0860dac35d42ae52aeef6eb4adf2d OK {"ok":2,"failed":0}
...

# do a "dry run" delete documents where team starts with "v" - as it runs in 
# dry run mode, no documents are actually deleted
$ couchbulkdelete --db users --selector '{"team":{"$regex":"^v"}}' --dryrun
DRY RUN: 89e0860dac35d42ae52aeef6eb58fe99 OK {"ok":1,"failed":0}
DRY RUN: 89e0860dac35d42ae52aeef6eb4adf2d OK {"ok":2,"failed":0}
...
```

## How does this work?

A filtered changes feed is set up, using the supplied _selector_ as the filter. Any documents meeting the selector's criteria are bundled into batches of 500 for bulk delete operations, using the "bulk_docs" API.
