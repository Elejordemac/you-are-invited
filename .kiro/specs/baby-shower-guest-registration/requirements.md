# Requirements Document

## Introduction

A baby shower planning web application with a flashy blue theme (baby boy), accessible from anywhere with internet connectivity. The feature allows guests to register themselves (RSVP) for the event via a publicly accessible web form. The application uses a server-side backend with a database for persistent storage, and provides the host with a guest list view. An admin panel allows authorized administrators to manage guest registration data directly.

## Glossary

- **Registration_Form**: The web form that guests use to submit their RSVP for the baby shower event
- **Guest_List_View**: The host-facing page that displays all registered guests and their RSVP status
- **Guest**: A person who has been invited to the baby shower and can register via the Registration_Form
- **Host**: The person organizing the baby shower who can view the Guest_List_View
- **RSVP_Status**: The attendance response of a guest, either "Attending", "Not Attending", or "Undecided"
- **Approval_Status**: The administrative state of a guest registration, either "Pending" or "Approved"
- **Approval_Email**: The email notification sent to a guest when the Administrator approves their registration
- **Application**: The baby shower guest registration web application, consisting of a frontend, backend server, and database
- **Backend**: The server-side component of the Application that handles API requests and communicates with the Database
- **Database**: The persistent server-side data store that holds all guest registration records
- **Admin_Panel**: The authenticated administrative interface for managing guest registration data
- **Administrator**: A user with valid credentials who can access the Admin_Panel to manage guest data

## Requirements

### Requirement 1: Guest Self-Registration

**User Story:** As a guest, I want to register my attendance for the baby shower, so that the host knows whether I am coming.

#### Acceptance Criteria

1. THE Registration_Form SHALL display fields for guest name (text input, maximum 100 characters), email address (text input, maximum 254 characters), and RSVP_Status selection with the options "Attending", "Not Attending", and "Undecided"
2. WHEN a guest submits the Registration_Form with valid data, THE Application SHALL save the registration with an Approval_Status of "Pending" and display a confirmation message indicating the submitted RSVP_Status and that the registration is pending approval within 3 seconds of submission
3. IF a guest submits the Registration_Form with missing required fields, THEN THE Application SHALL display a validation error indicating which fields are required without clearing the already-filled fields
4. IF a guest submits the Registration_Form with an email address that does not contain exactly one "@" symbol followed by a domain with at least one dot, THEN THE Application SHALL display a validation error for the email field
5. WHEN a guest submits the Registration_Form, THE Application SHALL record the submission timestamp in UTC with precision to the second
6. IF a guest submits the Registration_Form with an email address that already exists in a prior registration, THEN THE Application SHALL update the existing registration with the new RSVP_Status rather than creating a duplicate entry

### Requirement 2: Guest List View for Host

**User Story:** As a host, I want to see the list of registered guests, so that I can plan the event based on who is attending.

#### Acceptance Criteria

1. THE Guest_List_View SHALL display all registered guests with their name, email, RSVP_Status, Approval_Status, and registration timestamp, sorted by registration timestamp in descending order (most recent first)
2. THE Guest_List_View SHALL display the total count of guests with "Attending" status
3. THE Guest_List_View SHALL display the total count of guests with "Not Attending" status
4. WHEN a new guest registers, THE Guest_List_View SHALL include the new guest entry and update the status counts within 5 seconds without requiring a full page reload
5. IF no guests have registered, THEN THE Guest_List_View SHALL display a message indicating that no guests have registered yet and show the attendance counts as zero

### Requirement 3: Blue Theme Design

**User Story:** As a host, I want the application to have a flashy blue baby boy theme, so that the event branding is cohesive and celebratory.

#### Acceptance Criteria

1. THE Application SHALL use a blue color palette as the primary theme colors for backgrounds, headings, buttons, and borders across all pages
2. THE Application SHALL apply the same blue theme colors to equivalent UI elements (headings, buttons, input borders, and page backgrounds) on both the Registration_Form and Guest_List_View
3. THE Application SHALL display at least 2 baby-shower-themed decorative elements (such as icons, illustrations, or motifs related to babies, celebrations, or nursery imagery) rendered in the blue theme
4. THE Application SHALL ensure that all text meets a minimum contrast ratio of 4.5:1 against its background color

### Requirement 4: Server-Side Data Persistence

**User Story:** As a host, I want guest registrations to be stored in a server-side database, so that the data is accessible from any device with internet access and is not tied to a single browser.

#### Acceptance Criteria

1. THE Backend SHALL persist all guest registration data, including guest name, email address, RSVP_Status, Approval_Status, and submission timestamp, in the Database as an atomic operation such that either all fields are saved together or none are saved
2. THE Application SHALL be accessible from any device with a web browser and internet connection without requiring local installation or browser-specific storage
3. WHEN the Host opens the Guest_List_View, THE Backend SHALL retrieve and return all previously saved registrations from the Database ordered by submission timestamp from most recent to oldest within 2 seconds
4. IF the Backend fails to save a registration to the Database, THEN THE Application SHALL display an error message indicating the registration could not be saved and retain all form field values so the guest can retry submission
5. IF the Backend fails to retrieve previously saved registrations from the Database, THEN THE Application SHALL display an error message indicating that saved data could not be retrieved and provide a retry button that the Host can activate to re-attempt loading
6. THE Backend SHALL expose a RESTful API that the frontend communicates with over HTTPS for all data operations
7. WHEN the Backend successfully persists a registration, THE Database SHALL retain that record across server restarts and subsequent application sessions until explicitly deleted

