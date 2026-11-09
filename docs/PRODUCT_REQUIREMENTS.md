# Product Requirements Document — Nailbook

**Version:** 1.0  
**Status:** Reviewing  
**Last Updated:** 2026

---

## Executive Summary

Nailbook is a mobile-first appointment booking and payment platform for a nail salon operating in Kenya. Customers book appointments on the salon website, pay deposits via M-Pesa, and receive confirmations and reminders through WhatsApp — no app download required. The salon owner manages operations through a progressive web application.

The platform addresses the salon's core operational pain: manual appointment tracking via phone calls and WhatsApp messages, high rate of clients not seeing remainder emails and slow checkout process

---

## Product Vision

> Enable the nail salon customer to book, and manage their appointment in under 3 minutes — entirely through the website — while giving the salon owner complete operational visibility from their phone or any other device.

---

## Problem Statement

The salon currently operates with:

- Appointments tracked in personal WhatsApp messages
- No automated reminders → high no-show rate, sent manually via email
- Payments collected in-person or manually confirmed via M-Pesa confirmation
- No visibility into revenue trends or repeat customer behavior

The result is revenue loss from no-shows and an inability to grow the business without increasing administrative overhead.

---

## Business Goals

| # | Goal | Metric | Target |
|---|---|---|---|
| G1 | Reduce no-shows | No-show rate | < 15% (from ~30%) |
| G2 | Increase booking completion | Booking funnel completion rate | ≥ 85% |
| G3 | Accelerate payment collection | M-Pesa payment rate at booking | ≥ 90% |
| G4 | Eliminate manual scheduling | % bookings via platform | 100% within 60 days |
| G5 | Improve customer retention | Repeat booking rate | ≥ 60% within 90 days |

---

## Stakeholders
The users of this system are as follows:

| Stakeholder | Role | Primary Interface |
|---|---|---|
| Owner | Business operator, approves bookings, views reports | PWA |
| Nail technician | Views daily schedule, manages customer requests | PWA |
| Customer/client | Books, pays, receives reminders | Website |
| System Administrator | Manages infrastructure, maintenance and integrations | Backend |

---

## User Personas

### Persona 1: Grace — Salon Owner/Receptionist

**Demographics:** 34 years old, Nairobi, runs a 3-chair nail salon in Westlands.

**Goals:**
- Visibility into the entire schedule including each technicians schedule
- Ensure every booking is approved before the customer arrives
- Reduce time spent on phone calls confirming bookings
- Track which services and nail technician are most popular and most profitable
- Book, change, or cancel appointments over the phone, online, or in person.
- Manage walk-in traffic, assigning clients to next available technician on duty.
- Monitor low stock and count supplies,
- Sync technician break times and chair rotations to prevent double-booking or long delays.
- Collect cash, cards, or mobile money for services and retail items, and end of day reconciliation


**Pain Points:**
- Customers book then don't show up — wasted slots, lost revenue
- Constantly checking personal WhatsApp for booking messages
- Can't tell which month was most profitable without digging through M-Pesa history
- nail technicians ask her "who's coming today?" multiple times a day

**Behaviours:**
- Uses iPhone 17 Pro
- Checks M-Pesa Safaricom app multiple times a day

**Success Criteria:** She can open the PWA each morning and see exactly who is coming, nail technician schedules, what services they booked, and what revenue is confirmed for the day — without speaking to anyone.

---

### Persona 2: Aisha — Nail technician

**Demographics:** 22 years old, junior nail technician, 1 year at the salon.

**Goals:**
- Know scheduled appointments for the day without asking the owner
- Maximize client retention, convert walk-ins and first time visitors to regulars
- Boost daily  bookings
- Ensure accurate payout tracking for commission and tips
- Take notes on a specific client's preferences after as session for future reference eg nail styles


**Pain Points:**
- Often doesn't know the day's schedule until she arrives
- Has no way to check if a customer has paid
- Gets confused when two customers claim the same slot

**Behaviours:**
- Uses Android phone personally, can access PWA

