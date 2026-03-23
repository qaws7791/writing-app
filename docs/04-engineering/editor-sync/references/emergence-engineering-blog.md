Title: Emergence Engineering - Blog

URL Source: https://emergence-engineering.com/blog/prosemirror-sync-1

Published Time: Sun, 22 Mar 2026 18:31:05 GMT

Markdown Content:

## Collaborative text editor with ProseMirror and a syncing database

ProseMirror Collaborative Editing PouchDB Firestore Web Development

By Viktor

Tuesday, July 28, 2020

## TLDR

- We introduce a method to create a web based collaborative editor based on ProseMirror
- We use PouchDB (CouchDB) to abstract away all the hassle that comes with directly managing WebSockets
- Any database with real time syncing functionality can be used
- For the interactive demo we used React and TypeScript

## What's this about?

With the collaborative editing functionality in ProseMirror it's possible to create documents that are editable by multiple users at the same time. Although the **[prosemirror-collab](https://prosemirror.net/docs/guide/#collab)** module is not very hard to use, a communication layer is necessary for the clients to receive new steps to update their local document, keeping them in sync. This is usually done with WebSockets, which adds another layer in the stack where bugs can hide. This article shows a path to get rid of that layer by using a well-tested layer in the form as a syncing database. In this article PouchDB/CouchDB is used, so the emulated "server" can also live in the browser, thus making the example simpler. This approach has also been tested with Firestore.

