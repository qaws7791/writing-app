Title: Behind the feature: The hidden challenges of autosave

URL Source: https://www.figma.com/blog/behind-the-feature-autosave/

Published Time: 2020-10-27

Markdown Content:

# Behind the feature: the hidden challenges of autosave | Figma Blog

[Skip to main content](https://www.figma.com/blog/behind-the-feature-autosave/#main)

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

October 27, 2020

# Behind the feature: The hidden challenges of autosave

![Image 5](blob:http://localhost/52b8d578f5bf1891c176cb08959360dc)![Image 6](https://cdn.sanity.io/images/599r6htc/regionalized/5fb7cf11990425879902bbbc7527eed8abd71e38-400x400.jpg?w=400&h=400&q=75&fit=max&auto=format)

Rudi Chen Software Engineer, Figma

- [Inside Figma](https://www.figma.com/blog/inside-figma/)
- [Product updates](https://www.figma.com/blog/product-updates/)
- [Engineering](https://www.figma.com/blog/engineering/)
- [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)

![Image 7](blob:http://localhost/7c642044305810ef71b63be133bdb891)![Image 8](https://cdn.sanity.io/images/599r6htc/regionalized/cddcfc9daa04ec5d782be3491cfff62fb287d5fc-2120x1000.png?rect=1,0,2119,1000&w=1632&h=770&q=75&fit=max&auto=format)

We recently expanded our autosave system so you can work in Figma without worrying about losing changes. Rudi dives into the technical challenges and product decisions involved in bringing it to life.

## Share Behind the feature: The hidden challenges of autosave

_We recently expanded [autosave in Figma](https://help.figma.com/hc/en-us/articles/360040328553-Can-I-work-offline-with-Figma-) so you can work offline without worrying about losing changes. Engineer [Rudi Chen](https://twitter.com/digitalfreepen) takes us behind the scenes of building this update: how we made product decisions, managed large merge conflicts, and navigated the complexities of Figma’s multiplayer technology._

It wasn’t so long ago that software made you hit the save key obsessively. After all, we’ve all had an unlucky circumstance in which we closed the application accidentally, it crashed, or we lost power—and hours of work. In online applications like Figma, we flush changes to the server as soon as they’re made; offline changes can’t sync with the server until you reconnect to the internet. Until recently, users ran the risk of losing data should something happen to their computer or browser while offline.

With our newly expanded autosave system, edits now save to disk when a document becomes disconnected from the server so changes to the document persist—even if the tab with Figma closes. When the user next reloads this document in a new tab, the changes will be restored and uploaded to the server.

But why does such a feature warrant a blog post? “Saving the file to disk periodically” isn’t exactly a groundbreaking innovation. But as it often happens, interesting challenges lie not in individual features, but the interaction between them. Figma’s central paradigm is being a browser-based, cloud-based, and realtime application. [We’ve written ### How Figma’s multiplayer technology works A peek into the homegrown solution we built as the first design tool with live collaborative editing.](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) about how we handle conflict resolution in multiplayer before. Now, in the process of examining autosave, we’ll see how how supporting multiplayer adds a lot of complexity to other features too.

## [How to write changes to disk](https://www.figma.com/blog/behind-the-feature-autosave/#how-to-write-changes-to-disk)

The most intuitive way to save a document is how it has always been done: serialize the in-memory representation of the document as a backup file and write it to disk. Restoring lost changes is as simple as opening the backup. There’s not much room for things to go wrong in this approach.

Unfortunately, in the context of a cloud-based application, this approach isn’t practical both from a technical and product standpoint.

In Figma, documents are represented as a tree of layers (nodes). We refer to it as the **scenegraph** and it is our central data structure. It turns out that our users can and do create very large documents. We regularly see files that are tens of megabytes as a compressed binary and hundred of megabytes when loaded in memory. Serializing the largest files can actually take a few seconds. Last year, this was a big enough issue to [disqualify our initial implementation ![Image 9](blob:http://localhost/b65f734caf37aeeac25ff352c9eaea18)![Image 10](https://cdn.sanity.io/images/599r6htc/regionalized/70e74a9fae7202ca51ab221135971777eec1ca8a-4240x2000.png?w=4240&h=2000&q=75&fit=crop&crop=focalpoint&auto=format) ### How to build a plugin system on the web and also sleep well at night How do you run plugins with security, stability, and performance? Our pursuit for the perfect plugin solution, and how our approach helps us run Figma plugins in a safe way.](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) for a plugin sandboxing.

In fact, the performance requirements for autosave are actually much higher than plugins. Even if we managed to optimize serialization by 10-20x so that it only takes 100ms, this is still unacceptable. The user would experience a regular 100ms stutter whenever we save the file since Figma is built in the browser and JavaScript and WASM are single-threaded.

It would be nice to use shared memory multithreading, but it’s barely supported by browsers and not a safe option. Rather, a typical way that Figma deals with expensive operations is to split work across multiple frames. However, this isn’t merely a browser/JavaScript problem. Concurrency, regardless of how it’s achieved, opens up an even bigger challenge: the problem that the user could make changes to the document during serialization.

In an ideal architecture, serialization would read-off an immutable scenegraph. However, while elegant, that would require an immense rewrite of the application, as the scenegraph is used by almost every bit of our product code. Furthermore, immutable data structures are not a silver bullet—they come with tradeoffs such as slower write performance and increased memory usage.

Finally, in terms of product decisions, saving the entire file also opens up non-trivial questions. Since our files are cloud-based and can be edited by multiple people at once, replacing the existing file with the backup could end up overwriting _newer_ changes in the file. Leaving the backup as a copy also fails, because some files are the source of truth for shared assets (components such as buttons, modals in a design system).

## [Saving changes as a delta](https://www.figma.com/blog/behind-the-feature-autosave/#saving-changes-as-a-delta)

The alternative to saving the entire file is to write to disk only the changes made since the document went offline. We have this “delta” as part of our collaborative editing system, to keep track of which changes need to be sent to and acknowledged by the server. To restore changes, it suffices to apply this diff on top of the latest version of the document.

So the prototypical case looks something like this:

- User loads document
- User ends up offline
- User makes changes, which get stored in an in-memory pending changes buffer
- Contents of the pending change buffer are committed to disk on a regular interval
- Document closes unexpectedly
- User loads document again
- Pending changes are deserialized and applied on top of the document
- Pending changes are uploaded to the server

There are a few options for on-disk storage via browser APIs. Since we want to store potentially large amounts of data, in smaller chunks for access performance, and data integrity is important, we use IndexedDB. Key features include database indices and transactional operations.

The pending changes are stored as a set of property changes on a per-file, per-(node/layer) basis. This level of granularity helps achieve a balance between storage overhead and redundant IO. The more granular the changes, the more overhead is used to store each row. However, if we stored pending changes for all nodes in a single object, then we would have to write the entire set of pending changes every time a change is made. By storing changes per-node, we only need to write changes between commits.

## [Beyond linearity](https://www.figma.com/blog/behind-the-feature-autosave/#beyond-linearity)

When dealing with linear history, re-applying a stored diff to a document isn’t hard. After all, that’s how undo-redo works, a pretty basic feature in Figma.

If Figma was a single-user application, it’d be relatively easy to ensure that [autosave] _only_ needs to be implemented in the context of a linear history. For example, you could ensure that only one instance of Figma could open a file at a given time, and require the user to apply or discard autosaved changes immediately upon re-opening the file.

However, in a collaborative editor, documents don’t have a purely linear history. Even when users are not explicitly creating branches of their document, they are continuously creating implicit branches whenever they make local edits. We don’t normally think of these as branches, because the real-time capabilities of the editor means these transient branches get “merged” within fractions of a second. But as the animation shows below, we might say that a branch was created at some point in time.

The autosave feature, however, targets use cases in which the user is disconnected from our servers for minutes to hours. The client could be making much larger sets of changes and leave them on disk for days. The server could also have receiving much larger sets of changes from other clients in the meantime. Then, autosave changes are more clearly a branch that split off from the file at the time the user disconnected.

Therefore, autosave often needs to “merge” the diff on top of the latest document. And doing so creates unexpected and rather subtle issues.

Even in the absence of other users, it’s possible for the same user to edit a document from multiple tabs. These sets of changes must then be applied sequentially on top of the latest document.

## [Large merge conflicts](https://www.figma.com/blog/behind-the-feature-autosave/#large-merge-conflicts)

Most of the time, merging diffs just works. After all, our data structures are designed to support concurrent editing. However, our multiplayer system is meant to handle small conflicts during editing. The assumption is that you get immediate visual feedback if changes between you and your coworker are clashing. Our system does not understand _user intent_, a notoriously hard problem, and therefore may not be able to effectively merge large-scale changes without creating a _mess_.

However, just because these large-scale conflicts are _possible_ doesn’t mean that they are _common_. To optimize for making the common use case work smoothly, we automatically create a version history checkpoint (a feature in Figma similar to a Git commit) before and after applying the diff. This allows the user to easily revert the merge in the event in these special cases.

A more proper solution would be to create an interface that would allow users to resolve merge conflicts. However, effectively representing diffs visually for a 2D design document is still an unsolved problem in the industry and could well be a larger project than autosave itself. (Of course, that’s also worth solving, but as a separate problem.) By making product decisions such that the two projects aren’t interdependent, we can function more effectively as an organization. It may be less exciting, but it lowers coordination overhead needed when adding more people to a project. It also makes it easier to validate our solutions incrementally. Sometimes, we run into unexpected technical limitations or user feedback that require us to redo parts of a project. Leaner projects lower that risk.

When a technical solution isn’t available yet, we can also help mitigate the issue via product solutions. We also show UI in the file browser that actively prompts the user to restore their changes. Besides reducing the chances of server-side conflict, this design indicate that this feature is meant for crash recovery, not as a long-term local storage solution. After all, it is only storing diffs, not entire files.

The tradeoff is that when you do have changes, the UI is intentionally very prominent. Therefore, it becomes especially important to not have autosave changes if the user doesn’t “expect” to have lost changes.

## [Stale changes](https://www.figma.com/blog/behind-the-feature-autosave/#stale-changes)

We’ve looked at the targeted use case where we leave local changes on disk and the tab closes. But the most common scenario is when the tab stays open: we write changes to disk, then latter the tab reconnects, syncs change to the server, then clears those changes from disk.

It’s important to make sure these changes have been cleared from disk. With autosave, an important invariant is that the node changes stored on disk are exactly equal to the pending node changes stored in memory.

Clearly, if we’re missing a change on disk, then there’s a potential data loss bug.

However, if we have extra changes on disk, that’s _also_ a problem. From a UX perspective, it’s quite confusing for the user to be prompted about unsaved changes that have, in reality, already been saved to the server. But stale changes are even worse than redundant changes. For example, if one of the changes says “set the height of nodeID=15 to 100” but the user had since changed the height of that node from 100 to 50, that’s also a bug.

If we were dealing with linear history, the worst a stale change could do is no-op. Still, even no-op changes are noisy. Furthermore, with branching history, the stale change could end up overwriting a newer change. Although the checkpoint we create makes this reversible, it still appears to the user as if “Figma lost some recent edits,” thereby reducing user trust and counteracting the whole point of this feature to begin with.

We’ve run into a number of ways in which we can end up with stale changes on disk. First, there’s the asynchronous nature of the process. When a tab reconnects to the server, it sends the pending changes, then waits for an acknowledgment. Until then, the document is in an unsaved state and we prevent the user from closing the tab to avoid losing changes. However, while an autosave change is stale as soon as it arrives on the server, it is safe to clear from disk once the client has received the ack. Therefore, we consider the document to be in an unsaved state until the changes are acknowledged by the server _and_ cleared from disk.

We also encountered subtle bugs. For example, some changes never got cleared from disk if a tab disconnected and reconnected. To share some context, the autosave implementation involves a document change observer to keep track of changes that need to be uploaded to the server, or written to disk. The issue was that after connecting, we reapply any local offline changes on top of the latest version of the document from the server. However, if the local change was the same as the latest server change, the property setter would no-op and short-circuit the code before it triggered the observers. As a result, the autosave system was never notified that this change needed to be removed from disk. Our solution to this issue was to take a more conservative approach. After reconnecting, it’s safer to erase the changes already stored on disk and re-serialize all pending changes. With IndexedDB, this can be done in a single transaction.

## [Essential complexity](https://www.figma.com/blog/behind-the-feature-autosave/#essential-complexity)

On one hand, the additional complexity to implement autosave is largely _accidental_, having only to do with the particular design of the system. The exact wrinkles to iron out will differ from system to system. However, the fact that there are many of these sorts of wrinkles is fundamentally due to the branching that occurs because of Figma’s multiplayer capabilities. And that, is _essential_ complexity.

The challenges we encountered implementing autosave are representative of a more general set of challenges we encounter at Figma. As much as we would like a multiplayer system to be a self-contained black box, the truth is that it's a leaky abstraction. Supporting collaborative editing as a central paradigm in our application means that we're introducing a lot more asynchronous behavior such as transient branches. This then leads to thorny issues and ultimately, more complexity in the many of the features we build.

These features are what make Figma a powerful product and as a side effect, there are always plenty of interesting engineering challenges to solve. If collaborative editing and building reliable systems sounds interesting to you, [we’re hiring](https://www.figma.com/careers/)!

![Image 11](blob:http://localhost/52b8d578f5bf1891c176cb08959360dc)![Image 12](https://cdn.sanity.io/images/599r6htc/regionalized/5fb7cf11990425879902bbbc7527eed8abd71e38-400x400.jpg?w=400&h=400&q=75&fit=max&auto=format)

Rudi Chen is a Software Engineer, and was previously on the infrastructure team at Figma.

## Subscribe to Figma’s editorial newsletter

Enter email\*

I agree to opt-in to Figma's mailing list.\* - [x]

By clicking “Subscribe” you agree to our [TOS](https://www.figma.com/tos/) and [Privacy Policy](https://www.figma.com/privacy/).

## Related articles

- [![Image 13](blob:http://localhost/c67c2e8f154ac3cdc99b92f94c1ff1a9)![Image 14](https://cdn.sanity.io/images/599r6htc/regionalized/8e26edb323f256d156ea96879b50d7bb9f4f0ad0-4240x2000.png?rect=0,1,4240,1999&w=804&h=379&q=75&fit=max&auto=format) ### Behind the feature: shedding light on shadow spread July 23, 2020 By Lauren Budorick An engineer shares how we built support for shadow spread in Figma: exploring algorithms, going down W3C spec rabbit holes, and how she made hard decisions about a (seemingly) simple user request.](https://www.figma.com/blog/behind-the-feature-shadow-spread/)

      *   [Inside Figma](https://www.figma.com/blog/inside-figma/)
      *   [Product updates](https://www.figma.com/blog/product-updates/)
      *   [Behind the scenes](https://www.figma.com/blog/behind-the-scenes/)

- [![Image 15](blob:http://localhost/eb295b785437cf2b278ccdc7230fd8fb)![Image 16](https://cdn.sanity.io/images/599r6htc/regionalized/e4ed3093cfee7148c26495f2caabef4c69413c56-4240x2000.png?rect=0,1,4240,1999&w=804&h=379&q=75&fit=max&auto=format) ### A deep dive on deep search July 21, 2020 By Shloak Jain We recently rolled out deep search to help you find the right file even faster. Here, the team who built it gives you a behind-the-scenes look at the technical challenges they faced and the tradeoffs they made along the way.](https://www.figma.com/blog/deep-search/)

      *   [Inside Figma](https://www.figma.com/blog/inside-figma/)
      *   [Engineering](https://www.figma.com/blog/engineering/)
      *   [Product updates](https://www.figma.com/blog/product-updates/)
      *   [Design systems](https://www.figma.com/blog/design-systems/)

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

- [English](https://www.figma.com/blog/behind-the-feature-autosave/?context=localeChange)