**Success Criteria:** She can open the app, see her schedule, confirm payment status.

---

### Persona 3: Wanjiku — Customer

**Demographics:** 28 years old, marketing executive, Kilimani. Books a nail appointment every 2–3 weeks.

**Goals:**
- Book an appointment quickly at anytime without a phone call
- Choose her preferred slot time or nail technician
- Know her slot is confirmed and nobody else will be given it
- Pay conveniently via M-Pesa without visiting the salon first
- Get a reminder so she doesn't forget


**Pain Points:**
- Hates calling to book — she's often in meetings
- Uncertain whether a WhatsApp message to the salon was actually "received and booked"
- Has shown up before to find her slot was given to someone else

**Behaviours:**
- Pays for almost everything via M-Pesa
- Does not want to download another app

**Success Criteria:** She initiates a booking on online, selects her service and slot time or preferred technician, pay a deposits via M-Pesa STK Push, and receives a confirmation message — all within 3 minutes.

---

## User Stories

### Booking — Customer---

**US-001: Book an appointment via website**

> As a customer, I want to book a nail appointment on the salon website, so that I can choose a service and time without calling or messaging the salon.

**Acceptance Criteria:**
- Customer opens a shareable booking page on a phone or computer without installing an app
- Website shows active services, prices, durations, and available add-ons
- Customer selects one or more services and any add-ons
- Customer can choose a preferred technician or the next available technician
- Website presents available dates and time slots based on service duration, business hours, and technician availability
- Customer selects a date and time
- Customer enters their name and mobile number and consents to appointment notifications
- Website presents a complete summary (services, add-ons, technician preference, date, time, duration, total price, and required deposit)
- Customer confirms the booking
- System creates a PENDING booking
- Customer sees a booking reference and pending status on the website
- Customer receives a WhatsApp confirmation with booking reference and appointment details
- Booking appears in the PWA under "Pending Approvals"

---

**US-002: Pay via M-Pesa at booking**

> As a customer, I want to pay the required deposit via M-Pesa immediately after submitting my website booking, so that my appointment request is secured.

**Acceptance Criteria:**
- After booking submission, website asks the customer to confirm the M-Pesa phone number for the STK Push (pre-filled from their contact number when possible)
- System initiates an STK Push for the configured deposit amount
- Customer receives and approves the M-Pesa prompt on their phone
- System receives Daraja callback confirming payment
- Payment status updates to PAID and booking status reflects the configured approval policy
- Website displays the payment result and appointment status
- Customer receives a WhatsApp message confirming payment and appointment status
- Payment recorded against the booking with M-Pesa transaction ID

---

**US-003: Reschedule from the website**

> As a customer, I want to reschedule my appointment from the website, so that I can change my time without calling.

**Acceptance Criteria:**
- Customer opens the secure manage-booking link in their confirmation or reminder
- Customer verifies access using the booking reference and phone number (or an equivalent secure one-time link)
- Website presents eligible alternative dates and times
- Customer selects a new date and time
- Website shows the updated appointment summary and asks for confirmation
- Booking updated to RESCHEDULED with new date/time
- Original slot made available again
- Customer sees the updated details and receives a WhatsApp notification; staff are notified

---

**US-004: Cancel from the website**

> As a customer, I want to cancel my appointment from the website, so that I do not have to call.

**Acceptance Criteria:**
- Customer opens the secure manage-booking link in their confirmation or reminder
- Customer verifies access to the booking
- Website explains any applicable cancellation or deposit policy and asks for confirmation
- Customer confirms
- Booking status updated to CANCELLED
- Slot made available again
- Customer sees cancellation confirmation and receives a WhatsApp notification
- Staff are notified

---

**US-005: Look up upcoming appointment**

> As a customer, I want to view my upcoming appointment from a secure website link, so that I can check its details without contacting the salon.

**Acceptance Criteria:**
- Customer opens their manage-booking link or enters their booking reference and phone number on the website
- Website displays the appointment details and current status (services, date, time, technician if assigned, and payment status)
- If no active booking is found, website offers a link to start a new booking
- WhatsApp remains available for help if the customer cannot access their booking

