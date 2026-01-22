
# Chapter 2: Constraints, Standards, and Earlier Coursework

## 2.1 Constraints and Limitations

The MARS project was developed within the practical constraints typical of an academic graduation exercise. Time limitations dictated prioritization of core functionality: features essential to store operations were implemented first, while advanced integrations and performance optimizations were deferred. The development team was intentionally small, which shaped design decisions toward pragmatic, maintainable patterns rather than extensive refactoring or the adoption of complex architectural frameworks.

Deployment was scoped for local and small-server environments. The chosen stack—Node.js with MySQL—supports reliable local operation but places limits on the immediate scalability and availability characteristics that cloud-native architectures can offer. As a result, assumptions about network topology, backup strategies and horizontal scaling were not pursued beyond the design stage.

Certain components of the system depend on data quality and volume. In particular, the OCR and recommendation features rely on training data and sample inputs; their effectiveness is therefore constrained by the datasets available during development. The project does not claim production-grade accuracy for these AI components; rather, it provides functional prototypes that illustrate approach and feasibility.

Security and operational hardening were addressed to a basic standard appropriate for demonstration and local use. The implementation includes standard password hashing and role-based access controls; however, comprehensive measures such as formal penetration testing, secure key management, and enterprise-grade monitoring are outside the project’s scope.

Testing and validation were focused on functional correctness of key flows. Extensive automated test suites, continuous integration pipelines, and large-scale performance tests were beyond the available time and resources and are therefore identified as areas for future work.

In summary, MARS is presented as an academically rigorous prototype that prioritizes clarity, maintainability, and demonstrable functionality within realistic resource constraints. It intentionally avoids claims of production readiness and instead highlights design choices and trade-offs made to deliver the core objectives within the project parameters.

## 2.2 Standards, Tools, and Development Practices

The project follows widely accepted engineering principles and uses common tooling to ensure clarity and reproducibility. The principal technologies and practices include:

- Backend: Node.js with the Express framework was used to implement the server-side API. The server exposes RESTful endpoints that separate concerns between routing, business logic and data access.
- Frontend and Mobile: The user interfaces were developed with React using Vite for project scaffolding and development tooling. A shared approach to services (client-side API classes) and local session management promotes consistency between the web and mobile clients.
- Database: MySQL serves as the relational data store. Database access is organized through model modules that encapsulate SQL queries and data transformations.
- APIs: The system adopts a RESTful API design. Endpoints are designed around resources (items, employees, contracts, payments, projects, tasks) with consistent HTTP verbs and clear request/response semantics.
- Configuration: Environment-specific settings are managed via local environment variables. This approach isolates credentials and deployment-specific configuration from source control and supports safe local testing.
- Access Control: Role-based access control governs user interactions. User roles (for example: customer, worker, admin, coadmin) determine available operations and UI visibility; enforcement occurs at both the client interface level and server routes.
- Engineering Practices: The team employed modular code organization (separating routes, models, services, and middleware), incremental development with small, testable changes, and basic input validation at API boundaries. Version control (git) was used for change tracking and collaboration.

Where appropriate, third-party libraries were selected for their maturity and community support (for example, bcrypt for password hashing and multer for file uploads). The project emphasizes readability, explicit data flow and documentation of service boundaries rather than experimental or brittle optimizations.

## 2.3 Earlier Coursework and Knowledge Foundations

The development of MARS drew on theoretical and practical material from prior university courses. Relevant contributions include:

- Software Engineering: Principles from software engineering—requirements elicitation, architectural design, modularization, and test planning—guided the project lifecycle. Iterative development and documenting design decisions reflect coursework practices.
- Databases: Relational database theory and practical SQL skills enabled the design of normalized tables, transaction-conscious operations and the use of prepared queries to reduce injection risk and ensure data integrity.
- Web Programming: Coursework in web technologies provided grounding in HTTP semantics, client-server interaction patterns, and front-end development using component-based frameworks. These skills supported the implementation of user interfaces and API-driven interactions.
- Security Basics: Introductory security modules informed decisions about authentication, password storage, and the need for role-based access. These foundations influenced the selection of hashing libraries and the handling of user credentials and sessions.
- AI Fundamentals: Basic study of AI techniques and machine learning concepts supported prototyping of OCR and recommendation components. Understanding supervised learning pipelines, evaluation metrics, and the dependency of model quality on training data informed realistic expectations for these features.

Collectively, these courses provided the conceptual and technical toolkit that enabled the project to balance ambition with practical constraints. They also shaped a disciplined approach to documenting assumptions, validating features incrementally, and identifying future directions for refinement and extension.

