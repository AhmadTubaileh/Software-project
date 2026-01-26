# Chapter 5: Discussion 

## 5.1 Achievements

The MARS project successfully achieved its primary objectives by delivering an integrated platform that combines customer-facing e-commerce functionality with internal management tools for an electronics store. The system centralizes product information, supports order creation and tracking, records payments and contracts, and provides mechanisms for employee duty-hour tracking as well as basic project and task coordination.

Role-based access control was implemented to ensure that customers, store workers, and administrative users interact with the system according to their responsibilities. In addition, prototype services for OCR-based receipt processing and product recommendation were developed to demonstrate the feasibility of reducing manual data entry and supporting decision-making during sales workflows. Together, these outcomes confirm that the project meets its intended functional and academic goals.

## 5.2 System Strengths

Several strengths emerge from the final implementation. First, the system enforces a single source of truth for product, order, and payment data, which reduces duplication and simplifies reconciliation across different operational workflows. This consistency improves reliability and reduces the likelihood of conflicting records.

Second, the modular organization of the backend—separating routes, controllers, models, and services—enhances code clarity and maintainability. This structure makes the system easier to understand, test, and extend incrementally. Third, providing both web and mobile clients improves accessibility for staff and allows system usage to adapt to different operational contexts.

Finally, the inclusion of auxiliary services such as OCR processing and lightweight product recommendations demonstrates how automation can be integrated into retail systems to reduce administrative effort and support staff at the point of sale. Even as prototypes, these components add practical value and illustrate potential directions for future enhancement.

## 5.3 Technical Challenges

The project encountered several technical challenges typical of full-stack systems developed under time and resource constraints. Integrating multiple functional domains—including product management, POS, contracts, payments, employee tracking, and task management—required careful API design and consistent data modeling to avoid redundancy and inconsistencies.

Handling file uploads and coordinating OCR processing introduced additional complexity, particularly in managing data flow and error handling when extracted text required human verification. Ensuring smooth interaction between upload mechanisms, storage strategies, and downstream processing services required iterative testing and adjustment.

Maintaining consistency in inventory and payment records also posed challenges. Ensuring that inventory updates and payment state changes remain correct under concurrent operations is a non-trivial problem. Given the local deployment context, the system adopts conservative validation and sequencing strategies rather than advanced transactional middleware or distributed locking mechanisms.

Finally, the development of OCR and recommendation features highlighted limitations related to dataset size and model maturity. Achieving a balance between improving model accuracy and delivering a complete system within the available timeframe was a key challenge during implementation.

## 5.4 Design Trade-offs

Several deliberate design trade-offs were made to balance scope, simplicity, and demonstrable functionality:

- Callback-based database access:
The backend uses callback-style interactions with the MySQL database. This approach enabled rapid development using familiar patterns and straightforward SQL execution. However, callback nesting can complicate control flow and error handling. The project explicitly identifies this choice as a refactoring candidate, with a future migration to Promises or async/await recommended for improved readability and maintainability.

- Client-side session storage:
User session information is stored on the client using local storage to maintain authentication state. This design simplifies client-side implementation and supports rapid development and testing. However, it provides weaker security guarantees than server-managed sessions or HTTP-only cookies and assumes a trusted deployment environment. As such, this approach is appropriate for demonstration and local use, with more robust session management recommended for production systems.

- Local deployment focus:
The system was designed primarily for local or small-server deployment to reduce infrastructure complexity during development. While this enabled full end-to-end validation of system functionality, it limits scalability and operational resilience. Cloud-based deployment strategies, managed storage, and centralized configuration management were intentionally deferred as future work.

These trade-offs reflect the project’s academic objectives: delivering a coherent and maintainable prototype within limited time and resources while clearly documenting areas for future improvement.

## 5.5 Conclusion of Discussion

In summary, the MARS project demonstrates how integrating e-commerce capabilities with internal management functions can reduce operational friction in a retail environment. The system validates its architectural choices while also highlighting challenges that must be addressed for production deployment, including improved asynchronous control flow, stronger session security, scalable infrastructure, and expanded datasets for AI-driven components.

These findings position MARS as a substantial graduation project that balances ambition with practical engineering decisions. The system provides both a functional prototype and a clear roadmap for future enhancement, aligning well with the academic goals of the software engineering program.