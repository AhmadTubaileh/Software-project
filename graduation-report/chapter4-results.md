
# Chapter 4: System Implementation and Results

## 4.1 Product Management

Purpose

The Product Management feature provides the canonical representation and lifecycle for merchandise in the MARS system. It centralizes product information descriptive attributes, pricing, inventory status and associated media so that both customer facing catalog functions and internal operations (such as POS and inventory reconciliation) reference a single source of truth.

CRUD Operations

Product management supports the full set of CRUD operations: creation of new product records, retrieval and listing for display, updating of product metadata and availability, and removal or deactivation of obsolete items. These operations enable catalogue maintenance, pricing adjustments, and stock corrections required for day‑to‑day retail management.

Backend Routes and Models

On the server side, product related endpoints are organized as resource oriented routes that accept requests to create, read, update and delete product entities. A corresponding model module encapsulates database queries and the mapping between relational records and domain objects. The model enforces basic validation and translation of request payloads into SQL operations, and it returns structured results suitable for the API layer to serialize into responses.

Frontend Interaction

The frontend interacts with product services through RESTful API calls. Administrative interfaces provide forms for entering or editing product details and media, while customer views request paginated lists and single item details for display. The client handles user input validation, visual feedback, and state updates; it also coordinates image uploads via the file upload middleware for product images and displays current inventory and pricing information in the UI.

Role based Access

Access to product management operations is governed by role checks. Administrative and worker roles are permitted to add or modify products, while customer roles have read only access to catalog data. These restrictions are enforced on the server to prevent unauthorized changes and mirrored on the client to tailor the user interface according to the logged in user’s role.

## 4.2 POS and Sales Processing

Purpose and Scope

The Point of Sale (POS) module supports in person sales workflows and integrates closely with product management and payment handling. It allows store workers to create orders, manage line items, apply discounts or taxes, and record payments, thereby consolidating the store’s financial and inventory records.

Order Creation and Lifecycle

An order represents a transaction containing one or more product line items, quantities, pricing details and metadata such as the responsible worker and timestamp. Order creation occurs at the POS interface (or via customer checkout); once initiated, the order is recorded in the database, inventory levels are adjusted to reflect sold quantities, and the order is marked with a status indicating whether payment is pending, completed, or refunded.

Payment Handling

Payment processing within MARS records payment attempts and outcomes against order records. The system supports recording different payment methods and associating payment records with the corresponding order and customer. Payments update the financial status of orders and can trigger changes in order state (for example, from pending to paid). For demonstration and local deployment, payment handling focuses on reliable recording of transactions rather than integration with external payment gateways; such integrations are identified as future enhancements.

Inventory Integration

Inventory is updated as part of the order lifecycle. When an order is finalized, product stock quantities are decremented in the database to maintain an accurate view of availability. The system includes safeguards to prevent orders that would reduce stock below acceptable levels, and administrative interfaces allow manual stock corrections when reconciliation is required.

Role based Controls and Audit

POS operations are restricted to authorized worker roles. Each transaction records the actor and time to support audit trails and accountability. Administrative roles have additional privileges for correcting or voiding transactions and for viewing consolidated sales reports.

## 4.3 OCR based Receipt Processing and Recommendation Services

Service Roles

The OCR and recommendation components are implemented as auxiliary services that extend the system’s core transactional capabilities. The OCR service extracts textual information from uploaded receipt images or scanned documents, enabling semi automated data entry for payments and order reconciliation. The recommendation service analyses product and transaction data to suggest items of potential interest to customers or to assist staff with upselling during POS interactions.

Data Flow

OCR flow: Uploaded images are received by the server and routed to the OCR service, which applies optical character recognition using available trained datasets. Extracted textual data such as merchant name, item lines, totals and dates is validated and associated with payment or order records. Where confidence is low, the extracted text is presented for human review within the administrative interface.

Recommendation flow: The recommendation service consumes historical transaction and product metadata to produce candidate product suggestions. Input features may include purchase co occurrence, item categories, and simple heuristics derived from sales frequency. Recommendations are surfaced in customer facing interfaces and at POS for staff assistance.

Limitations

Both services are provided as prototypes and are constrained by the quality and quantity of available data. The OCR accuracy is highly dependent on image quality and the suitability of trained datasets; errors in extraction require manual verification. The recommendation service is based on lightweight heuristics and limited historical data, so its suggestions are indicative rather than authoritative. The project does not claim production grade performance for these services; they illustrate feasibility and provide a foundation for future refinement.

Practical Use Cases

- Automating data entry for payments: Staff can upload receipt images to populate payment records, reducing manual typing and reconciliation time.
- Improved customer assistance at POS: The recommendation service can suggest complementary accessories or frequently purchased and viewed items when a customer selects a product, aiding upselling.
- Post sale analytics: Extracted receipt data and aggregated recommendations support simple reporting on sales trends and popular products, informing inventory and promotional decisions.

Evaluation and Future Work

As demonstrable prototypes, the OCR and recommendation services identify clear paths for improvement: expanding and cleaning training datasets, incorporating more robust machine learning models, introducing feedback loops for continuous learning, and integrating external payment gateways for end to end transactional completeness. These extensions are natural next steps to move the system from a research grade prototype toward production readiness.

