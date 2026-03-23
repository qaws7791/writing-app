Title: Making multiplayer more reliable

URL Source: https://www.figma.com/blog/making-multiplayer-more-reliable/

Published Time: 2022-10-20

Markdown Content:

# Making multiplayer more reliable | Figma Blog

[Skip to main content](https://www.figma.com/blog/making-multiplayer-more-reliable/#main)

[Subscribe to Figma’s editorial newsletter](https://www.figma.com/)

[](https://www.figma.com/)

[](https://www.figma.com/blog/)

##### Categories

- [Maker Stories](https://www.figma.com/blog/maker-stories/)
- [Working Well](https://www.figma.com/blog/working-well/)
- [Inside Figma](https://www.figma.com/blog/inside-figma/)
- [Insights](https://www.figma.com/blog/insights/)

Topics

### Featured Topics

- [![Image 1](blob:http://localhost/c838903b37f4c44de21c91fc28f473f3)![Image 2](https://cdn.sanity.io/images/599r6htc/regionalized/9410fa0df527e2edce281266fa77a45313885dc1-3265x1399.png?rect=1,0,3264,1399&w=616&h=264&q=75&fit=max&auto=format) ### News Get the latest on all things Figma](https://www.figma.com/blog/news/)
- [![Image 3](blob:http://localhost/01fd9d772e084c77b78311c5ff4fd1dc)![Image 4](https://cdn.sanity.io/images/599r6htc/regionalized/94a257614468eb378d2a2dacc4e0c12da8bf4b0b-2560x1440.png?rect=0,172,2560,1097&w=616&h=264&q=75&fit=max&auto=format) ### Design systems Everything you need to know about building and scaling design systems in the age of AI](https://www.figma.com/blog/design-systems/)

---

### Explore topics

- [3D design](https://www.figma.com/blog/3d-design/)
- [Accessibility](https://www.figma.com/blog/accessibility/)
- [AI](https://www.figma.com/blog/ai/)
- [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)
- [Brainstorming](https://www.figma.com/blog/brainstorming/)
- [Branding](https://www.figma.com/blog/branding/)
- [Career & education](https://www.figma.com/blog/career-and-education/)
- [Case study](https://www.figma.com/blog/case-study/)
- [Collaboration](https://www.figma.com/blog/collaboration/)
- [Config](https://www.figma.com/blog/config/)
- [Culture](https://www.figma.com/blog/culture/)
- [Design](https://www.figma.com/blog/design/)
- [Design thinking](https://www.figma.com/blog/design-thinking/)
- [Dev Mode](https://www.figma.com/blog/dev-mode/)
- [Diagramming](https://www.figma.com/blog/diagramming/)
- [Engineering](https://www.figma.com/blog/engineering/)
- [Events](https://www.figma.com/blog/events/)
- [FigJam](https://www.figma.com/blog/figjam/)
- [Figma Buzz](https://www.figma.com/blog/figma-buzz/)
- [Figma Design](https://www.figma.com/blog/figma-design/)
- [Figma Draw](https://www.figma.com/blog/figma-draw/)
- [Figma Make](https://www.figma.com/blog/figma-make/)
- [Figma Sites](https://www.figma.com/blog/figma-sites/)
- [Figma Slides](https://www.figma.com/blog/figma-slides/)
- [Hiring](https://www.figma.com/blog/hiring/)
- [Infrastructure](https://www.figma.com/blog/infrastructure/)
- [Leadership](https://www.figma.com/blog/leadership/)
- [Marketing](https://www.figma.com/blog/marketing/)
- [Meetings](https://www.figma.com/blog/meetings/)
- [Motion](https://www.figma.com/blog/motion/)
- [Operations](https://www.figma.com/blog/operations/)
- [Plugins & tooling](https://www.figma.com/blog/plugins-and-tooling/)
- [Portfolio](https://www.figma.com/blog/portfolio/)
- [Product management](https://www.figma.com/blog/product-management/)
- [Product updates](https://www.figma.com/blog/product-updates/)
- [Productivity](https://www.figma.com/blog/productivity/)
- [Profiles & interviews](https://www.figma.com/blog/profiles-and-interviews/)
- [Prototyping](https://www.figma.com/blog/prototyping/)
- [Quality & performance](https://www.figma.com/blog/quality-and-performance/)
- [React](https://www.figma.com/blog/react/)
- [Report](https://www.figma.com/blog/report/)
- [Research](https://www.figma.com/blog/research/)
- [Security](https://www.figma.com/blog/security/)
- [Social impact](https://www.figma.com/blog/social-impact/)
- [Strategy](https://www.figma.com/blog/strategy/)
- [The Long & Short of It](https://www.figma.com/blog/the-long-and-short-of-it/)
- [Thought leadership](https://www.figma.com/blog/thought-leadership/)
- [Tips & inspiration](https://www.figma.com/blog/tips-and-inspiration/)
- [Typography](https://www.figma.com/blog/typography/)
- [UI/UX](https://www.figma.com/blog/ui-ux/)
- [Wireframing](https://www.figma.com/blog/wireframing/)
- [Writing](https://www.figma.com/blog/writing/)

October 20, 2022

# Making multiplayer more reliable

![Image 5](blob:http://localhost/fe7f22cf60a68fc81179b6e9fa2f0458)![Image 6](https://cdn.sanity.io/images/599r6htc/regionalized/0f22360e57fb858661d6bed4f2fdea105378d19d-200x200.jpg?w=200&h=200&q=75&fit=max&auto=format)

Darren Tsung Software Engineer, Infrastructure, Figma

- [Inside Figma](https://www.figma.com/blog/inside-figma/)
- [Quality & performance](https://www.figma.com/blog/quality-and-performance/)
- [Engineering](https://www.figma.com/blog/engineering/)

Design has always been a team sport. These improvements make sure everyone is on the same page.

## Share Making multiplayer more reliable

Being [browser-first](https://www.figma.com/blog/meet-us-in-the-browser/) is more than a feature, it's a responsibility. Our platform team spends a lot of time focusing on how to make Figma _just work_ for the people that depend on it.

Over the last year, we’ve created a write-ahead log that makes our system more reliable than before. 95% of edits to a Figma file get saved within 600ms, which means that as the teams that use Figma scale, their work can scale with them. We wanted to share exactly how we got to that sort of reliability, but before we get started, we’ll need to provide some context on how exactly Figma’s multiplayer editing works.

## [How multiplayer works](https://www.figma.com/blog/making-multiplayer-more-reliable/#how-multiplayer-works)

Real-time multiplayer editing and collaboration is one of Figma’s key features, and we’ve written[about how it works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) on the blog before. In this post, we’ll dive into what multiplayer infrastructure looked like _before_ we added the write-ahead log and underscore the changes we’ve made since then.

When you open a Figma file in your browser, the client establishes a websocket connection to our servers—a service we call multiplayer. This service synchronizes the state of the file across multiple clients by receiving and broadcasting updates to all connected clients. Multiplayer is authoritative and handles validation, ordering, and conflict resolution. In order to keep things as fast as possible, multiplayer holds the state of the file in-memory and updates it as changes come in.

Because keeping state in-memory is volatile, multiplayer periodically writes the state of the file to storage every 30 to 60 seconds in a process we call “checkpointing.” To create a checkpoint, the entire file is encoded into a binary format, compressed, and uploaded to S3. This system is simple, easy to understand, and is fundamental to how [some of our product features work](https://help.figma.com/hc/en-us/articles/360038006754-View-a-file-s-version-history).

![Image 7](blob:http://localhost/30120db6db530179aef7b29a28af7db1)![Image 8](https://cdn.sanity.io/images/599r6htc/regionalized/9a3bb99ee8c19f9924bcd2c74d6bf50c32f3344c-2120x1109.png?rect=1,0,2118,1109&w=804&h=421&q=75&fit=max&auto=format)

But a checkpoint-centric system has a number of downsides. Since checkpoints were created only every ~60 seconds, we could lose up to 60 seconds of work on the server-side if multiplayer crashes. And while the probability of failure in this system is low, we want to continue improving our reliability so that even when issues happen they’re completely transparent to the user.

We wanted to reduce our reliance on checkpoints for internal reasons as well. A checkpoint-centric system causes large spikes in checkpoint load when multiplayer is re-deployed. Before a file can be closed, it first needs to ensure that all changes are saved to a checkpoint. During normal operation, files are opened and closed at a regular rate, checkpoints are made periodically, and the rate of checkpoints across all files averages out to a steady rate. However, when multiplayer is re-deployed, _all_ files that are held in memory are closed, which causes a surge in checkpoints and subsequently increased load on the database.

## [Introducing the journal](https://www.figma.com/blog/making-multiplayer-more-reliable/#introducing-the-journal)

In order to address those issues and improve the state of the system, we decided to add a transaction log. The transaction log acts as a journal of changes made to the file, and it is core to our approach. At a high level, the journal is a durable datastore that is asynchronously written to as multiplayer accepts incoming changes. Each change is assigned a _sequence number_, which is an incrementing integer associated with the file. Every checkpoint is written with the current sequence number as well.

Here’s how that works in practice:

Let's say multiplayer crashes. On next load, the latest checkpoint is read as usual, and is 60 seconds out of date. But after the checkpoint is loaded, multiplayer queries for all entries that are newer (i.e. have a higher sequence number) than the checkpoint. With these entries, multiplayer is able to recover to the latest state of the file. As long as data is written to the journal quickly, data loss in rare failure conditions stays minimal. (Our goal was <1s of data loss.)

The journal is helpful because we’re simply writing data more frequently (think: every 0.5 seconds vs. every 60 seconds). But there’s a big distinction between the data that we’re writing to the journal vs. in a checkpoint. The entries in the journal are the _incremental_ changes that users are making to the file, like an editor tweaking copy or a designer updating a mockup. Writing a checkpoint scales based on the size and complexity of the _entire_ file, which accumulate over time as companies and users build more complex files and design systems. The contents of an entire file are often orders of magnitude larger than the incremental updates to the file. Journal entries and checkpoints are dual solutions that make the entire platform more reliable, whether you’re shifting a couple pixels or starting from scratch.

![Image 9: A diagram showing current states](blob:http://localhost/ffb89f25ef1b76a8019f209ef0f68a20)![Image 10: A diagram showing current states](https://cdn.sanity.io/images/599r6htc/regionalized/e8b2ed7c0498b39321d50b8078740cd145883f96-2120x1109.png?rect=1,0,2118,1109&w=804&h=421&q=75&fit=max&auto=format)

Another benefit of the journal is that we also solved our spike in writes (i.e. checkpoints) during deployment. Because we’re able to write changes more frequently, all we have to do when deploying multiplayer is to close all connections and wait for any unsaved changes to be persisted in the journal. (For the 99th percentile this takes less than 1 second.) Because this is now just normal behavior for the platform, the write-load on the journal stays steady and predictable and we don’t cause any extra load on the database.

## [Making a more perfect journal](https://www.figma.com/blog/making-multiplayer-more-reliable/#making-a-more-perfect-journal)

At a high-level the concept of a journal is simple, but there were a number of tricky details that we had to make sure we got right. Here are some other details about our efforts to improve multiplayer reliability:

### [Datastore considerations](https://www.figma.com/blog/making-multiplayer-more-reliable/#datastore-considerations)

We used DynamoDB as our backing datastore, but considered a number of other options ranging from databases we were more familiar with, to writing to attached local volumes. For example, we also use Postgres heavily in our architecture, but chose not to use it here because we understood that the volume of writes would require us to consider a horizontally-scalable database—and we’re not there quite yet with Postgres.

### [Changes, batched](https://www.figma.com/blog/making-multiplayer-more-reliable/#changes-batched)

Because clients send updates every 33ms (30 FPS) and we don’t need that level of granularity in the journal, we can improve performance by batching multiple changes together and only writing to the journal every so often. This requires that our data-model for journal entries needs to change to have a start_sequence_number and end_sequence_number. This is harder to reason about, for example, if we load a checkpoint with sequence number 7, the journal might have an entry with sequence numbers [start: 5, end: 9]. But this still works for our use case because applying that entry will still result in the correct file at sequence number 9 due to the[last-writer wins conflict resolution strategy](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/#how-ots-and-crdts-informed-our-multiplayer) we use.

### [Managing conflicting writes](https://www.figma.com/blog/making-multiplayer-more-reliable/#managing-conflicting-writes)

Remember how multiplayer keeps the state of the file in-memory? It’s important that all clients that open a particular file get connected to the multiplayer instance that has the file open; otherwise we’d get into “split brain” and clients on one instance would see something different than clients on another instance. With the addition of the journal, the failure cases get even more complex because contending multiplayer instances could write conflicting histories in the journal and corrupt it.

To solve this, we added a mechanism to lock the file via a new table in DynamoDB. Multiplayer writes a (lock UUID, file key) entry to take ownership of that file. When new entries are being written to the journal, the update is conditional on the lock UUID matching in the other table. Finally, we ensure that entries from the journal are not read until after ownership is acquired, and the reads are strongly consistent. These changes ensure that only one Multiplayer instance is writing to the journal at a time and that the handoff handles race-conditions.

### [An alternative to cross-region replication](https://www.figma.com/blog/making-multiplayer-more-reliable/#an-alternative-to-cross-region-replication)

To ensure that we can recover from the most extreme scenarios, we want file data to be cross-region replicated within 30 minutes.

Unfortunately, existing solutions for cross-region replication with DynamoDB did not work for our needs. One approach is to use global tables, however the cost of replicated writes was too much—and discussion with AWS confirmed that it was not the ideal or intended usage of global tables. Our estimates showed that this would increase the cost of the feature by 6x! Another solution is to schedule regular backups of the table and export them to S3, where they can easily be replicated across regions. Unfortunately, creating a backup with the write-load and table size we had would take longer than 30 minutes. The ideal solution would be to use point-in-time (incremental) backups that were cross-region replicated, but that wasn’t supported at the time.

So file data in the journal isn’t cross-region replicated. But because checkpoints are stored in S3 and already set up to be replicated cross-region, we found that we were able to satisfy the 30-minute goal by ensuring that all changes in the journal were checkpointed within that time frame. For cases where multiplayer closes the file without checkpointing, it also enqueues an async job which will trigger a checkpoint after some jittered delay. The delay is important because we don’t want to re-introduce a spike of writes when multiplayer is re-deployed.

### [Journal consistency](https://www.figma.com/blog/making-multiplayer-more-reliable/#journal-consistency)

How do we make sure that the journal is capturing writes to the file from all code paths? We don’t want to lose any data when we read the state from the journal instead of a checkpoint. And because writes depend on the context of the file when they were written, applying without the correct context could cause unexpected behavior. For example, if update A moves a child node out from a parent node, and update B deletes the parent node, applying update B without update A would result in the child node being deleted unexpectedly.

This is where having[multiplayer being written in Rust](https://www.figma.com/blog/rust-in-production-at-figma/) really helped! By refactoring the code to isolate ownership of the file into an encapsulated type, it was easy to audit all cases where the file gets updated and ensure that the corresponding payload was written to the journal and the sequence number was incremented. Additionally, we were able to provide self-serve read access to the underlying file type without granting mutable access. If other devs at Figma who lack context want to access the file mutably without writing to the journal, they’d have to ignore a very-well documented file and reviews from the code owners.

### [Validating the journal](https://www.figma.com/blog/making-multiplayer-more-reliable/#validating-the-journal)

We’ve refactored, audited the logic, and wrote tests. Still, how can we be sure that we’ve covered all the edge cases in the millions of Figma files that exist out in the wild? To build more confidence, we ran validations against real-world data. If we have a file at checkpoint A, make some changes, and end up with checkpoint B, we should be able to check that re-creating checkpoint B from checkpoint A and from all the entries between checkpoints A and B results in a byte-by-byte identical file blob. These validations were run asynchronously on a fraction of checkpoints during a dark-launch period where changes were only written to the journal and not read from the journal.

After ~400K consecutive successful validations, we started rolling out the feature to a fraction of the files, eventually reaching 100% rollout after careful monitoring. Today the journal handles >2.2B received changes per day, persists 95% of changes within ~600ms, and has helped prevent a number of incidents from causing data loss! The journal is also a key part in several teams’ on-call handbooks for investigating and debugging tricky edge-case errors.

## [Looking ahead](https://www.figma.com/blog/making-multiplayer-more-reliable/#looking-ahead)

What’s next for the journal? There are a number of things we’re excited to follow up on in the future.

### [Faster load times](https://www.figma.com/blog/making-multiplayer-more-reliable/#faster-load-times)

We can use the journal to speed up file load times. When clients load the file, they can skip re-downloading the file if they have it locally with the same sequence number as what’s loaded by multiplayer. But if the file has changed on the server, the client has to re-download the file. Now that we have a journal, we can download some number of entries from before the checkpoint and use them to catch clients up to the current state of the file without having to send the entire file over.

### [Avoiding checkpoints](https://www.figma.com/blog/making-multiplayer-more-reliable/#avoiding-checkpoints)

Now that we have the journal, we’re no longer limited to use checkpoints for other services that want to read the current state of the file. For example, we have a public[API endpoint that renders the file to an image](https://www.figma.com/developers/api#get-images-endpoint). If the endpoint is called while the file is being edited, multiplayer needs to create a checkpoint in order for the image rendering service to get the current state of the file for rendering. This adds significant latency when the checkpoint needs to be created (for the worst 5% of files, creating a checkpoint can take ~4 seconds or more). In the future we’ll be able to leverage the journal to avoid checkpointing in these cases, which will reduce load on multiplayer and improve latency.

### [File data across Figma](https://www.figma.com/blog/making-multiplayer-more-reliable/#file-data-across-figma)

We can build a self-service platform to allow other internal teams to subscribe to and use the journal data. We have a similar system for listening to updates for metadata stored in the database (powered by the Postgres replication log) that powers a number of services in Figma. There are a number of interesting features we could power with the journal: file webhooks, activity graphs, time-lapse, etc.

Multiplayer is one of the core aspects of Figma, and makes real-time collaboration a reality for teams around the globe. We’re constantly looking to improve the multiplayer experience for users and continuing to build trust with our community of creators who need a reliable and stable platform to do their best work. If this kind of work interests you, we’re[hiring](https://boards.greenhouse.io/figma/jobs/4214856004)!

## Subscribe to Figma’s editorial newsletter

Enter email\*

I agree to opt-in to Figma's mailing list.\* - [x]

By clicking “Subscribe” you agree to our [TOS](https://www.figma.com/tos/) and [Privacy Policy](https://www.figma.com/privacy/).

## Related articles

- [### How Figma’s multiplayer technology works October 16, 2019 By Evan Wallace A peek into the homegrown solution we built as the first design tool with live collaborative editing.](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)

      *   [Inside Figma](https://www.figma.com/blog/inside-figma/)
      *   [Engineering](https://www.figma.com/blog/engineering/)
      *   [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)
      *   [Infrastructure](https://www.figma.com/blog/infrastructure/)

- [![Image 11](blob:http://localhost/dcf525345c6da3ebd30e8581273ed460)![Image 12](https://cdn.sanity.io/images/599r6htc/regionalized/c3f640b0a686eed4f1dcc5e8979f1c97342dba91-4240x2000.png?w=528&h=249&q=75&fit=max&auto=format) ### How (and why) we built branching October 12, 2021 By John Fuetsch In April, we introduced branching as a way to enable collaboration at scale. Today, branching is broadly available on our Organization plan.](https://www.figma.com/blog/how-and-why-we-built-branching/)

      *   [Inside Figma](https://www.figma.com/blog/inside-figma/)
      *   [Product updates](https://www.figma.com/blog/product-updates/)
      *   [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)

- [![Image 13](blob:http://localhost/83b6f3030dcb9f189788244e11531c39)![Image 14](https://cdn.sanity.io/images/599r6htc/regionalized/e71eea166ffa0d6b9bb8caa81e493d149d8559f5-2120x1000.png?w=528&h=249&q=75&fit=max&auto=format) ### Under the hood of Figma’s infrastructure: Here’s what goes into powering a web-based design tool November 21, 2019 By Samir Goel Scaling infrastructure at a fast-growth startup](https://www.figma.com/blog/under-the-hood-of-figmas-infrastructure/)

      *   [Inside Figma](https://www.figma.com/blog/inside-figma/)
      *   [Engineering](https://www.figma.com/blog/engineering/)
      *   [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)
      *   [Infrastructure](https://www.figma.com/blog/infrastructure/)

## Create and collaborate with Figma

[Get started for free](https://www.figma.com/signup)

[](https://www.figma.com/)

## Figma Socials

- [](https://x.com/figma "X")
- [](https://www.youtube.com/figmadesign "YouTube")
- [](https://www.instagram.com/figma "Instagram")
- [](https://www.facebook.com/figmadesign "Facebook")

## Product

- [Figma Design](https://www.figma.com/design/)
- [Dev Mode](https://www.figma.com/dev-mode/)
- [FigJam](https://www.figma.com/figjam/)
- [Figma Slides](https://www.figma.com/slides/)
- [Figma Draw New](https://www.figma.com/draw/)
- [Figma Buzz Beta](https://www.figma.com/buzz/)
- [Figma Sites Beta](https://www.figma.com/sites/)
- [Figma Make New](https://www.figma.com/make/)
- [AI](https://www.figma.com/ai/)
- [Downloads](https://www.figma.com/downloads/)
- [Release notes](https://www.figma.com/release-notes/)

## Plans

- [Pricing](https://www.figma.com/pricing/)
- [Enterprise](https://www.figma.com/enterprise/)
- [Organization](https://www.figma.com/organization/)
- [Professional](https://www.figma.com/professional/)

## Use cases

- [UI design](https://www.figma.com/ui-design-tool/)
- [UX design](https://www.figma.com/ux-design-tool/)
- [Wireframing](https://www.figma.com/wireframe-tool/)
- [Diagramming](https://www.figma.com/figjam/diagramming-tool/)
- [Prototyping](https://www.figma.com/prototyping/)
- [Brainstorming](https://www.figma.com/figjam/brainstorming-tool/)
- [Presentation Maker](https://www.figma.com/presentation-maker/)
- [Online whiteboard](https://www.figma.com/figjam/online-whiteboard/)
- [Strategic planning](https://www.figma.com/figjam/strategic-planning/)
- [Mind mapping](https://www.figma.com/figjam/mind-map/)
- [Concept map](https://www.figma.com/figjam/concept-map/)
- [AI app builder](https://www.figma.com/solutions/ai-app-builder/)
- [AI prototype generator](https://www.figma.com/solutions/ai-prototype-generator/)
- [AI website builder](https://www.figma.com/solutions/ai-website-builder/)
- [AI wireframe generator](https://www.figma.com/solutions/ai-wireframe-generator/)
- [Banner maker](https://www.figma.com/solutions/banner-maker/)
- [Ad maker](https://www.figma.com/solutions/ad-maker/)

## Resources

- [Blog](https://www.figma.com/blog/)
- [Best practices](https://www.figma.com/best-practices/)
- [GIF maker](https://www.figma.com/gif-maker/)
- [Gradient Generator](https://www.figma.com/gradient-generator/)
- [QR code generator](https://www.figma.com/qr-code-generator/)
- [Color wheel](https://www.figma.com/color-wheel/)
- [Colors](https://www.figma.com/colors/)
- [Color picker](https://www.figma.com/color-picker/)
- [Color palettes](https://www.figma.com/color-palettes/)
- [Color palette generator](https://www.figma.com/color-palette-generator/)
- [Color contrast checker](https://www.figma.com/color-contrast-checker/)
- [Font library](https://www.figma.com/fonts/)
- [Lorem ipsum generator](https://www.figma.com/lorem-ipsum-generator/)
- [Templates](https://www.figma.com/templates/)
- [Developers](https://www.figma.com/developers)
- [Integrations](https://www.figma.com/product-integrations/)
- [Affiliate program](https://www.figma.com/affiliate-program/)
- [Resource library](https://www.figma.com/resource-library/)
- [Reports and insights](https://www.figma.com/reports/)
- [Support](https://help.figma.com/hc/en-us)
- [Status](https://status.figma.com/)
- [Legal and privacy](https://www.figma.com/legal/)
- [Modern slavery statement (UK)](https://static.figma.com/uploads/160c9cb21d6020c9eacaff67ac1450eb05d48c3b)
- [Impressum](https://www.figma.com/legal/impressum/)
- [Climate disclosure statement](https://static.figma.com/uploads/3920b4eb845c36faafa7706eba7c338036471161)

## Company

- [Events](https://www.figma.com/events-and-webinars/#upcoming-events)
- [Customers](https://www.figma.com/customers/)
- [Careers](https://www.figma.com/careers/)
- [Newsroom](https://www.figma.com/newsroom/)
- [Investors](https://investor.figma.com/)
- [Figma Ventures](https://www.figma.com/ventures/)

English

- [English](https://www.figma.com/blog/making-multiplayer-more-reliable/?context=localeChange)