### Requirement 5: Duplicate Registration Prevention

**User Story:** As a host, I want to prevent duplicate registrations, so that the guest list remains accurate.

#### Acceptance Criteria

1. WHEN a guest submits the Registration_Form with an email address that matches an existing registration (case-insensitive, ignoring leading and trailing whitespace), THE Application SHALL update all fields of the existing registration with the newly submitted values instead of creating a duplicate entry
2. WHEN an existing registration is successfully updated, THE Application SHALL display a confirmation message indicating that the RSVP has been updated rather than newly created
3. IF the update to an existing registration fails, THEN THE Application SHALL display an error message indicating the update could not be completed and SHALL preserve the previously stored registration data unchanged

### Requirement 6: Admin Panel

**User Story:** As an administrator, I want an admin panel to manage guest registration data, so that I can view, edit, and delete guest records directly in the database.

#### Acceptance Criteria

1. THE Admin_Panel SHALL require the Administrator to authenticate with a username and password before granting access to any administrative functions
2. IF an unauthenticated user attempts to access the Admin_Panel, THEN THE Application SHALL redirect the user to a login page and display no guest data
3. IF the Administrator submits invalid credentials, THEN THE Admin_Panel SHALL display an error message indicating the credentials are incorrect and SHALL NOT grant access to administrative functions
4. WHEN the Administrator is authenticated, THE Admin_Panel SHALL display a table of all guest registrations with columns for guest name, email address, RSVP_Status, Approval_Status, and submission timestamp
5. WHEN the Administrator selects a guest record for editing, THE Admin_Panel SHALL display a form pre-filled with the guest's current data allowing the Administrator to modify the name (maximum 100 characters), email (maximum 254 characters, validated for format containing exactly one "@" followed by a domain with at least one dot), and RSVP_Status fields (limited to "Attending", "Not Attending", or "Undecided")
6. WHEN the Administrator submits an edit to a guest record with valid data, THE Backend SHALL save the changes to the Database within 2 seconds
7. IF the Backend fails to save an edit to a guest record, THEN THE Admin_Panel SHALL display an error message indicating the change could not be saved and SHALL retain the Administrator's unsaved edits in the form
8. WHEN the Administrator requests deletion of a guest record, THE Admin_Panel SHALL prompt for confirmation before proceeding with the deletion
9. WHEN the Administrator confirms deletion of a guest record, THE Backend SHALL permanently remove the record from the Database
10. IF the Backend fails to delete a guest record, THEN THE Admin_Panel SHALL display an error message indicating the deletion could not be completed and SHALL retain the record unchanged
11. IF the Administrator attempts to edit a guest email to an address that already exists for another registration (case-insensitive, ignoring leading and trailing whitespace), THEN THE Admin_Panel SHALL display an error indicating the email is already in use and SHALL NOT save the change
12. THE Admin_Panel SHALL allow the Administrator to filter guest records by RSVP_Status
13. THE Admin_Panel SHALL allow the Administrator to search guest records by name or email address using case-insensitive substring matching
14. THE Admin_Panel SHALL apply the same blue theme as the rest of the Application
15. WHEN the Administrator selects an "Approve" action on a guest record with Approval_Status of "Pending", THE Backend SHALL update the Approval_Status to "Approved" in the Database
16. THE Admin_Panel SHALL display an "Approve" button for each guest record with an Approval_Status of "Pending"
17. THE Admin_Panel SHALL NOT display an "Approve" button for guest records that already have an Approval_Status of "Approved"

### Requirement 7: Approval Email Notification

**User Story:** As a guest, I want to receive an email when my registration is approved, so that I know my RSVP has been recognized and confirmed by the host.

#### Acceptance Criteria

1. WHEN the Administrator approves a guest registration, THE Backend SHALL send an Approval_Email to the guest's registered email address within 30 seconds of the approval action
2. THE Approval_Email SHALL include the guest's name, their RSVP_Status, the event name "Baby Shower", and a message confirming that their registration has been recognized and approved
3. THE Approval_Email SHALL include the event name "Baby Shower" in the subject line
4. IF the Backend fails to send the Approval_Email, THEN THE Admin_Panel SHALL display a warning message indicating the approval was saved but the notification email could not be sent
5. IF a guest registration is edited or deleted without a change of Approval_Status from "Pending" to "Approved", THEN THE Backend SHALL NOT send an Approval_Email
6. IF a guest registration already has an Approval_Status of "Approved" and the Administrator edits the record, THEN THE Backend SHALL NOT resend the Approval_Email
7. THE Backend SHALL send at most one Approval_Email per guest registration, corresponding to the single transition of Approval_Status from "Pending" to "Approved"
