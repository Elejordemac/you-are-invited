# Implementation Plan: Baby Shower Guest Registration

## Overview

This plan implements a full-stack baby shower guest registration application with a React/TypeScript frontend, Node.js/Express backend, and PostgreSQL database. The implementation proceeds from foundational project setup through backend services, frontend components, admin functionality, email notifications, and theming — with each step building on the previous.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - [x] 1.1 Initialize monorepo with frontend and backend directories
    - Create top-level project structure with `/frontend` (React + TypeScript via Vite) and `/backend` (Node.js + Express + TypeScript) directories
    - Add `package.json` for both with necessary dependencies (express, pg, cors, jsonwebtoken, bcrypt, nodemailer, fast-check for testing)
    - Configure TypeScript (`tsconfig.json`) for both frontend and backend
    - Set up test framework (Vitest for both frontend and backend)
    - _Requirements: 4.2, 4.6_

  - [x] 1.2 Define shared TypeScript interfaces and types
    - Create shared type definitions for `GuestRecord`, `AdminRecord`, `RegisterGuestRequest`, `RegisterGuestResponse`, `ValidationErrorResponse`, `LoginRequest`, `LoginResponse`, `ApproveResponse`
    - Define RSVP status and approval status enums/unions
    - _Requirements: 1.1, 4.1_

  - [x] 1.3 Create PostgreSQL database schema and migration
    - Write SQL migration to create `guests` table with all columns, constraints, and indexes as defined in design
    - Write SQL migration to create `admins` table
    - Add a seed script for creating a default admin user (hashed password)
    - _Requirements: 4.1, 4.7, 6.1_

- [x] 2. Implement backend validation and guest registration
  - [x] 2.1 Implement validation service
    - Create `ValidationService` with functions for name validation (1-100 chars, required), email validation (max 254 chars, exactly one "@" followed by domain with at least one dot, trimming, case normalization), and RSVP status validation (enum check)
    - Return structured error array referencing specific fields
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 2.2 Write property tests for validation (Properties 2, 3)
    - **Property 2: Missing field validation** — For any submission with absent/empty required fields, validation rejects and returns errors referencing exactly the missing fields
    - **Property 3: Email format validation** — For any string without exactly one "@" followed by a dotted domain, validation rejects as invalid email
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.3 Implement guest registration endpoint (POST /api/guests)
    - Create `GuestService` with upsert logic: normalize email (lowercase, trim), check if existing record, insert or update accordingly
    - Record `submittedAt` in UTC with second precision
    - Return appropriate response (201 for new, 200 for update) with confirmation message
    - Use database transaction for atomic save
    - _Requirements: 1.2, 1.5, 1.6, 4.1, 5.1, 5.2_

  - [ ]* 2.4 Write property tests for registration (Properties 1, 4)
    - **Property 1: Registration round-trip persistence** — For any valid registration, persisting and retrieving yields matching fields with approvalStatus "Pending" and submittedAt within 1 second
    - **Property 4: Upsert by normalized email** — For any two submissions with same email (varying case/whitespace), system contains one record with second submission's RSVP status
    - **Validates: Requirements 1.2, 1.6, 4.1, 5.1, 5.2**

  - [x] 2.5 Implement error handling for database failures on registration
    - Return 500 with error message if database write fails
    - Return 503 if database connection is unavailable
    - _Requirements: 4.4, 5.3_

- [x] 3. Implement guest list retrieval endpoint
  - [x] 3.1 Implement GET /api/guests endpoint
    - Retrieve all guest records sorted by `submitted_at` DESC
    - Include status counts (attending, not attending) in response
    - Return within 2 seconds
    - _Requirements: 2.1, 2.2, 2.3, 4.3_

  - [ ]* 3.2 Write property tests for guest list (Properties 5, 6)
    - **Property 5: Guest list ordering** — For any set of registrations with distinct timestamps, retrieval returns records sorted by submittedAt descending
    - **Property 6: RSVP status counts accuracy** — For any set of registrations, reported counts match actual number of records per status
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 3.3 Implement error handling for guest list retrieval
    - Return 503 with error message if database is unavailable
    - Return 500 if query fails
    - _Requirements: 4.5_

