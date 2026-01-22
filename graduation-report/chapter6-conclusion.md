
# Chapter 6: Conclusions and Future Work

This project presented MARS, an integrated software system that unifies customer-facing e‑commerce with internal management operations for an electronics store. The system combines a React-based web and mobile client, a Node.js/Express backend, and a MySQL relational database to deliver core capabilities: centralized product management, point-of-sale and order processing, contract and payment recording, employee duty-hour tracking, and prototype services for OCR and product recommendations. Implemented with pragmatic engineering choices given project constraints, MARS demonstrates how a single platform can reduce duplication, improve record consistency, and streamline routine retail tasks.

The outcomes of the project include a functioning prototype that validates the principal objectives: consistent resource modeling across catalog and sales domains, role-based access control to separate concerns and limit privileges, and auxiliary automation that reduces manual effort in selected workflows. The architecture emphasizes separation of concerns—client presentation, API orchestration, and database persistence—while identifying clear candidates for further technical hardening.

Realistic future enhancements

- JWT-based authentication: Replace client-stored session artifacts with signed JSON Web Tokens and server-side validation to improve security, support stateless session handling, and enable finer-grained token expiry and refresh policies.
- Cloud deployment and managed services: Migrate deployment to cloud infrastructure (managed databases, object storage for uploads, and container orchestration) to achieve higher availability, easier backups, and horizontal scalability.
- Async/await refactor of data access: Refactor callback-style MySQL models to Promise-based APIs using async/await or a modern ORM to simplify asynchronous control flow, improve error propagation, and make the codebase easier to maintain and test.
- Improved OCR accuracy: Invest in larger, domain-specific training datasets, integrate more advanced OCR engines or model ensembles, and introduce human-in-the-loop verification for low-confidence results to raise practical accuracy for receipt processing.
- Recommendation model improvements: Transition from heuristic or frequency-based suggestions to data-driven models (such as collaborative filtering or lightweight neural approaches), and introduce A/B evaluation and feedback loops to measure and improve recommendation relevance.
- Native mobile application: Develop a native mobile client (iOS/Android) to improve performance, offline capabilities, and hardware integration (camera, local storage), which would enhance POS workflows and in-store scanning experiences.

Taken together, these enhancements form a pragmatic roadmap from a demonstrator to a production-capable system. They align with the technical debt and limitations acknowledged earlier—security posture, asynchronous control flow, deployment resilience, and AI component maturity—and provide concrete next steps for maturation while preserving the fundamental design goals achieved by MARS.

