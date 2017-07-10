## GraphSheets

## Schema Conversion

Given the following GraphQl schema:

```javascript
type Person {
  firstName: String
  lastName: String
  products: [Product]
}

type Product {
  title: String
  owner: Person
}
```

This should create a spreadsheet that has 2 Sheets

* Person *

| ID | firstName | lastName | products |
|----|-----------|----------|----------|

* Product *

| ID | title | owner |
|----|-------|-------|

## Relationships

```js
=JOIN(",", QUERY(Products, "select "&SUBSTITUTE(ADDRESS(1,MATCH("ID",INDEX(Products, 1),0),4),1,"")&" where "&SUBSTITUTE(ADDRESS(1,MATCH("Owner",INDEX(Products, 1),0),4),1,"")&" matches 2 label "&SUBSTITUTE(ADDRESS(1,MATCH("ID",INDEX(Products, 1),0),4),1,"")&" ''"))
```

## Resources

### GraphQL

* [Launchpad GraphQL Example](https://launchpad.graphql.com/x18k3z89l)
* [GraphQL Types](http://graphql.org/graphql-js/type/)
* [GraphQL Schema Language Cheat Sheet](https://raw.githubusercontent.com/sogko/graphql-shorthand-notation-cheat-sheet/master/graphql-shorthand-notation-cheat-sheet.png)
* [Proposal: Serial fields (nested mutations)](https://github.com/facebook/graphql/issues/252)
* [Awesome GraphQL](https://github.com/apollographql/launchpad)
* [Apollo GraphQL Starwars Server](https://github.com/apollographql/starwars-server)
* [GraphQL Schemas and Types](http://graphql.org/learn/schema/)

### Apollo

* [graphql-tools](https://github.com/apollographql/graphql-tools)
* [Apollo Resolvers](http://dev.apollodata.com/tools/graphql-tools/resolvers.html)
* [Apollo Server](http://dev.apollodata.com/tools/graphql-server/index.html)

### Google Sheets

* [Google Sheets Node API](https://github.com/google/google-api-nodejs-client/blob/master/apis/sheets/v4.ts#L36)
* [SheetsDB Example Sheet](https://docs.google.com/spreadsheets/d/1kjeHcZKwW5aWc9MPbyBiy3ByVgHdkDi-H3ihuBKmEPQ/edit?usp=sharing)
* [Google Visualization Query Language](https://developers.google.com/chart/interactive/docs/querylanguage)
* [Google Sheets Functions Reference](https://support.google.com/docs/table/25273)
* [How to use ranges in WHERE clause of a QUERY function?](https://productforums.google.com/forum/#!msg/docs/jPxLfG09L-g/J_7zjppUK7UJ)
* [Debugging QUERY function](https://productforums.google.com/forum/#!msg/docs/ULPu4SPbIlk/NdExVxy8f80J)
* [Using arrays in Google Sheets](https://support.google.com/docs/answer/6208276?hl=en)

### Deployment

* [Express.js on Cloud Functions for Firebase](https://codeburst.io/express-js-on-cloud-functions-for-firebase-86ed26f9144c)
* [GraphQL Server Documentation](http://dev.apollodata.com/tools/graphql-server/index.html)
* [GraphQL Server Repo](https://github.com/apollographql/graphql-server)

### Packages

* [yargs](https://github.com/yargs/yargs) - CLI interface
* [heimdalljs-logger](https://github.com/heimdalljs/heimdalljs-logger) - Logger