---

### Booking — Salon Owner

---

**US-006: Approve a pending booking**

> As a salon owner, I want to approve a pending booking from the PWA app, so that my schedule remains under my control.

**Acceptance Criteria:**
- Pending bookings shown with a badge count on the app icon and dashboard
- Tapping a booking shows full details (customer, service, time, payment status)
- "Approve" button visible; one tap approves
- Booking status changes to APPROVED
- Customer notified via WhatsApp ("Your appointment has been confirmed")
- Booking moves from Pending to Upcoming in the app

---

**US-007: Reschedule a booking from the app**

> As a salon owner, I want to reschedule a booking from the PWA app, so that I can manage slot conflicts.

**Acceptance Criteria:**
- Owner opens a booking, taps "Reschedule"
- Date/time picker shown with only available slots
- Owner selects new slot and confirms
- Booking updated
- Customer notified of the change via WhatsApp

---

**US-008: View today's schedule**

> As a salon owner, I want to see all of today's appointments in one view, so that I can plan the day.

**Acceptance Criteria:**
- Dashboard shows today's bookings in chronological order
- Each booking shows: customer name, service, time, payment status badge
- Tapping a booking opens the detail view
- List updates in real-time (or on pull-to-refresh)

---

**US-009: View revenue summary**

> As a salon owner, I want to see a revenue summary in the app, so that I can track financial performance.

**Acceptance Criteria:**
- Dashboard shows: today's confirmed revenue, this week's revenue, this month's revenue
- Payments tab shows itemised transaction list with date, customer, service, amount
- Can filter by date range

---

### Notifications

---

**US-010: Receive appointment reminders**

> As a customer, I want to receive reminders before my appointment, so that I do not forget.

**Acceptance Criteria:**
- Reminder sent via WhatsApp 24 hours before the appointment
- Second reminder sent via WhatsApp 1 hour before
- Reminder includes: service, date, time, salon location
- Customer can reply to reminder to cancel or reschedule

---

## Functional Requirements

### FR-BK: Booking Management

| ID | Requirement |
|---|---|
| FR-BK-01 | System must create a booking with status PENDING when a customer completes the Website booking flow |
| FR-BK-02 | System must prevent double-booking of the same slot |
| FR-BK-03 | Owner must be able to approve, reject, reschedule, or cancel any booking from the PWA app |
| FR-BK-04 | System must release a slot back to availability when a booking is cancelled or rejected |
| FR-BK-05 | Bookings must have a unique human-readable reference (e.g., WN-2026-00123) |
| FR-BK-06 | System must support configurable slot duration per service |
| FR-BK-07 | System must respect business hours in slot generation |
| FR-BK-09 | All booking state changes must be recorded in a status history table |
| FR-BK-10 | Bookings must be soft-deleted, not hard-deleted |
| FR-BK-11 | System must support walk in allocation |
| FR-BK-12 | System must provide a real time digital calender|
| FR-BK-13 | System must allow booking based on nail technician availability, service duration and preferred appointment time|
### FR-PM: Payment Management

| ID | Requirement |
|---|---|
| FR-PM-01 | System must initiate an M-Pesa STK Push after booking confirmation |
| FR-PM-02 | System must expose a Daraja callback endpoint for payment status |
| FR-PM-03 | System must verify payment amounts match booking amounts |
| FR-PM-04 | System must handle duplicate callbacks idempotently |
| FR-PM-05 | System must store M-Pesa transaction ID (MpesaReceiptNumber) against each payment |
| FR-PM-06 | System must support manual payment marking by owner (for in-person cash) |
| FR-PM-07 | Payment history must be searchable by date, customer, and status |
| FR-PM-08 | System must retry STK Push if the first attempt fails (up to 2 retries) |
| FR-PM-09 | System must support split payments(cash + Mobile money) |

### FR-WA: WhatsApp Automation