[The code for this post is here](https://github.com/emergence-engineering/blog/tree/master/articles/prosemirror-sync-1)

## Demo

Try typing in any of the editors below!

### Client steps

You can follow the steps (changes) that are emitted from the active editor in the _ClientSteps list_ table. Here you can see all the steps that are being sent from the clients.

### Server steps

The _ServerSteps list_ table displays the history of the valid conflict free steps ( changes ). Each of these steps has a version just like git commits.

### Server document

The JSON object below displays the latest state of the document on the server.

_Server version_: 0

"root"
:

{2 Items

"content"
:

[1 Items

0
:

{

...

}2 Items

]

"type"
:

string

"doc"

}

ClientSteps list

Status

Editor ID

Version

Steps

ServerSteps list

Editor ID

Version

Steps

### Editor 1.

_version:_ 0

### Editor 2.

_version:_ 0

## Prerequisites

## ProseMirror

- _ProseMirror_: a framework / toolkit with which one can create custom text editors
- _collaborative editor_: A text editor where multiple people can edit the same document, for example, Google docs
- _ProseMirror document / doc_: An object which describes the contents of a rich text document
- _step_: an object which describes the necessary information to update a document ( like add/delete a letter from a given position in a document.
- _ProseMirror document version_: A version of the document starts from 0 and incremented every time a new step is applied.

## Sync database

- _Sync database_: A database which is capable of automatically replicating the state of a remote database, so they both contain the same content eventually. For example CouchDB, Google Firestore etc...
- _PouchDB_: A JS implementation of the CouchDB protocol. This means that it can run in the browser, and sync up to another database which implements the CouchDB protocol.
- _listener_: A callback which is called every time the there is new data in the database
- _collection_: A collection field is added to every entry in the database. This field helps marks items that belong in the same category. A collection is somewhat analogous to a table in relational databases.

## How everything comes together

In some cases of client-server communications, one can use the syncing functionality of a database to send data from a client to the server by:

- adding elements to the database
- listening to added elements on the server-side, and when the processing is finished then either
  - Add a new element to the database
  - Modify the added element by the client

- listening to the changes made by the server on the client-side

This is very similar to a REST API, but the server now can push data to the clients directly. Of course this can be done with just WebSockets ( and that's what behind the implementation of most sync databases ), but that's usually a quite complex hard-to-test part, and using a well-tested database has some obvious benefits in that sense. Our implementations root file is [index.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/index.tsx) in the repo linked earlier.

A very good explanation of the collaborative algorithm used by ProseMirror can be found [here](https://prosemirror.net/docs/guide/#collab).

In this demo there are two ProseMirror editors and each of them has a dedicated PouchDB instance. These databases sync up to a third database, which belongs to a "server". If client A is updated, then the server is updated which ideally propagates client B.

## The database layer

As we mentioned above we use PouchDB for this demo which is a JavaScript implementation of the CouchDB protocol. There are three collections:

```
1enum DBCollection {
2  PMDocument = "PMDocument",
3  ClientSteps = "ClientSteps",
4  ServerSteps = "ServerSteps",
5}
```

**1. PMDocument**: stores the ProseMirror document

```
1interface PMDocument {
2  _id: string;
3  _rev?: string;
4  collection: DBCollection.PMDocument;
5  doc: object;
6  version: number;
7  updatedAt: Timestamp;
8}
```

**2. ClientSteps**: stores the steps coming from the clients

```
1export interface ClientStep {
2  collection: DBCollection.ClientSteps;
3  pmViewId: string | number;
4  status: StepStatus;
5  steps: object[];
6  version: number;
7  docId: string;
8  createdAt: Timestamp;
9  updatedAt: Timestamp;
10}
```

**3. ServerSteps**: stores the steps accepted by the server

```
1interface ServerStep {
2  collection: DBCollection.ServerSteps;
3  step: object;
4  version: number;
5  pmViewId: string | number;
6  docId: string;
7  createdAt: Timestamp;
8  updatedAt: Timestamp;
9}
```

## Data flow on the server

1.  The server listens to new documents in **ClientSteps**

```
1  //listening to ClientSteps
2  DBS.serverDB
3    .changes({
4      since: "now",
5      live: true,
6      filter: data =>
7        data.collection === DBCollection.ClientSteps &&
8        data.status === StepStatus.NEW,
9    })
```

1.  If the version of the steps is correct the client is synced up to the server

```
1        if (clientStep?.collection !== DBCollection.ClientSteps) {
2          return;
3        }
4        const syncDoc = await DBS.serverDB.get(clientStep.docId);
5        if (
6          clientStep.version !== syncDoc.version ||
7          syncDoc.collection !== DBCollection.PMDocument
8        ) {
9          // Set status to StepStatus.REJECTED
10          await syncClientStep(DBS, clientStep, StepStatus.REJECTED);
11          return;
12        }
```

1.  And finally: the server updates the ProseMirror document stored in **PMDocument** ( referenced by the incoming step ) and saves the accepted steps to **ServerSteps**

```
1        const newDoc: PMDocument = {
2          ...syncDoc,
3          version: newVersion,
4          doc: doc.toJSON(),
5          _rev: syncDoc._rev,
6          updatedAt: getTimestamp(),
7        };
8        await DBS.serverDB
9          .put(newDoc)
10          .then(() => DBS.serverDB.bulkDocs(serverSteps))
11          .then(() => syncClientStep(DBS, clientStep, StepStatus.ACCEPTED));
```

The server functionality is implemented in [processSteps.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/processSteps.ts)

## Data flow on the clients

### Sending new steps

The function in [postSteps.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/postNewSteps.ts) is called by ProseMirror whenever there is an incoming ProseMirror transaction ( either the user did something in the editor, or the server sent new steps coming from another user ). In that function, sendable steps are calculated by the **prosemirror-collab** module, and if there's any then they are written to the database as **ClientSteps**. The ProseMirror view is also updated.

`1  import { sendableSteps } from "prosemirror-collab";`
A ProseMirror editor state is created from the transaction:

```
1  //body of the postNewSteps function
2  const newState = view.state.apply(tr); // transaction
```

This newly created state is then passed into the _sendableSteps_ function provided by the **[prosemirror-collab](https://prosemirror.net/docs/guide/#collab)** module:

```
1  //body of the postNewSteps function
2  const sendable = sendableSteps(newState);
3  if (sendable) {
4    const timestamp = getTimestamp();
5    const newStep: ClientStep = {
6      steps: sendable.steps.map(step => step.toJSON()),
7      version: sendable.version,
8      status: StepStatus.NEW,
9      collection: DBCollection.ClientSteps,
10      docId: DocID,
11      pmViewId: sendable.clientID,
12      createdAt: timestamp,
13      updatedAt: timestamp,
14    };
15    DB.post(newStep);
16  }
17  setPmState(newState);
```

### Receiving new steps

The [fetchNewStepsClient.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/fetchNewStepsClient.ts) contains a function which is used in a React **useEffect** in [index.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/index.tsx), and gets reloaded every time the version of the document is updated. This is necessary since this function only listens to the step in **ServerSteps** which has the version that updates the current document. If there is a new step then new ProseMirror transaction is sent to the ProseMirror view, which contains all the necessary information to both updates the view and the collab state.

```
1  listener.on("change", data => {
2    const serverStep = data.doc;
3    if (serverStep?.collection !== DBCollection.ServerSteps) {
4      return;
5    }
6    getVersion(pmView.state) === serverStep.version &&
7      pmView.dispatch(
8        receiveTransaction(
9          pmView.state,
10          [Step.fromJSON(mySchema, serverStep.step)],
11          [serverStep.pmViewId],
12        ),
13      );
14  });
```

## Improvements, challenges and everything else

This example runs in just a single browser instance, but if one moves the server-side code ( mostly [processSteps.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/processSteps.ts) and some parts of **[initializeDB.ts](https://github.com/emergence-engineering/blog/blob/master/articles/prosemirror-sync-1/initializeDB.ts)** ), removes one of the editors, and changes the remote DB location on the client-side, then it will work as a fully functional collaborative editor. Offline functionality is also possible with the same structure ( with some added code ), but keep in mind that ProseMirror's collaborative feature is not meant for offline use and it is possible to lose some information ( for example if a user typed into an existing paragraph when offline, and then the paragraph is deleted then the information is lost ), but in general, it works great.
