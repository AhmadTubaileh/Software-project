# Chapter 4: System Implementation and Results 

## 5.1 Product Management
Purpose

The Product Management component defines the lifecycle and representation of merchandise within the MARS system. It centralizes product information—including descriptive attributes, pricing, inventory status, and associated media—so that both customer-facing catalog views and internal operations such as point-of-sale processing and inventory reconciliation rely on a single, consistent data source.

CRUD Operations

Product management supports standard Create, Read, Update, and Delete (CRUD) operations. New products can be added to the system, existing products can be retrieved and listed for display, product details and availability can be updated, and obsolete items can be removed or deactivated. These operations support routine retail activities such as catalog maintenance, price updates, and inventory corrections.

Backend Routes and Models

On the backend, product-related functionality is exposed through resource-oriented API routes. These routes handle requests for creating, retrieving, updating, and deleting product records. A dedicated model module encapsulates the corresponding SQL queries and manages the mapping between relational database records and application-level objects. The model performs basic validation and translates request data into database operations, returning structured results to the API layer for serialization.

Frontend Interaction

The frontend communicates with the product services using RESTful API calls. Administrative interfaces provide forms for adding and editing product information, including images, while customer-facing views retrieve paginated product lists and individual item details for browsing. The client handles input validation, user feedback, and state management, and it coordinates image uploads through the backend upload middleware. Current pricing and inventory information are displayed dynamically in the user interface.

Role-Based Access

Access to product management functionality is controlled through role-based restrictions. Administrative and worker roles are authorized to create and modify product records, while customers are limited to read-only access to catalog data. These constraints are enforced on the server to prevent unauthorized changes and are reflected in the frontend interface to ensure that users are only presented with permitted actions.

## 5.2 POS and Sales Processing
Purpose and Scope

The Point-of-Sale (POS) module supports in-store sales workflows and integrates directly with product management and payment handling. It enables store workers to create orders, manage product line items, apply pricing adjustments, and record payments, thereby unifying sales and inventory data within a single system.

Order Creation and Lifecycle

An order represents a sales transaction composed of one or more product line items, quantities, pricing details, and metadata such as the responsible worker and timestamp. Orders are created through the POS interface or during customer checkout. Once recorded in the database, inventory quantities are adjusted to reflect sold items, and the order is assigned a status indicating whether payment is pending, completed, or refunded.

Payment Handling

Payment processing in MARS focuses on recording payment events and associating them with the corresponding orders and customers. The system supports multiple payment methods and updates the financial state of orders based on recorded payments. Changes in payment status can trigger transitions in order state, such as marking an order as paid. For local deployment and academic demonstration, payment handling emphasizes accurate record keeping rather than integration with external payment gateways, which are identified as future enhancements.

Inventory Integration

Inventory levels are updated as part of the order workflow. When an order is finalized, product stock quantities are decremented to maintain an accurate representation of availability. Safeguards are implemented to prevent orders that would result in negative stock levels. Administrative interfaces also allow authorized users to perform manual inventory adjustments when reconciliation is required.

Role-Based Controls and Audit

POS operations are restricted to authorized worker roles. Each transaction records the acting user and timestamp to support basic auditing and accountability. Administrative users have additional privileges, including correcting or voiding transactions and viewing aggregated sales information.

## 5.3 OCR-Based Receipt Processing and Recommendation Services
Service Roles

The OCR and recommendation components extend the core transactional functionality of the system. The OCR service extracts textual data from uploaded receipt images or scanned documents, supporting semi-automated entry of payment and order information. The recommendation service analyzes product and transaction data to suggest items of potential interest to customers or to assist staff with upselling during POS interactions.

Data Flow

For OCR processing, uploaded images are received by the backend and passed to the OCR service, which applies optical character recognition using available trained datasets. Extracted information—such as merchant names, item lines, totals, and dates—is validated and linked to relevant payment or order records. When extraction confidence is low, the system allows manual review and correction through administrative interfaces.

The recommendation service consumes historical transaction data and product metadata to generate candidate product suggestions. Input factors include purchase co-occurrence, item categories, and simple heuristics derived from sales frequency. Recommendations are displayed in customer-facing views and within the POS interface to support sales assistance.

Limitations

Both OCR and recommendation features are implemented as prototypes and are constrained by limited datasets. OCR accuracy depends on image quality and the suitability of trained models, and extraction errors may require manual correction. The recommendation service relies on lightweight heuristics and limited historical data, making its outputs indicative rather than definitive. The system does not claim production-level performance for these components.

Practical Use Cases

- Automated payment data entry: Staff can upload receipt images to populate payment records, reducing manual data entry and reconciliation effort.
- Sales assistance at POS: Recommendations can suggest complementary accessories or frequently purchased items when a product is selected, supporting upselling.
- Basic sales analysis: Aggregated OCR data and recommendation outputs support simple insights into popular products and sales trends.

Evaluation and Future Work

As prototype implementations, the OCR and recommendation services highlight several directions for future improvement. These include expanding and refining training datasets, adopting more advanced machine learning models, incorporating feedback mechanisms for continuous learning, and integrating external payment gateways for complete transactional workflows. Such enhancements would support transitioning the system from an academic prototype toward production readiness.