# Architecture — Nailbook

**Version:** 1.1

---

## C4 Level 1: System Context Diagram

```mermaid
C4Context
    title System Context for Nailbook

    Person(customer, "Customer", "Kenyan nail salon customer. Books on the website and pays via M-Pesa.")
    Person(owner, "Salon Owner", "Manages appointments and business using PWA.")
    Person(staff, "Salon Staff", "Views schedule and manages daily bookings using PWA.")

    System(wannys, "Nailbook Platform", "Website booking, salon management, WhatsApp notifications, and M-Pesa payments.")

    System_Ext(whatsapp, "WhatsApp Cloud API", "Meta's messaging API. Receives and sends WhatsApp messages.")
    System_Ext(daraja, "Daraja M-Pesa API", "Safaricom's payment API. Processes STK Push payments.")
    System_Ext(email, "Resend Email", "Email notifications.")

    Rel(customer, wannys, "Books appointments and manages bookings", "Website")
    Rel(customer, whatsapp, "Receives confirmations and reminders; asks for support", "WhatsApp")
    Rel(owner, wannys, "Manages bookings, views reports", "PWA")
    Rel(staff, wannys, "Views schedule, handles requests", "PWA")
    Rel(whatsapp, wannys, "Delivers incoming messages", "HTTPS Webhook")
    Rel(wannys, whatsapp, "Sends messages to customers", "HTTPS REST API")
    Rel(wannys, daraja, "Initiates STK Push payments", "HTTPS REST API")
    Rel(daraja, wannys, "Delivers payment results", "HTTPS Callback")
    Rel(wannys, email, "Sends email notifications", "HTTPS REST API")
```

---

## C4 Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram — Nailbook

    Person(customer, "Customer", "Website booking user; receives WhatsApp notifications")
    Person(owner, "Salon Owner / Staff", "PWA user")

    Container(web, "Website and Staff PWA", "React / Vite / vite-plugin-pwa", "Customer booking and booking management website, plus installable salon management PWA.")
    Container(api, "Backend API", "Node.js / Express / TypeScript", "REST API. Handles business logic, authentication, booking engine, payment workflows.")
    Container(worker, "Background Worker", "BullMQ / Node.js", "Processes async jobs: reminders, STK Push, notifications.")
    ContainerDb(postgres, "PostgreSQL", "Relational Database", "Primary data store: bookings, customers, payments, audit logs.")
    ContainerDb(redis, "Redis", "Cache + Queue", "WhatsApp session state (TTL 30min), BullMQ job queues, auth token cache.")

    System_Ext(whatsapp, "WhatsApp Cloud API")
    System_Ext(daraja, "Daraja M-Pesa API")
    System_Ext(email, "Resend Email")

    Rel(customer, web, "Books and manages appointments", "HTTPS")
    Rel(customer, whatsapp, "Receives confirmations/reminders and gets support")
    Rel(owner, web, "Uses", "Browser / Installed PWA")
    Rel(web, api, "REST API calls", "HTTPS/JSON")
    Rel(web, api, "Real-time updates", "WebSocket / SSE")
    Rel(whatsapp, api, "Webhook POSTs", "HTTPS")
    Rel(api, whatsapp, "Send messages", "HTTPS REST")
    Rel(api, postgres, "Read/write data", "TCP / Prisma")
    Rel(api, redis, "Session read/write, queue jobs", "TCP")
    Rel(worker, redis, "Dequeues jobs", "TCP")
    Rel(worker, postgres, "Read/write data", "TCP / Prisma")
    Rel(worker, daraja, "STK Push", "HTTPS")
    Rel(daraja, api, "Payment callback", "HTTPS")
    Rel(worker, whatsapp, "Send reminder messages", "HTTPS REST")
    Rel(worker, email, "Send email", "HTTPS REST")
