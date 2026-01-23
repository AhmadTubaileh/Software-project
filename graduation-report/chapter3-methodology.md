
# Chapter 3: Methodology

## 3.1 System Overview

MARS is implemented as a full‑stack application consisting of three principal layers: client applications (web and mobile), a server side API, and a relational database. The client applications are implemented with a modern component based front end framework; they are responsible for user interaction, presentation, and invoking RESTful services exposed by the backend. The backend, implemented as a Node.js service, provides a set of resource oriented endpoints that encapsulate business rules, enforce access control, and coordinate persistence operations. The database stores the system’s canonical records products, users, contracts, payments, projects and tasks ensuring data integrity and consistency.

Interaction between layers follows a standard request–response pattern. Clients perform HTTP requests to the API to read and modify resources; the server validates requests, executes business logic, performs SQL operations via model modules, and returns JSON responses. File uploads are transmitted as multipart form data and processed by dedicated middleware; the backend coordinates storage and any subsequent processing (for example, OCR extraction) before returning references or processed results to the client.

The architecture emphasizes separation of concerns: presentation logic remains on the client, API endpoints encapsulate orchestration and validation, and data access is relegated to model modules. This separation improves maintainability and makes individual components easier to test and refactor independently.

## 3.2 Backend Architecture

The server side application is implemented using Node.js with the Express framework. Routes are organized modularly: each resource domain (for example, items, employees, projects, tasks, payments) has a dedicated route module that defines HTTP endpoints and delegates request handling to controller or handler functions. Cross cutting concerns such as authentication, file upload handling, and input validation are implemented as middleware components applied to relevant routes.

Data persistence is handled through a set of model modules that encapsulate SQL queries and interactions with a MySQL database. The codebase uses callback based database access (the mysql/mysql2 callback style) within these model modules. This choice was made for pragmatic reasons simplicity and familiarity within the project timeline and it is documented as an explicit refactoring candidate; migrating models to a Promise based or async/await pattern would simplify asynchronous control flow and improve error handling in larger scale development.

Controllers and models maintain a clear separation of responsibilities: controllers map HTTP requests to application actions and prepare the data required by models, while model modules concentrate SQL construction, query execution, and result mapping. The database configuration is centralized so that connection parameters and pooling behavior can be managed in a single location.

Authentication and authorization are enforced both at the route level and within controllers. Users are assigned roles (such as customer, worker, admin, coadmin) which determine permitted actions; middleware inspects the authenticated user’s role and blocks or allows access accordingly.

## 3.3 File Upload and OCR Processing Methodology

File uploads in MARS are handled with an established middleware library that supports multiple storage strategies. Two distinct approaches are used according to the use case:

- Memory storage for item images: Images associated with product catalog entries are accepted via multipart form uploads and stored temporarily in memory buffers. The server can convert these buffers to base64 or other serializable formats for inclusion in API responses or for short term processing. This approach simplifies immediate image handling and avoids managing many small files on disk, but it imposes memory usage concerns and is best suited for relatively small image sizes.
- Disk storage for task attachments: Files attached to projects or tasks are stored on disk in a dedicated uploads directory. These files are served statically by the server when needed. Disk storage is more appropriate for potentially larger attachments and provides persistence across server restarts, but requires management of file lifecycle, access permissions, and backup strategies.

Following upload, some files are processed by an OCR service. The OCR component uses trained datasets to improve text extraction quality for receipts and other scanned documents. The OCR service may consume either an in memory buffer (for images uploaded to memory) or a disk file path (for disk stored attachments). Extracted text is then made available to other application components (for example, attaching recognized text to a payment record or feeding items into a recommendation workflow).

## 3.4 Design Trade offs

Several deliberate trade offs guided the methodology:

- Memory vs Disk for uploads: Memory storage simplifies short lived image handling and reduces file management complexity, but it increases peak memory consumption and is unsuitable for large files. Disk storage is more robust for larger or persistent attachments but requires additional operational considerations (cleanup, backups, and file permission management).
- Callback based models: Using callback style database access reduced initial development complexity but introduces nested control flows that can be harder to reason about at scale. Refactoring to Promises or async/await would improve code clarity and error propagation, and is recommended for future iterations.
- Local deployment focus: Prioritizing a local deployment model simplified testing and reduced infrastructure overhead during development. However, it constrains horizontal scalability and availability options; migrating to cloud infrastructure would require redesigning some components (configuration management, file storage, and scaling strategies).
- OCR and recommendation prototypes: The OCR and recommendation components were implemented as prototypes to validate feasibility. Their accuracy and reliability depend heavily on training data quality and quantity; production level confidence would require more comprehensive datasets, model tuning, and evaluation.

In all cases the methodology favors clear separation of concerns, incremental improvements, and explicit identification of future refactoring opportunities. These choices align with the project’s academic scope and resource constraints while leaving a clear path forward for professionalization and scaling.

