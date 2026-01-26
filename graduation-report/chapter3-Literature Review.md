
# Chapter 3: Literature Review

## 3.1 E‑commerce and Integrated Retail Systems

Contemporary retail software spans a spectrum from closed, monolithic point-of-sale suites provided by commercial vendors to modular, API-driven platforms assembled from interoperable components. Empirical studies and practitioner reports consistently highlight the operational benefits of consolidating product, transaction and inventory data into a single canonical model: reduced reconciliation effort, more accurate reporting, and simpler promotion and pricing strategies across channels. For small and medium-sized retailers, research suggests that the most successful deployments are those that prioritize usability for in-store personnel while maintaining a consistent catalog model for online sales channels.

Key design patterns in this domain include a resource-oriented API (REST) layered above canonical domain models, a synchronization layer or event log for cross-client consistency, and a thin client architecture that delegates business rules to the server. The MARS project follows these patterns by centralizing product and transactional data in a relational store and exposing resource-based endpoints for clients. The academic literature also cautions about migration and versioning challenges when evolving a shared data model; establishing clear contracts and backward-compatible APIs is recommended when multiple clients are in active use.


## 3.2 Point-of-Sale and Inventory Integration

Point-of-sale (POS) systems occupy a critical junction between customer interaction and back-office inventory control. Scholarly and technical discussions classify inventory integration strategies broadly into event-driven models—where sales and stock movements are captured as immutable events—and transactional models that atomically reserve and update stock counts within database transactions. Event-driven approaches facilitate eventual consistency and support analytic event streams, while transactional approaches simplify correctness guarantees for stock levels during concurrent operations.

For retail contexts with modest concurrency and limited infrastructure complexity, the literature often recommends a pragmatic transactional model with conservative validation: check availability, decrement stock, and record the sale within a single controlled operation. This approach simplifies reasoning about correctness and aligns with audit and reporting requirements. MARS adopts conservative safeguards: it enforces availability checks before finalizing sales, records actor attribution for auditability, and uses server-side logic to preserve inventory integrity. The literature further emphasizes reconciliation mechanisms—periodic audits, alerts on negative stock, and administrative correction workflows—as essential complements to automated updates.


## 3.3 OCR in Retail Workflows

Optical character recognition (OCR) is an established tool for automating the transcription of printed and scanned text from receipts, invoices and other transactional documents. The academic literature and industrial case studies demonstrate that OCR accuracy is a function of multiple variables: image resolution and noise, variability in document layouts, language and font diversity, and the presence of graphical elements. Consequently, domain adaptation—training or fine-tuning OCR models on representative datasets—substantially improves extraction quality.

In practice, many retail deployments implement hybrid pipelines that combine automated OCR extraction with human verification for low-confidence outputs. Such pipelines increase throughput while mitigating the cost of manual entry errors. Best practices include surface-level confidence scoring, structured output (line-item parsing), and UIs that present OCR results alongside original images for rapid validation. MARS implements a prototype OCR workflow that emphasizes explainability and verification: extracted text is linked to payment or order records and low-confidence items are flagged for review. The literature also recommends logging extraction errors and tracking correction actions to guide iterative improvements in models and preprocessing steps.


## 3.4 Recommendation Systems for Retail

Recommendation systems in retail range from low-cost heuristics—such as popularity ranking and frequently-bought-together lists—to sophisticated machine-learning models including collaborative filtering, factorization machines and neural recommenders. Empirical research shows that when historical interaction data is sparse, simple item-based similarity or association-rule techniques often outperform complex models that overfit limited data. As datasets grow, however, data-driven models yield stronger personalization and higher long-term engagement when coupled with proper evaluation strategies.

The literature stresses iterative development: deploy simple baselines first, instrument outcomes with offline and online metrics, and progressively introduce more advanced models. Explainability and user control are recurring themes; interpretable recommendations improve trust and staff adoption in retail contexts. For MARS, starting with heuristic-based recommendations is appropriate given the prototype’s dataset scale; the project’s future roadmap aligns with literature guidance to introduce collaborative or hybrid recommenders once sufficient interaction data and evaluation pipelines are in place.


## 3.5 Role-based Access and Security Practices

Access control is a foundational security concern in multi-user systems. The literature promotes several enduring principles: enforce authorization at the service boundary rather than relying solely on client-side checks, adopt least-privilege role assignments, and implement comprehensive logging and auditing to detect misuse. Token-based authentication (with signed tokens or session mechanisms) and transport-layer protection (HTTPS/TLS) are standard recommendations to protect credentials and session integrity.

For prototype systems, developers often balance usability and security by combining client-side role gating (for user experience) with server-side enforcement (for correctness). MARS follows this approach: the client adapts its interface to the current user’s role for convenience, while the server enforces role checks on all sensitive routes. The literature further advises that role design should be minimal and well-documented, and that privilege escalation vectors be periodically reviewed—practices that reduce the attack surface and ease later audits or compliance efforts.


## 3.6 Architecture and Tooling Choices in Similar Projects

Projects developed in academic settings and small teams typically prioritize toolchains that maximize developer productivity and reduce integration friction. The combination of a JavaScript runtime for the server (Node.js/Express), a relational database for transactional consistency (MySQL), and a component-based frontend (React with Vite) is a common pragmatic choice. This stack allows developers to maintain a unified language ecosystem and iterate rapidly on full‑stack features.

The literature documents a common lifecycle: initial development favors simple patterns (including callback-based database access and direct SQL queries) to achieve functionality quickly; as the system evolves, teams migrate to more robust abstractions—Promise-based APIs, ORMs, or service layers—to manage complexity. The MARS tool choices align with this progression: they provide a low barrier to building a coherent prototype while preserving clear migration paths for later refactoring and performance enhancements.


## 3.7 Summary and Relevance to MARS

The literature reviewed in this chapter corroborates the principal architectural and design choices made in MARS. Centralizing catalog and transactional data, enforcing server-side authorization, adopting hybrid OCR workflows with verification, and commencing recommendation capabilities with heuristic baselines are all grounded in established practice for small and medium‑scale retail systems. Moreover, the surveyed work underscores the importance of iterative improvement: augmenting OCR datasets and model tuning, establishing rigorous evaluation for recommenders, and refactoring asynchronous control flow for maintainability.

These insights validate MARS as a research-grade prototype: its design choices balance rapid delivery and operational correctness while exposing specific directions for maturation. The chapter’s findings inform the implementation and future work described in subsequent chapters, providing a literature-backed rationale for prioritizing security improvements, model training, and architectural refactors as the system transitions toward production readiness.