| ID | Requirement |
|---|---|
| FR-WA-01 | System must support customer questions and help requests through WhatsApp Cloud API; appointment booking is completed on the website |
| FR-WA-02 | WhatsApp support workflow must be implemented as a finite state machine with human escalation as a fallback |
| FR-WA-03 | Session state must be stored in Redis with a 30-minute TTL |
| FR-WA-04 | System must handle invalid/unrecognized inputs gracefully |
| FR-WA-05 | System must timeout stalled sessions after 30 minutes and send a friendly message |
| FR-WA-06 | System must support human escalation (transfer to owner's WhatsApp) |
| FR-WA-07 | System must verify incoming webhook messages with the Meta webhook signature |
| FR-WA-08 | Outbound messages must be rate-limited to comply with WhatsApp API limits |
| FR-WA-09 | System must support WhatsApp message templates for reminders and notifications |
| FR-WA-010 | System must store a record of each conversation for future improvements eg Rule based chatbot -> Ai chatbot -> Ai agent |
### FR-NT: Notifications

| ID | Requirement |
|---|---|
| FR-NT-01 | System must send a booking confirmation WhatsApp message immediately after PENDING creation |
| FR-NT-02 | System must send a confirmation WhatsApp message when a booking is APPROVED |
| FR-NT-03 | System must send a 24-hour reminder via WhatsApp before each APPROVED booking |
| FR-NT-05 | System must send a cancellation notice via WhatsApp when a booking is cancelled |
| FR-NT-06 | System must send a rescheduling notice via WhatsApp when an appointment is moved |
| FR-NT-07 | System must push a notification to the PWA app when a new booking is created |
| FR-NT-08 | All notification jobs must be queued via BullMQ and retried on failure |
---

### FR-IM: Inventory management
|ID| Requirement |
| FR-IM-01| System must maintain a Stock count, retail tracking and reoder alerts|
---
### FR-NT: Nail technicians scheduling
|ID| Requirement|
|FR-NT-01| System must enable managing technicians skills, availability(working hours) and days off|
---
## Non-Functional Requirements
### Compliance
- Kenya Data Protection Act (KDPA) 2019 compliance required
- WhatsApp Business Policy compliance required
- Customer consent to non-essential WhatsApp messaging must be captured during website booking; transactional messages must follow applicable WhatsApp rules
- Data retention: booking data 7 years (Kenya financial regulations), conversation logs 90 days

---
## Out of scope
- Accepting card payments during checkout
- Thie system is built for nail salon whose business model is  (Salaried salon)owner led not (Booth rental)technician led 

## Key Entities
- **Customer**: A salon client identified by their mobile phone number; has a name, notification preferences, and a history of bookings.
- **Booking (Appointment)**: A scheduled service for a customer at a specific date/time; has a status (e.g., confirmed, rescheduled, canceled, completed), the service or services booked, and a payment status.
- **Service**: A bookable offering (e.g., manicure, pedicure, gel polish) with a name, price, and duration.
- **Nail technician**: A salon employee who performs services and has their own availability; the system assigns the next available technician unless the customer requests a preferred technician.
- **Availability/Business Hours**: The salon's operating hours and any blocked-out date/time ranges, used to determine which slots are offered.
- **Payment**: The price charged, amount and method collected, and payment status associated with a booking.
- **Notification**: A scheduled outbound message tied to a specific booking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A customer can complete a new booking entirely on the website, from opening the booking page to receiving confirmation, in under 3 minutes.
- **SC-002**: At least 95% of confirmed bookings result in a reminder message being delivered before the appointment time.
- **SC-003**: Zero confirmed bookings result in a double-booked (overlapping) time slot for the same staff/resource.
- **SC-004**: At least 90% of eligible reschedule and cancellation requests are completed by the customer through the website without needing a phone call or in-person visit to the salon.
- **SC-005**: The salon's no-show rate decreases by at least 25% within three months of the reminder feature going live, compared to the three months prior.
- **SC-006**: Staff can review a full day's bookings and payment statuses in under 1 minute without manual cross-referencing.

---