- [x] 4. Checkpoint - Backend core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement admin authentication
  - [x] 5.1 Implement auth service and login endpoint (POST /api/admin/login)
    - Create `AuthService` with bcrypt password verification and JWT token generation
    - Return JWT on success, 401 on invalid credentials
    - _Requirements: 6.1, 6.3_

  - [x] 5.2 Implement JWT authentication middleware
    - Create middleware that validates JWT on admin routes
    - Return 401 for missing/expired/invalid tokens
    - _Requirements: 6.1, 6.2_

- [x] 6. Implement admin CRUD operations
  - [x] 6.1 Implement GET /api/admin/guests with filtering and search
    - Support query params for RSVP status filter and name/email substring search (case-insensitive)
    - Return all guest records when no filter/search applied
    - _Requirements: 6.4, 6.12, 6.13_

  - [ ]* 6.2 Write property tests for admin filtering and search (Properties 10, 11)
    - **Property 10: Filter by RSVP status** — For any records and filter value, results contain exactly records matching that status
    - **Property 11: Search by case-insensitive substring** — For any records and search string, results contain exactly records where search appears in name or email
    - **Validates: Requirements 6.12, 6.13**

  - [x] 6.3 Implement PUT /api/admin/guests/:id for editing guest records
    - Validate input (name 1-100 chars, email format, RSVP enum)
    - Check email uniqueness (case-insensitive, trimmed) against other records
    - Return 409 if email conflict, 200 on success
    - _Requirements: 6.5, 6.6, 6.11_

  - [ ]* 6.4 Write property tests for admin edit (Properties 7, 9)
    - **Property 7: Admin edit persistence** — For any existing record and valid non-conflicting edit, retrieving after edit yields updated values
    - **Property 9: Email uniqueness constraint on edit** — For any two records, editing one's email to match the other (case-insensitive, trimmed) is rejected
    - **Validates: Requirements 6.6, 6.11**

  - [x] 6.5 Implement DELETE /api/admin/guests/:id
    - Permanently remove guest record from database
    - Return 404 if record not found
    - _Requirements: 6.9_

  - [ ]* 6.6 Write property test for admin deletion (Property 8)
    - **Property 8: Admin deletion removes record** — For any existing record, after confirmed deletion, the record is no longer retrievable
    - **Validates: Requirements 6.9**

  - [x] 6.7 Implement error handling for admin operations
    - Return appropriate errors for failed edits (6.7), failed deletes (6.10)
    - _Requirements: 6.7, 6.10_

- [x] 7. Implement approval workflow and email notifications
  - [x] 7.1 Implement POST /api/admin/guests/:id/approve endpoint
    - Verify record has `approvalStatus` of "Pending"
    - Update `approvalStatus` to "Approved" in database
    - Trigger email send (async, non-blocking to approval save)
    - Set `approval_email_sent` flag on success
    - Return approval result with emailSent status
    - _Requirements: 6.15, 7.1_

  - [ ]* 7.2 Write property test for approval transition (Property 12)
    - **Property 12: Approval status transition** — For any record with approvalStatus "Pending", approve action changes status to "Approved" and persists
    - **Validates: Requirements 6.15**

  - [x] 7.3 Implement email service with Resend
    - Install and configure Resend SDK with API key from environment variable
    - Compose approval email with guest name, RSVP status, "Baby Shower" in subject and body, confirmation message
    - Send from configured sender address (greatglorious2@gmail.com or Resend default)
    - Implement deduplication logic using `approval_email_sent` flag
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [ ]* 7.4 Write property tests for email (Properties 13, 14)
    - **Property 13: Approval email content** — For any approved guest, generated email contains guest name, RSVP status, "Baby Shower" in subject and body
    - **Property 14: At most one approval email per guest** — For any sequence of operations on a guest, email service invoked at most once per guest on Pending→Approved transition
    - **Validates: Requirements 7.2, 7.3, 7.5, 7.6, 7.7**

  - [x] 7.5 Implement email failure handling
    - Save approval status regardless of email outcome
    - Return warning in response if email fails
    - Do not resend email on subsequent edits to already-approved records
    - _Requirements: 7.4, 7.5, 7.6_

- [x] 8. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend registration form
  - [x] 9.1 Create RegistrationForm component
    - Build form with name (text input, max 100 chars), email (text input, max 254 chars), and RSVP status (select with Attending/Not Attending/Undecided)
    - Implement client-side validation matching backend rules
    - Display field-specific validation errors without clearing filled fields
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 9.2 Implement form submission and confirmation flow
    - Submit to POST /api/guests
    - Display confirmation message showing RSVP status and pending approval on success
    - Display "RSVP updated" message when updating existing registration
    - Handle server errors by displaying error and preserving form values
    - Complete within 3 seconds
    - _Requirements: 1.2, 4.4, 5.2, 5.3_