```

---

## C4 Level 3: Component Diagram — Backend API

```mermaid
C4Component
    title Component Diagram — Backend API

    Container_Boundary(api, "Backend API") {
        Component(authMod, "Auth Module", "Express Router", "Login, token refresh, logout.")
        Component(bookingMod, "Bookings Module", "Express Router + Service", "Full booking lifecycle.")
        Component(slotEngine, "Slot Engine", "Pure TypeScript", "Computes available slots from business hours, service duration, and existing bookings.")
        Component(paymentMod, "Payments Module", "Express Router + Service", "STK Push initiation and callback handling.")
        Component(customerMod, "Customers Module", "Express Router + Service", "Customer CRUD and history.")
        Component(webhookMod, "Webhook Handler", "Express Router", "Receives and validates WhatsApp and Daraja webhooks.")
        Component(fsmEngine, "WhatsApp FSM Engine", "TypeScript", "Stateless finite state machine. Loads session from Redis, processes input, returns output messages.")
        Component(notifMod, "Notifications Module", "Service", "Queues notification jobs for BullMQ.")
        Component(sseHandler, "SSE Handler", "Express Router", "Server-Sent Events stream. Pushes real-time booking and payment events to connected PWA clients.")
        Component(authMw, "Auth Middleware", "Express Middleware", "Validates JWT tokens.")
        Component(errorHandler, "Error Handler", "Express Middleware", "Maps domain errors to HTTP responses.")
    }

    ContainerDb(postgres, "PostgreSQL")
    ContainerDb(redis, "Redis")
    System_Ext(whatsapp, "WhatsApp Cloud API")
    Container(web, "PWA")

    Rel(authMod, postgres, "Validates credentials, stores tokens")
    Rel(bookingMod, slotEngine, "Calls to check availability")
    Rel(bookingMod, postgres, "Persists bookings")
    Rel(bookingMod, notifMod, "Queues notifications on state change")
    Rel(bookingMod, sseHandler, "Emits booking events")
    Rel(paymentMod, redis, "Queues STK Push jobs")
    Rel(paymentMod, sseHandler, "Emits payment events")
    Rel(webhookMod, fsmEngine, "Delegates message processing")
    Rel(fsmEngine, redis, "Loads/saves conversation session")
    Rel(fsmEngine, bookingMod, "Provides booking help; directs customers to the website")
    Rel(fsmEngine, whatsapp, "Sends outbound messages")
    Rel(notifMod, redis, "Enqueues notification jobs")
    Rel(sseHandler, web, "Streams events", "SSE")
```

---

## Sequence Diagram: Booking Creation (Website)

```mermaid
sequenceDiagram
    actor Customer
    participant Web as Booking Website
    participant API as Nailbook API
    participant DB as PostgreSQL
    participant Queue as BullMQ
    participant Daraja as Daraja M-Pesa
    participant WhatsApp as WhatsApp Cloud API

    Customer->>Web: Select services, add-ons, technician, date, and time
    Web->>API: GET services and available slots
    API->>DB: Read services, availability, and bookings
    API-->>Web: Service catalogue and available slots
    Customer->>Web: Enter contact details and confirm booking
    Web->>API: POST /bookings
    API->>DB: Validate slot and create PENDING booking
    API->>Queue: Enqueue approval and WhatsApp confirmation jobs
    API-->>Web: Booking reference and status
    Web-->>Customer: Show booking confirmation and payment step
    Customer->>Web: Confirm M-Pesa phone number and deposit
    Web->>API: POST /payments/stk-push
    API->>Queue: Enqueue STK Push job

    Queue->>API: Process STK Push job
    API->>+Daraja: POST /stkpush/v3/processrequest
    Daraja-->>-API: CheckoutRequestID
    Note over Customer: M-Pesa prompt appears on phone
    Customer->>Daraja: Enters M-Pesa PIN
    Daraja->>API: POST /payments/mpesa-callback
    API->>DB: Update payment (COMPLETED) + booking (PAYMENT_COMPLETED)
    API->>Queue: Enqueue payment confirmation WhatsApp message
    Queue->>WhatsApp: Send payment confirmation
    WhatsApp->>Customer: Payment and appointment status
