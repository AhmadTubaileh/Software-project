# Chapter 3: Methodology

## 3.1 System Overview

MARS is implemented as a full-stack system composed of three main layers: client applications (web and mobile), a server-side API, and a relational database. The client applications are built using a component-based frontend framework and are responsible for handling user interaction, data presentation, and communication with backend services through RESTful APIs.

The backend is implemented using Node.js and acts as the central coordination layer of the system. It exposes resource-oriented endpoints that enforce business rules, manage access control, and coordinate interactions with the database. The relational database stores all persistent system data, including products, users, contracts, payments, projects, and tasks, ensuring consistency and integrity across the system.

Communication between layers follows a standard request–response model. Clients issue HTTP requests to retrieve or modify data, and the server validates incoming requests, executes the required business logic, performs database operations through model modules, and returns structured JSON responses. File uploads are handled as multipart form data and processed using dedicated middleware. Where applicable, uploaded files are stored or further processed, such as extracting text using OCR, before results are returned to the client.

The overall architecture emphasizes separation of concerns. Presentation logic is confined to the client layer, request handling and validation are managed by the API, and data access is isolated within model modules. This separation improves maintainability and allows individual components to be tested and extended independently.

## 3.2 Backend Architecture

The server-side application is implemented using Node.js with the Express framework. Backend functionality is organized into modular route files, where each module corresponds to a specific resource domain such as items, employees, projects, tasks, or payments. These route modules define the available HTTP endpoints and delegate request handling to controller or handler functions.

Cross-cutting concerns, including authentication, authorization, file upload handling, and basic input validation, are implemented using middleware. This approach reduces duplication and ensures that shared logic is applied consistently across relevant routes.

Data persistence is handled through a set of model modules that encapsulate SQL queries and interactions with a MySQL database. The project uses a callback-based database access style provided by the mysql/mysql2 driver. This design choice was made to keep implementation straightforward within the project timeline and based on team familiarity. However, it is identified as a candidate for future refactoring, as migrating to a Promise-based or async/await approach would simplify asynchronous flow control and improve error handling in larger systems.

A clear separation is maintained between controllers and models. Controllers translate HTTP requests into application-level actions and prepare input for database operations, while model modules focus exclusively on SQL construction, execution, and result mapping. Database configuration is centralized, allowing connection settings and pooling behavior to be managed consistently.

Authentication and authorization mechanisms are enforced at both the route and controller levels. Users are assigned predefined roles—such as customer, worker, admin, or co-admin—which determine the operations they are allowed to perform. Middleware inspects user roles and restricts access to protected resources accordingly.

## 3.3 File Upload and OCR Processing Methodology

File uploads in MARS are handled using a middleware library that supports different storage strategies. Two approaches are applied depending on the type of uploaded content and its intended usage.

For product images, memory-based storage is used. Uploaded images are temporarily stored in memory buffers and may be converted to base64 or other serializable formats for immediate use in API responses. This approach simplifies handling small image files and avoids managing a large number of files on disk, but it increases memory usage and is therefore suitable only for relatively small uploads.

For project and task attachments, disk-based storage is employed. Uploaded files are saved to a dedicated directory on the server and served statically when required. Disk storage is more appropriate for larger or persistent files, but it introduces additional considerations such as file cleanup, access control, and backup management.

After upload, certain files are passed to an OCR service for processing. The OCR component uses trained datasets to extract textual information from receipts or scanned documents. Depending on the storage strategy, the OCR service processes either an in-memory buffer or a file path on disk. The extracted text is then made available to other system components, such as attaching recognized content to payment records or supporting downstream recommendation logic.

## 3.4 Design Trade-offs

Several design trade-offs influenced the project methodology:

- Memory versus disk storage: Memory-based uploads simplify short-term image handling but increase memory consumption and are unsuitable for large files. Disk-based storage supports persistence and larger files but requires additional operational management.

- Callback-based database access: Using callbacks reduced initial complexity and development time but results in more nested control flow. Refactoring to Promises or async/await would improve readability and error handling in future versions.

- Local deployment focus: Emphasizing local deployment simplified development and testing but limits scalability and availability. Transitioning to a cloud-based architecture would require redesigning configuration, storage, and scaling strategies.

- Prototype AI components: The OCR and recommendation features are implemented as prototypes. Their effectiveness depends on the quality and quantity of available training data, and production-grade accuracy would require further dataset expansion and model tuning.

Overall, the methodology prioritizes clear separation of concerns, incremental development, and explicit documentation of limitations and future improvements. These choices align with the academic nature of the project and its resource constraints while leaving a clear path for future enhancement and scaling.