# Chapter 2: Constraints, Standards, and Earlier Coursework
## 2.1 Constraints and Limitations

The MARS project was developed under constraints typical of an academic graduation project. Limited time required prioritizing essential system functionality, with core retail operations implemented first. Advanced features, large-scale optimizations, and extensive refactoring were postponed to ensure timely completion within the project schedule. In addition, the small team size influenced design choices, favoring clear and maintainable solutions over complex architectural patterns.

Deployment was designed primarily for local or small-scale server environments. The selected technology stack—Node.js with a MySQL database—provides stable operation for such settings but does not inherently support advanced scalability or high-availability features associated with cloud-native systems. Consequently, topics such as distributed deployment, automated backups, and horizontal scaling were considered conceptually but not implemented.

Some system components depend heavily on data availability and quality. In particular, the OCR and recommendation features rely on limited datasets available during development. Their performance is therefore constrained, and the project does not claim production-level accuracy for these components. Instead, they are implemented as functional prototypes that demonstrate feasibility and integration within the overall system.

Security considerations were addressed at a level appropriate for demonstration and academic evaluation. The system includes password hashing and role-based access control, but advanced security measures such as penetration testing, secure credential rotation, and enterprise-grade monitoring were beyond the project’s scope.

Testing focused primarily on verifying functional correctness of key workflows. Comprehensive automated testing, continuous integration pipelines, and stress testing were not implemented due to time and resource limitations. These aspects are identified as potential areas for future improvement.

Overall, MARS is presented as a well-structured academic prototype. The project emphasizes clarity, correctness, and maintainability, while explicitly acknowledging the limitations imposed by available resources and development time.

## 2.2 Standards, Tools, and Development Practices

The project follows commonly accepted software engineering standards and development practices to ensure consistency and reproducibility. Established tools and frameworks were selected to support reliable development and clear system organization.

On the backend, Node.js with the Express framework was used to implement the server-side API. The application follows a RESTful design approach, separating routing, business logic, and data access into distinct modules. This structure improves readability and simplifies maintenance.

The frontend and mobile clients were developed using React with Vite as the build and development tool. A shared approach to service modules and session handling was adopted to maintain consistency between the web and mobile interfaces. Client-side logic focuses on presentation, user interaction, and communication with the backend API.

MySQL was selected as the relational database management system. Database access is organized through model modules that encapsulate SQL queries and handle mapping between relational records and application data structures. This approach centralizes data access logic and reduces duplication.

RESTful API design principles were applied throughout the system. Resources such as products, employees, contracts, payments, projects, and tasks are exposed through clearly defined endpoints using standard HTTP methods. During development, Postman was used to test API endpoints and validate request and response behavior.

Configuration values, including database credentials and server ports, are managed through environment variables. This practice separates configuration from source code and supports safer local testing.

Role-based access control governs system usage. User roles—including customer, worker, admin, and co-admin—determine permitted actions and visible interface elements. Enforcement occurs at both the backend route level and the frontend interface to ensure consistent access restrictions.

The project emphasizes modular code organization, incremental development, and basic input validation. Third-party libraries were selected based on stability and community support, such as bcrypt for password hashing and multer for file uploads. Overall, the focus remains on clarity, maintainability, and explicit system behavior rather than experimental optimizations.

## 2.3 Earlier Coursework and Knowledge Foundations

The design and implementation of MARS were informed by knowledge gained in earlier coursework throughout the software engineering program.

Concepts from software engineering courses—such as requirements analysis, system architecture, modular design, and documentation—guided the overall project structure and development process. Iterative implementation and clear separation of responsibilities reflect these principles.

Database-related coursework contributed to the design of normalized relational schemas and the use of structured SQL queries. Understanding of transactions, data integrity, and basic security considerations influenced how persistent data is managed within the system.

Web programming courses provided a foundation in HTTP communication, client–server interaction, and component-based frontend development. These skills supported the implementation of responsive user interfaces and API-driven workflows.

Introductory security topics informed decisions regarding authentication, password storage, and role-based authorization. These concepts shaped the selection of hashing techniques and access control mechanisms used in the project.

Basic exposure to artificial intelligence and machine learning concepts enabled the prototyping of OCR and recommendation features. An understanding of supervised learning, training data dependency, and evaluation limitations helped establish realistic expectations for these components.

Together, these academic foundations provided the technical and conceptual basis required to balance system ambition with practical constraints. They also supported a disciplined approach to design, implementation, and documentation throughout the project.