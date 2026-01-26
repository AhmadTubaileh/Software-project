## Chapter 7: Conclusions and Future Work (Refined Version)

This project presented MARS, an integrated software system that unifies customer-facing e-commerce functionality with internal management operations for an electronics store. The system combines React-based web and mobile clients, a Node.js and Express backend, and a MySQL relational database to deliver core capabilities. These include centralized product management, point-of-sale and order processing, contract and payment recording, employee duty-hour tracking, and prototype services for OCR-based receipt processing and product recommendations. Implemented using pragmatic engineering choices aligned with academic constraints, MARS demonstrates how a unified platform can reduce data duplication, improve record consistency, and streamline routine retail operations.

The project resulted in a functional prototype that satisfies its primary objectives. It validates consistent resource modeling across catalog and sales domains, applies role-based access control to separate responsibilities and restrict privileges, and integrates auxiliary automation to reduce manual effort in selected workflows. The system architecture emphasizes separation of concerns by clearly dividing client presentation, API orchestration, and database persistence, while also identifying areas that would benefit from further technical refinement.

Future Work
Several realistic enhancements can be pursued to evolve MARS from an academic prototype toward a production-ready system:

- JWT-based authentication:
Replace client-stored session data with signed JSON Web Tokens and server-side validation to improve security, enable stateless authentication, and support controlled token expiration and refresh policies.

- Cloud deployment and managed services:
Migrate the system to cloud infrastructure using managed databases, object storage for file uploads, and container-based deployment. This would improve availability, simplify backups, and enable horizontal scalability.

- Async/await refactoring of data access:
Refactor callback-based MySQL models to use Promise-based APIs with async/await or adopt a lightweight ORM. This would simplify asynchronous control flow, improve error handling, and enhance maintainability and testability.

- Improved OCR accuracy:
Expand and refine training datasets, integrate more advanced OCR engines or hybrid models, and introduce human-in-the-loop verification for low-confidence outputs to improve reliability in receipt processing.

- Recommendation model enhancements:
Transition from heuristic-based recommendations to data-driven approaches such as collaborative filtering or lightweight machine learning models. Introducing feedback mechanisms and A/B evaluation would allow continuous measurement and improvement of recommendation relevance.

- Native mobile application:
Develop a native mobile application for iOS and Android to improve performance, enable offline functionality, and provide deeper integration with device hardware such as cameras and local storage, enhancing in-store and POS workflows.

Taken together, these enhancements form a clear and practical roadmap for future development. They address the technical limitations identified throughout the project—particularly in security, asynchronous control flow, deployment scalability, and AI component maturity—while preserving the core design principles established by MARS. As such, the project serves both as a completed academic contribution and a solid foundation for further professional development.