- [x] 10. Implement frontend guest list view
  - [x] 10.1 Create GuestListView component
    - Display all guests in a table with name, email, RSVP status, approval status, and timestamp
    - Show attendance counts (attending count, not attending count)
    - Display empty state message when no guests registered with counts at zero
    - Sort by registration timestamp descending
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 10.2 Implement auto-refresh polling
    - Poll GET /api/guests every 5 seconds
    - Update guest list and counts without full page reload
    - Handle retrieval errors with message and retry button
    - _Requirements: 2.4, 4.5_

- [ ] 11. Implement frontend admin panel
  - [x] 11.1 Create AdminLogin component
    - Build login form with username and password fields
    - Submit to POST /api/admin/login
    - Store JWT in memory on success
    - Display error on invalid credentials, clear password only
    - Redirect unauthenticated users to login
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 11.2 Create AdminPanel component with guest table
    - Display all guest records in a table (name, email, RSVP status, approval status, timestamp)
    - Show "Approve" button for records with Pending approval status only
    - Hide "Approve" button for already-Approved records
    - _Requirements: 6.4, 6.16, 6.17_

  - [x] 11.3 Implement admin filter and search functionality
    - Add RSVP status filter dropdown
    - Add search input for name/email (case-insensitive substring)
    - _Requirements: 6.12, 6.13_

  - [x] 11.4 Implement admin edit functionality
    - Click a record to open edit form pre-filled with current data
    - Validate edited fields (name max 100, email format, RSVP enum)
    - Display email uniqueness error if conflict
    - Display error and retain unsaved edits on save failure
    - _Requirements: 6.5, 6.6, 6.7, 6.11_

  - [x] 11.5 Implement admin delete functionality
    - Show confirmation prompt before deletion
    - Remove record on confirmation
    - Display error on failure, retain record unchanged
    - _Requirements: 6.8, 6.9, 6.10_

  - [x] 11.6 Implement admin approve functionality
    - Call POST /api/admin/guests/:id/approve on approve button click
    - Display email warning if approval saved but email not sent
    - Update approval status in UI on success
    - _Requirements: 6.15, 6.16, 7.4_

- [x] 12. Implement blue baby boy theme
  - [x] 12.1 Create ThemeProvider with blue color palette and CSS variables
    - Define primary blue palette for backgrounds, headings, buttons, borders
    - Apply consistently across Registration Form, Guest List View, and Admin Panel
    - Ensure all text meets minimum 4.5:1 contrast ratio against backgrounds
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 12.2 Add baby-shower-themed decorative elements
    - Add at least 2 decorative elements (baby-themed icons, illustrations, or motifs) rendered in the blue theme
    - Place on key pages (registration form, guest list view)
    - _Requirements: 3.3_

- [x] 13. Implement routing and wire everything together
  - [x] 13.1 Set up React Router and connect all pages
    - Configure routes for Registration Form, Guest List View, Admin Login, and Admin Panel
    - Apply ThemeProvider to all routes
    - Ensure admin routes are protected (redirect to login if no valid JWT)
    - _Requirements: 4.2, 6.2_

  - [x] 13.2 Configure backend CORS, environment variables, and startup
    - Set up CORS for frontend origin
    - Configure environment variables for database connection, JWT secret, SMTP settings
    - Set up Express app with all routes wired together
    - _Requirements: 4.6_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The application uses TypeScript throughout (React frontend + Node.js backend)
- PostgreSQL is required for local development (use Docker or local install)
- Environment variables needed: DATABASE_URL, JWT_SECRET, RESEND_API_KEY

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "5.2"] },
    { "id": 4, "tasks": ["2.4", "2.5", "3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.5"] },
    { "id": 7, "tasks": ["6.4", "6.6", "6.7", "7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] },
    { "id": 9, "tasks": ["7.4", "7.5"] },
    { "id": 10, "tasks": ["9.1", "12.1"] },
    { "id": 11, "tasks": ["9.2", "10.1", "12.2"] },
    { "id": 12, "tasks": ["10.2", "11.1"] },
    { "id": 13, "tasks": ["11.2", "11.3"] },
    { "id": 14, "tasks": ["11.4", "11.5", "11.6"] },
    { "id": 15, "tasks": ["13.1", "13.2"] }
  ]
}
```
