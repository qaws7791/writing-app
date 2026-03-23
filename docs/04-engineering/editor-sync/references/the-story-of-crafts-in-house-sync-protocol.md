Title: The story of Craft's in-house sync protocol

URL Source: https://www.craft.do/ko/blog/in-house-sync-protocol

Published Time: 2024-12-30T00:00:00.000Z

Markdown Content:
Join us to learn more about how we built our own sync protocol to enable seamless collaboration across devices and support future growth.

#### Introduction

In applications like Craft, accessing and collaborating on documents across multiple devices is an essential function. Users expect to open and edit the same documents on their laptops, tablets, and phones, and seamlessly co-edit with others – even without online access.

This has been core to Craft’s approach since the very first prototype of our product. In the beginning, Craft had only two iOS developers and no engineering resources to build a custom data synchronization protocol with. Back then, the only feasible option was to use an off-the-shelf solution for the synchronization heavy lifting, for which [Realm](https://github.com/realm), a database solution and the predecessor of [MongoDB Atlas Device Sync](https://www.mongodb.com/blog/post/realm-now-part-atlas-platform), was the perfect tool. The cloud capabilities of Realm played a foundational role during our early days. However, to achieve production readiness, we had to rethink our architecture and now Craft relies on its own in-house synchronization protocol.

#### Craft's core data

Realm is an open-source database that provides persistent storage for mobile applications, which we used to store all core document data, including block content and document metadata. Realm also offered cloud capabilities through the Realm Sync extension library, which enabled seamless synchronization of the entire database across multiple devices through Realm Cloud.

This process took place automatically in the background, eliminating the burden of managing server infrastructure. When users edited their documents, their changes to Craft's underlying data model persisted in the Realm database, and Realm Sync automatically uploaded changes to Realm Cloud. Other devices received changes in real time and updated their local databases, while Realm automatically resolved any conflicting changes, like adding blocks to a document. Additionally, the document data was available for online services through public APIs offered by Realm Cloud.

![Image 1: 5.png](https://www.craft.do/images/content/blog/in-house-sync-protocol-5.png)

#### Opening up our Data

When I joined Craft as the first backend developer along with our first web developer, our first goal was to implement the initial version of [Craft’s publishing feature](https://support.craft.do/hc/en-us/articles/360019332337-Publishing-With-Craft-Web-Links). To achieve this, we needed to make Craft documents available to our web application too - so we considered several options:

- Continuing with Realm Cloud
- Using a different off-the-shelf sync solution
- Developing our own sync protocol

Our guiding principle was clear: the chosen solution had to have seamless, conflict-free, and immediate synchronization across devices while allowing for flexible and rapid server-side development.

Continuing with Realm Cloud seemed like the next logical step, as it offered several options for tackling our engineering challenges. The simplest approach was to rely on the public API of Realm Cloud. Another option was to use Realm’s connector components to sync data into a cloud platform which offers more flexibility. AWS has one of the most mature ecosystems, and I have a lot of hands-on experience with it, so choosing it as the foundation of our platform seemed like an easy decision.

However, there were significant drawbacks to this approach. For production use, we would have needed to purchase a per-user license for Realm Cloud, which was not financially sustainable with the “freemium” model we planned to introduce. Additionally, [Realm had been acquired by MongoDB](https://techcrunch.com/2019/04/24/mongodb-to-acquire-open-source-mobile-database-realm-startup-that-raised-40m/), and while all capabilities were still available, we suspected Realm would be fully integrated into the [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) product suite. This uncertainty around Realm’s future meant it wasn’t a viable option.

![Image 2: 6.png](https://www.craft.do/images/content/blog/in-house-sync-protocol-6.png)

We also explored other off-the-shelf synchronization solutions, including AWS AppSync, which is easy to set up and integrates well with other AWS services. But it’s an opinionated framework with its own client-side library that uses SQLite under the hood. Integrating this with iOS would have required significant effort.

#### Building a Custom Protocol

These challenges led us to the decision to create our own sync protocol. It required a larger initial investment, but we believed having full ownership of our stack would provide the long-term flexibility we needed as a recently launched startup.

We decided to keep Realm as the offline storage of document data in our mobile application, while completely removing Realm Cloud from our stack. In its place, we developed the Craft Sync Service, which uses [socket.io](https://socket.io/) for two-way communication between the mobile app and server. This service stores all space-related data in an RDS Postgres instance which other services could also access. For example, the Publishing Service provides publicly accessible endpoints that the Publish Page web viewer uses to fetch document data for secret links.

Instead of Realm Connect, we built our own in-app sync component that communicates with the central Sync Service. Whenever a change occurs in the local database, or another device uploads a change to the cloud, our protocol ensures everything is synchronized automatically across devices.

![Image 3: 7.png](https://www.craft.do/images/content/blog/in-house-sync-protocol-7.png)

In creating this protocol, we drew inspiration from various sources, including protocols used for real-time collaboration, and how other solutions like AppSync implement synchronization. More details about our sync protocol will be shared in an upcoming blog post.

#### Platformization

As our product matured, its internal complexity grew. We needed to ensure developers could work efficiently while minimizing the risk of mistakes. To achieve this, we began platformization for both mobile and backend systems, as well as for our new web-based editor.

This process involved establishing clear boundaries within our systems. For the mobile and web applications, it included the complete separation of UI and data components, as their development requires different engineering mindsets: UI development calls for a more creative mindset, with quick iterations and frequent experimentation, while data component development demands a more meticulous approach to ensure consistent data. UI developers should not need to worry about the complexities of data operations and synchronization and should be able to rely on well-defined platform APIs specifically designed for user interactions.

For backend services, platformization involved defining clear data ownership and exposing internal APIs for other services. The Craft Sync Service, which is our most critical core service, owns all document-related data. Other services cannot access or modify this data directly, but must go through well-defined internal APIs which ensures document data remains consistent, and is automatically synchronized across applications.

Additionally, having our own sync protocol has opened up opportunities for frontend-specific customization. The web editor, for example, has different synchronization needs than the mobile app. The mobile app synchronizes entire Craft spaces, making all document data available offline when a space is opened. In contrast, the web editor is primarily online and synchronizes individual documents. Full control of our sync protocol allows us to tailor it to this per-document scenario in the web editor.

![Image 4: 8.png](https://www.craft.do/images/content/blog/in-house-sync-protocol-8.png)

#### Conclusion

The journey of building and evolving Craft's synchronization capabilities has been critical in the success of Craft, enabling seamless collaboration and access across multiple devices. By taking full ownership of our sync stack, we gained the flexibility and control to meet the unique demands of our application. This approach lets us offer a superior user experience, and also positions us to scale and adapt as Craft evolves.

Starting out with Realm as Craft’s foundation meant we could quickly build a prototype with a powerful sync solution, which enabled us to validate the concept. However, as our user base, product, and team grew, the limitations of off-the-shelf solutions became apparent, so we developed our own sync protocol!

By taking full ownership of our sync stack, we gained the flexibility and control required to meet the unique demands of our application. This approach allowed us to offer a superior user experience and also positioned us to scale and adapt as Craft has evolved.

As we continue to innovate into the future, Craft’s commitment to platformization ensures we can maintain a clean, efficient architecture that supports both rapid development and long-term stability.
