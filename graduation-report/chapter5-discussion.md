
# Chapter 5: Discussion

## 5.1 Achievements

The MARS project met its principal objectives by delivering an integrated platform that consolidates customer facing commerce with internal management functions. The system centralizes product data, supports creation and tracking of orders, records payments and contracts, and provides mechanisms for employee duty hour tracking and basic project and task coordination. Role based access control is implemented to ensure that customers, store workers, and administrators interact with appropriate interfaces and operations. Additionally, prototype services for OCR based receipt processing and product recommendation were developed to demonstrate feasibility and to reduce manual data entry in practical workflows.

## 5.2 System Strengths

Several strengths stand out from the implementation. First, the system design enforces a single source of truth for product and transactional data, reducing duplication and simplifying reconciliation. Second, the modular separation of routes, controllers and models improves maintainability and makes the codebase approachable for incremental enhancement. Third, the dual client approach (web and mobile) ensures that the staff has convenient interfaces tailored to their needs. Finally, integrating auxiliary services such as OCR and lightweight recommendations illustrates how automation can reduce administrative effort and support staff decision making at the point of sale.

## 5.3 Technical Challenges

The project confronted a number of technical challenges typical of full‑stack systems developed within constrained timelines. Integrating multiple functional areas (catalog management, POS, contracts, payments, employees, and task management) required careful API design and consistent data modeling to avoid inconsistencies. Handling file uploads and orchestrating OCR processing introduced complexity in data flow and error handling, particularly when extracted text required manual verification.

Concurrency and transactional correctness in inventory and payments presented further challenges. Ensuring that inventory decrements and payment records remain consistent across concurrent operations is a non trivial task, and in a local deployment context the project implemented conservative safeguards and validations rather than transactional middleware or distributed locking.

Finally, prototyping the OCR and recommendation services exposed limitations stemming from dataset availability and model maturity. These components required balancing the effort spent on model tuning against delivering a functional system within the project timeline.

## 5.4 Design Trade offs

Several deliberate trade offs were made to balance scope, simplicity, and demonstrable functionality:

- Callback based database access: The backend uses callback style interactions with MySQL. This approach enabled quick progress using familiar patterns and straightforward SQL mapping. However, callback nesting can complicate control flow and error handling. The codebase documents this as a practical implementation choice and a clear candidate for refactoring to Promises or async/await to improve readability and maintainability.

- Client side session storage: The frontend stores session information locally (for example using 'localStorage') to maintain user state between page loads. This choice simplifies the client implementation and supports rapid development and testing. It also places responsibility on runtime environments to secure access (for example, by serving the application over HTTP) and limits some security guarantees compared with server managed, short lived tokens or HTTP only cookies. As such, 'localStorage' based session management is appropriate for demonstration and local deployment, with more robust alternatives recommended for production.

- Local deployment focus: Prioritizing a local or small server deployment model reduced infrastructure complexity during development and enabled the team to validate functionality end to end. The trade off is limited built in scalability and operational resilience; cloud native features such as automatic scaling, managed storage, and centralized secrets management were intentionally deferred as future work.

These trade offs reflect the project’s academic objectives delivering a coherent, maintainable prototype within limited time and resources while also making explicit the pathways for industrial hardening and modernization.

## 5.5 Conclusion of Discussion

In closing, MARS demonstrates how a focused integration of e‑commerce and internal management functions can reduce operational friction in a retail setting. The system validates architectural choices and highlights practical challenges that would need attention in a production migration: asynchronous control flow refactoring, hardened session management, scalable deployment, and expanded datasets for AI components. These conclusions situate MARS as a substantive graduation project that balances ambition with pragmatic engineering decisions and provides a clear roadmap for future enhancement.