```

---

## Sequence Diagram: Booking Approval (PWA)

```mermaid
sequenceDiagram
    actor Owner
    participant PWA as PWA (React)
    participant SSE as SSE Handler
    participant API as Nailbook API
    participant DB as PostgreSQL
    participant Queue as BullMQ
    participant WA as WhatsApp Cloud API
    actor Customer

    PWA->>API: GET /bookings?status=PENDING (on dashboard load)
    API->>DB: Query pending bookings
    DB-->>API: Bookings list
    API-->>PWA: 200 OK, bookings array
    PWA->>SSE: Open SSE stream (GET /events)
    PWA->>Owner: Displays pending bookings with badge

    Note over SSE,PWA: New booking arrives from the website
    SSE->>PWA: event: booking.created {bookingId, customer, service}
    PWA->>Owner: Badge increments, toast notification shown

    Owner->>PWA: Clicks booking → clicks "Approve"
    PWA->>Owner: Shows confirmation dialog
    Owner->>PWA: Confirms approval
    PWA->>API: POST /bookings/:id/approve
    API->>API: Validate JWT, check booking exists and is PENDING
    API->>DB: UPDATE booking SET status=APPROVED
    API->>DB: INSERT booking_status_history
    API->>Queue: Enqueue WhatsApp confirmation job
    API->>Queue: Schedule 24h reminder job (delayed)
    API->>Queue: Schedule 1h reminder job (delayed)
    API->>SSE: Emit booking.approved event
    API-->>PWA: 200 OK, updated booking
    SSE->>PWA: event: booking.approved {bookingId}
    PWA->>Owner: Status badge updates to CONFIRMED, toast shown

    Queue->>WA: POST /messages (booking confirmed template)
    WA->>Customer: "Your appointment has been confirmed ✅"
```

---

## Sequence Diagram: Payment Processing (STK Push)

```mermaid
sequenceDiagram
    autonumber
    participant API as Nailbook API
    participant DB@{"type": "database"} as PostgreSQL
    participant Queue@{"type": "queue" } as BullMQ
    participant Daraja as Daraja M-Pesa

    Queue->>API: Dequeue STK Push job
    API->>Daraja: POST /stkpush/v3/processrequest
    alt Success
        Daraja-->>API: 200 OK, CheckoutRequestID
        API->>DB: INSERT payment_transaction (status=PENDING, checkoutRequestId)
    else Daraja Error
        Daraja-->>API: 4xx/5xx
        API->>Queue: Re-enqueue with backoff (attempt 2)
    end

    Note over Daraja: Customer enters PIN on phone

    Daraja->>API: POST /payments/mpesa-callback
    API->>API: Validate callback authenticity
    API->>DB: Check for existing transaction with MpesaReceiptNumber (idempotency)

    alt Payment Successful (ResultCode=0)
        API->>DB: UPDATE payment_transaction SET status=COMPLETED
        API->>DB: UPDATE booking SET paymentStatus=PAID
        API->>Queue: Enqueue WhatsApp confirmation
    else Payment Failed (ResultCode≠0)
        API->>DB: UPDATE payment_transaction SET status=FAILED, failureReason
        API->>Queue: Enqueue payment status notification
        API-->>Customer: Website offers payment retry
    end
```

---

## Sequence Diagram: WhatsApp Conversation Session Management

```mermaid
sequenceDiagram
    autonumber
    participant WA as WhatsApp Cloud API
    participant API as Nailbook API
    participant FSM as FSM Engine
    participant Redis

    WA->>API: POST /webhooks/whatsapp (message)
    API->>API: Validate X-Hub-Signature-256
    API-->>WA: 200 OK (immediate, async processing)

    API->>Redis: GET session:+254712345678
    alt Session exists
        Redis-->>API: Session JSON {state, context, lastActivity}
        API->>FSM: process(session, incomingMessage)
    else Session expired or new
        Redis-->>API: null
        API->>FSM: process({state:'IDLE'}, incomingMessage)
    end

    FSM->>FSM: Execute transition function for current state
    FSM-->>API: {newState, outboundMessages, updatedContext}

    API->>Redis: SET session:+254712345678 {newState, ...} EX 1800

    loop For each outbound message
        API->>WA: POST /messages
        WA-->>API: 200 OK, message_id
    end

    Note over Redis: After 30 min inactivity, key expires automatically
    Note over API: On expiry: next message starts fresh IDLE session
```

> **Redis key format:** `<APP_NAME>:<process>:<store>:<key>`, e.g. `Nailbook:worker:session:254712345678`. The `<APP_NAME>:<process>:` prefix is added automatically by each process's Redis client; the keys shown in the diagram above are the logical `<store>:<key>` part. BullMQ queues use `<APP_NAME>:bull:<queueName>` instead. See `.agents/backend.md`.
