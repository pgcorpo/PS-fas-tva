Perfect. **Option A (RFC-style language)** it is.

From here on:

* Language will be **strict, normative, and unambiguous**  
* We will use **MUST / MUST NOT / SHOULD / MAY**  
* Zero summarization  
* Zero missing logic  
* Written to be **machine- and junior-safe**

As agreed, we will build this **incrementally**, but the end result will be **one single downloadable Markdown file**.

---

# **FINAL PRD (DRAFT IN PROGRESS)**

## **Goal-Linked Habit Tracker**

### **RFC-Style Product & Technical Specification**

**Status:** In construction  
**Audience:** Junior developer \+ AI coding tool  
**Guarantee:** This document contains all rules required to implement the system correctly.

---

# **SECTION 1 — PRODUCT SCOPE & OBJECTIVES**

## **1.1 Purpose**

The system MUST provide a web-based habit tracking experience where:

* **Habits** are the primary unit of work  
* Habits define **weekly required effort**  
* Users complete habits as **daily completion instances**  
* Progress is calculated and displayed **weekly** and **monthly**  
* All logic respects the **user’s local timezone**

The system MUST be correct before it is beautiful.

---

## **1.2 In-Scope Functionality**

The system MUST allow an authenticated user to:

1. Create, edit, and soft-delete **habits**  
2. Define a **weekly frequency** per habit  
3. Optionally associate habits with **annual goals**  
4. Complete habits daily as **instances**  
5. View:  
   * Today’s required habit instances  
   * Past completions (read-only)  
   * Weekly progress summaries  
   * Monthly calendar progress  
6. Undo habit completions **on the same day only**

---

## **1.3 Out-of-Scope (Non-Goals)**

The system MUST NOT include:

* Notifications (push, email, SMS)  
* Streaks, gamification, points, badges  
* Social features  
* Offline-first guarantees  
* Native mobile apps  
* Analytics beyond progress visualization  
* Admin or multi-tenant management

Any implementation including these features is **out of scope**.

---

## **1.4 Target User**

* Single end user per account  
* Authenticated via Google OAuth  
* Uses the system daily for ≤ 5 minutes  
* Expects correctness, not motivation tricks

---

# **SECTION 2 — AUTHORITATIVE DEFINITIONS**

This section is **normative**.  
All later sections depend on these definitions.

---

## **2.1 Time & Calendar Semantics**

### **2.1.1 Timezone**

* The system MUST treat the **user’s local browser timezone** as the source of truth.  
* The backend MUST NOT assume UTC for “today” semantics.

### **2.1.2 Date Format**

* All dates MUST be represented as `YYYY-MM-DD`  
* Dates represent **local calendar days**, not instants.

### **2.1.3 Week Definition**

* A week MUST start on **Monday**  
* A week MUST end on **Sunday**  
* Week boundaries MUST be calculated in the user’s local timezone

---

## **2.2 Habit**

A **Habit** is a definition of required recurring work.

A Habit MUST have:

* A human-readable name  
* A weekly target (`weekly_target ≥ 1`)  
* A boolean flag `requires_text_on_completion`  
* An optional link to an annual goal  
* A user-defined ordering index  
* A soft-delete flag

A Habit:

* MUST NOT belong to a specific date  
* MUST NOT track completion state directly

---

## **2.3 Habit Completion (Instance)**

A **Habit Completion Instance** represents **one required unit of work**.

A Habit Completion Instance:

* MUST reference exactly one Habit  
* MUST reference exactly one date (`YYYY-MM-DD`)  
* MAY include free-text notes  
* MUST be immutable after the day passes

Multiple completion instances:

* MAY exist for the same habit on the same day  
* MUST be allowed to support Sunday catch-up behavior

---

## **2.4 Weekly Enforcement Rules (Critical)**

The system MUST enforce the following:

1. A habit MUST appear only until its weekly target is met  
2. From Monday to Saturday:  
   * A habit MAY appear **at most once per day**  
3. On Sunday:  
   * A habit MUST appear **once per remaining required instance**  
4. Once the weekly target is met:  
   * The habit MUST NOT appear again that week  
5. Over-completion MUST NOT be possible

---

## **2.5 Undo Rules**

* A completion instance MAY be deleted **only on the same calendar day**  
* The system MUST prevent deletion of past-day instances  
* Past days MUST be strictly read-only

---

## **2.6 Habit Versioning Rules**

* Editing a habit MUST NOT affect the current week  
* Every edit MUST create a **new habit version**  
* New versions MUST become effective **starting the next Monday**  
* Historical weeks MUST remain immutable

---

## **2.7 Habit Creation Rule**

* Newly created habits MUST become effective **immediately**  
* Immediate effect applies to the current week only

---

## **2.8 Annual Goals**

* Goals are OPTIONAL  
* Goals exist only for grouping/context  
* Deleting a goal MUST NOT delete habits  
* Deleted goals MUST be unlinked from future habit versions

---

# **SECTION 3 — USER FLOWS (STEP-BY-STEP)**

This section defines **exact behavioral flows**.

---

## **3.1 Authentication Flow**

1. User visits the application  
2. If unauthenticated:  
   * System MUST show a Google Sign-In option  
3. Upon successful OAuth:  
   * System MUST create a user record if one does not exist  
   * System MUST redirect the user to **Daily (Today)**

Failure handling:

* OAuth failure MUST display a retryable error  
* No partial user creation is allowed

---

## **3.2 Daily Flow — Today (Interactive)**

### **Preconditions**

* User is authenticated  
* Date \= user’s local “today”

### **Flow**

1. System computes:  
   * Current week start (Monday)  
   * Current week end (Sunday)  
2. For each active habit:  
   * Count completion instances in the current week  
   * Compute remaining required instances  
3. Rendering rules:  
   * If remaining \= 0 → render nothing  
   * If today is Mon–Sat and remaining \> 0 → render 1 instance  
   * If today is Sunday → render `remaining` instances  
4. User interaction:  
   * Checking a non-text habit → instance created immediately  
   * Checking a text-required habit → inline editor opens  
5. Draft handling:  
   * Closing editor MUST save draft locally  
   * Saving MUST create instance and clear draft  
6. Completed instances MUST render as checked items  
7. Checked items MAY be unchecked to delete instance (today only)

---

## **3.3 Daily Flow — Past Date (Read-Only)**

### **Preconditions**

* Date \< today (local)

### **Rules**

* System MUST show only completed instances for that date  
* System MUST NOT show remaining habits  
* All checkboxes MUST be disabled  
* No creation or deletion is allowed

---

## **3.4 Progress Flow**

1. System MUST compute weekly totals:  
   * Required \= sum of weekly targets  
   * Completed \= count of instances  
2. Weekly percentage MUST be computed as:

```
completed / required
```

3.   
   Calendar:  
   * MUST display current month by default  
   * MUST allow month navigation  
4. Week coloring:  
   * Future week OR required \= 0 → no color  
   * \<25% → red  
   * 25–75% → yellow  
   * 75% → green  
5. Clicking a date MUST navigate to Daily view for that date

---

## **3.5 Habit Configuration Flow**

1. Habits MUST be displayed as a responsive grid  
2. Creating a habit:  
   * MUST take effect immediately  
3. Editing a habit:  
   * MUST create a new version  
   * MUST display “Applies next Monday”  
4. Deleting a habit:  
   * MUST be soft delete  
   * MUST preserve historical data

---

## **3.6 Goals Flow**

1. User MAY create/edit/delete goals  
2. Goal deletion:  
   * MUST unlink future habit versions  
   * MUST preserve historical associations

---

Excellent. Continuing exactly as agreed: **RFC-style, no summarization, implementation-grade**.

---

# **SECTION 4 — FUNCTIONAL REQUIREMENTS (NORMATIVE)**

This section defines **what the system MUST do**, broken down by feature.  
All requirements in this section are **binding**.

---

## **4.1 Authentication & Authorization Requirements**

### **4.1.1 Authentication**

* The system MUST authenticate users using **Google OAuth**  
* The system MUST create a user record on first successful login  
* The system MUST persist authentication across page reloads  
* The system MUST redirect unauthenticated users to login

### **4.1.2 Authorization**

* Every API request (except health checks) MUST be authenticated  
* The backend MUST derive `user_id` from the session/token  
* The backend MUST NOT accept `user_id` from client payloads  
* A user MUST NOT be able to read or modify another user’s data

### **Acceptance Criteria**

* Given two users A and B, user A MUST NOT see or mutate any data belonging to user B  
* Any unauthorized access attempt MUST return an authorization error

---

## **4.2 Daily Tab — Core Functional Requirements**

### **4.2.1 Data Fetching**

* The Daily view MUST fetch:  
  * All active habits for the user  
  * All completion instances for the current week  
* For past dates, the Daily view MUST fetch:  
  * Completion instances for that specific date only

---

### **4.2.2 Remaining Instance Calculation**

For each habit:

1. The system MUST compute:

```
completed_this_week = count(instances where
  habit_id == habit.id AND
  date BETWEEN week_start AND week_end)
```

2.   
   The system MUST compute:

```
remaining = weekly_target - completed_this_week
```

3.   
   Rendering rules:  
   * If `remaining <= 0` → render 0 instances  
   * If `remaining > 0` AND day ∈ Monday–Saturday → render exactly 1 instance  
   * If `remaining > 0` AND day \== Sunday → render exactly `remaining` instances

These rules MUST be enforced consistently in UI and backend validation.

---

### **4.2.3 Completion Creation (Today Only)**

When the user attempts to complete a habit instance:

* The backend MUST validate:  
  * The date equals today (local)  
  * The habit is active in the current week  
  * The weekly target has not already been met  
* If `requires_text_on_completion == true`:  
  * The backend MUST reject empty text  
* If validation passes:  
  * A new completion instance MUST be created

---

### **4.2.4 Draft Text Handling**

* Draft text MUST be stored client-side  
* Draft text MUST be keyed by:  
  * user  
  * habit  
  * date  
* Closing the text editor:  
  * MUST persist the draft  
  * MUST NOT create a completion  
* Saving the completion:  
  * MUST create the completion instance  
  * MUST clear the draft

Drafts MUST NOT be persisted server-side in v1.

---

### **4.2.5 Undo / Deletion (Instance-Level)**

* A completion instance MAY be deleted only if:  
  * Its date \== today (local)  
* Deletion MUST remove exactly one instance  
* The backend MUST reject deletion attempts for past dates  
* The UI MUST disable deletion controls for past days

---

### **Acceptance Criteria (Daily Tab)**

* A habit with weekly target met MUST NOT appear again that week  
* On Sunday, multiple remaining instances MUST be rendered correctly  
* Deleting one of multiple Sunday instances MUST NOT affect the others  
* Past days MUST be fully read-only

---

## **4.3 Habit Management Requirements**

### **4.3.1 Habit Creation**

* Creating a habit MUST:  
  * Create a Habit record  
  * Create an initial Habit Version  
* The initial version MUST have:  
  * `effective_week_start = current week’s Monday`

---

### **4.3.2 Habit Editing (Versioning)**

* Editing a habit MUST:  
  * Create a new Habit Version  
  * Set `effective_week_start = next Monday`  
* Existing versions MUST NOT be modified  
* Current week calculations MUST use the previous version

---

### **4.3.3 Habit Deletion**

* Deleting a habit MUST be a soft delete  
* Soft-deleted habits:  
  * MUST NOT appear in Daily or Progress going forward  
  * MUST retain historical completion data

---

### **Acceptance Criteria (Habits)**

* Editing a habit mid-week MUST NOT change current week behavior  
* Deleted habits MUST disappear immediately from forward-looking views  
* Historical data MUST remain visible

---

## **4.4 Goals Requirements**

### **4.4.1 Goal CRUD**

* The system MUST allow creating, editing, and deleting goals  
* Goals MUST be scoped to a single user

### **4.4.2 Goal Deletion**

* Deleting a goal MUST:  
  * Unlink future habit versions  
  * Preserve historical links in past versions

---

## **4.5 Progress & Calendar Requirements**

### **4.5.1 Weekly Summary**

* Required count MUST equal:

```
sum(weekly_target of all active habits for that week)
```

*   
  Completed count MUST equal:

```
count(completion instances in that week)
```

*   
  Percentage MUST be:

```
completed / required
```

---

### **4.5.2 Calendar Coloring**

For each week:

* If required \== 0 OR week in future → no color  
* If % \< 25 → red  
* If 25 ≤ % ≤ 75 → yellow  
* If % \> 75 → green

---

### **Acceptance Criteria (Progress)**

* Weekly percentages MUST NEVER exceed 100%  
* Calendar coloring MUST match weekly summary values  
* Clicking a date MUST open the correct Daily view

---

Understood. Continuing **exactly** in the agreed mode: **RFC-style, exhaustive, implementation-grade, no summarization**.

---

# **SECTION 5 — UX & UI REQUIREMENTS (NORMATIVE)**

This section defines **what the user interface MUST and MUST NOT do**.  
Visual styling is intentionally flexible, but **behavior, states, and constraints are mandatory**.

---

## **5.1 Global UX Principles**

The UI MUST adhere to the following principles:

1. **Correctness over cleverness**  
   * The UI MUST never display information that contradicts backend-enforced rules.  
2. **Low cognitive load**  
   * The user SHOULD be able to complete daily usage in under 60 seconds.  
3. **Forgiving interaction**  
   * The UI SHOULD allow safe undo within defined limits.  
4. **Accessibility**  
   * All core flows MUST be usable with keyboard navigation.  
   * Focus states MUST be visible.  
5. **Progressive disclosure**  
   * Advanced or secondary information MUST NOT clutter primary flows.

---

## **5.2 Global Layout Requirements**

### **5.2.1 Navigation**

* The UI MUST provide persistent top-level navigation with the following entries:  
  * Daily  
  * Progress  
  * Habits  
  * Goals  
* The currently active tab MUST be visually distinguishable.  
* Navigation MUST NOT trigger a full page reload (SPA behavior).

---

### **5.2.2 Authentication UI**

* If the user is unauthenticated:  
  * The UI MUST display a Google Sign-In CTA.  
  * No application content MUST be visible.  
* If authentication fails:  
  * The UI MUST display a retryable error message.  
  * The UI MUST NOT partially load application state.

---

## **5.3 Daily View — UI Requirements**

### **5.3.1 Header Area**

The Daily view MUST display:

* The selected date, formatted in a human-readable way.  
* If the date is not today:  
  * A visible “Read-only” indicator.

The header MUST NOT allow editing the date directly.

---

### **5.3.2 Remaining Section (Today Only)**

#### **Visibility Rules**

* The Remaining section MUST be rendered **only when viewing today**.  
* The Remaining section MUST NOT be rendered for past dates.

---

#### **Habit Instance Rendering**

For each habit instance rendered:

* The UI MUST show:  
  * Habit name  
  * An unchecked checkbox  
* Each checkbox MUST correspond to **exactly one required instance**.

On Sunday:

* Multiple instances for the same habit MUST be rendered as distinct rows.

---

#### **Interaction Rules**

* Clicking an unchecked checkbox:  
  * For non-text habits:  
    * MUST immediately mark the instance as completed  
  * For text-required habits:  
    * MUST open an inline text editor  
    * MUST NOT mark the instance as completed yet

---

### **5.3.3 Text Entry UI (Inline Editor)**

#### **Opening**

* The inline editor MUST open in-place, near the checkbox.  
* The editor MUST contain:  
  * A multiline text input  
  * A “Save & Mark Done” primary action  
  * A “Close” secondary action

---

#### **Draft Behavior**

* Clicking “Close”:  
  * MUST persist the current text as a draft  
  * MUST NOT create a completion instance  
* Reopening the editor:  
  * MUST preload any existing draft text  
* Draft persistence:  
  * MUST be client-side only  
  * MUST be scoped by user \+ habit \+ date

---

#### **Save Behavior**

* Clicking “Save & Mark Done”:  
  * MUST submit the completion to the backend  
  * MUST clear the draft on success  
  * MUST transition the item to the Completed section

If submission fails:

* The UI MUST display an error  
* The draft MUST remain intact

---

### **5.3.4 Completed Section**

#### **Visibility**

* The Completed section MUST be rendered for:  
  * Today  
  * Past dates  
* If no completions exist:  
  * The section MAY be hidden or show an empty state

---

#### **Completed Item Rendering**

Each completed instance MUST be rendered as:

* A checked checkbox  
* The habit name  
* A truncated preview of text (if present)

---

#### **Undo Interaction (Today Only)**

* For today:  
  * Completed checkboxes MUST be interactive  
  * Unchecking a checkbox MUST delete exactly one instance  
* For past dates:  
  * Completed checkboxes MUST be disabled  
  * Visual affordance MUST indicate non-interactive state

The UI MUST NOT expose a separate “Undo” button.

---

## **5.4 Past Date View — UI Requirements**

When viewing a past date:

* The UI MUST:  
  * Display only completed instances  
  * Disable all checkboxes  
* The UI MUST NOT:  
  * Display remaining instances  
  * Allow creation or deletion of completions  
  * Allow text editing

---

## **5.5 Progress View — UI Requirements**

### **5.5.1 Weekly Summary**

The Weekly Summary UI MUST display:

* Week date range (Monday–Sunday)  
* Required completion count  
* Completed completion count  
* Completion percentage

If required count \= 0:

* The UI MUST display a neutral empty state  
* Percentage MAY be omitted or shown as 0 with explanation

---

### **5.5.2 Calendar View**

#### **Calendar Structure**

* The calendar MUST display a full month grid.  
* Weeks MUST align Monday–Sunday.  
* The calendar MUST allow navigating to previous and next months.

---

#### **Day Cells**

* Each day cell MUST display the day number.  
* Today MUST be visually highlighted.  
* Clicking a day cell MUST navigate to Daily view for that date.

---

#### **Week Coloring**

* Week rows MUST be color-coded according to weekly completion percentage.  
* Color logic MUST match Section 4.5 exactly.  
* Future weeks MUST appear uncolored.

---

## **5.6 Habits View — UI Requirements**

### **5.6.1 Layout**

* Habits MUST be displayed as a responsive card grid:  
  * Desktop: 3 columns  
  * Tablet: 2 columns  
  * Mobile: 1 column

---

### **5.6.2 Habit Card Content**

Each habit card MUST display:

* Habit name  
* Weekly target (e.g. “4× / week”)  
* Indicator if text is required  
* Linked goal (if any)  
* Edit action  
* Delete action

---

### **5.6.3 Habit Create / Edit Dialog**

* Dialog MUST include:  
  * Name input  
  * Weekly target input  
  * Text-required toggle  
  * Goal selector  
* When editing:  
  * UI MUST display “Changes apply next Monday”  
* Validation errors MUST be inline

---

### **5.6.4 Deletion UI**

* Deleting a habit MUST require confirmation  
* Confirmation text MUST state:  
  * Historical data will be preserved

---

## **5.7 Goals View — UI Requirements**

### **5.7.1 Layout**

* Goals MAY be displayed as a list or cards  
* Each goal MUST display:  
  * Title  
  * Year  
  * Edit action  
  * Delete action

---

### **5.7.2 Deletion Behavior**

* Deleting a goal MUST require confirmation  
* UI MUST state:  
  * Habits will not be deleted  
  * Future links will be removed

---

## **5.8 Loading, Empty, and Error States**

### **Loading**

* The UI MUST display loading indicators while data is fetching.  
* Skeleton loaders are preferred.

---

### **Empty States**

* If no habits exist:  
  * Daily view MUST show a CTA to create a habit  
* If no goals exist:  
  * Goals view MUST show a CTA to create a goal

---

### **Errors**

* API errors MUST be displayed in a user-friendly way  
* Errors MUST NOT expose stack traces or internal details

---

## **5.9 Accessibility Requirements**

The UI MUST:

* Support keyboard navigation for all interactive elements  
* Provide visible focus states  
* Ensure dialogs trap focus  
* Use semantic HTML where possible

---

## Continuing. Same mode, same rigor.

## ---

# **SECTION 6 — FRONTEND ARCHITECTURE & STATE MANAGEMENT (NORMATIVE)**

## This section defines **how the frontend MUST be structured** to correctly implement the product behavior. While technology choices are flexible (two options), **architectural responsibilities and boundaries are not**.

## ---

## **6.1 Frontend Architectural Principles**

## The frontend MUST adhere to the following principles:

1. ## **Single source of truth**

   * ## Server data MUST be treated as authoritative.

   * ## Client state MUST NOT override backend-enforced rules.

2. ## **Centralized date logic**

   * ## All date and week computations MUST be centralized.

   * ## No ad-hoc date math in components.

3. ## **Explicit data ownership**

   * ## Each piece of state MUST have a clear owner:

     * ## Server → backend

     * ## UI-only → frontend local state

     * ## Drafts → client persistence

4. ## **Predictable data flow**

   * ## Fetch → derive → render

   * ## Mutations MUST invalidate or update cached data deterministically.

## ---

## **6.2 Technology Options (Frontend)**

### **Option A (Recommended)**

* ## Framework: Next.js (App Router)

* ## Language: TypeScript

* ## Data fetching: TanStack Query

* ## UI: Tailwind CSS \+ shadcn/ui

* ## Forms: React Hook Form \+ Zod

* ## Date utilities: date-fns

### **Option B**

* ## Framework: Vite \+ React

* ## Language: TypeScript

* ## Data fetching: SWR

* ## UI: Component library of choice

* ## Forms: Formik or native

* ## Date utilities: Luxon or Day.js

## **Swap Cost:** Low–Moderate (Component logic reusable; routing, auth wiring, and data hooks change.)

## ---

## **6.3 Required Frontend Modules**

## The frontend MUST define the following modules explicitly.

### **6.3.1 Date Utilities Module**

## A single module (e.g. `dateUtils`) MUST expose:

* ## `getLocalToday(): YYYY-MM-DD`

* ## `getWeekStart(date): YYYY-MM-DD (Monday)`

* ## `getWeekEnd(date): YYYY-MM-DD (Sunday)`

* ## `isToday(date): boolean`

* ## `isPastDate(date): boolean`

* ## `getWeekRange(date): { start, end }`

## All components MUST use this module. Components MUST NOT compute week logic themselves.

## ---

### **6.3.2 API Client Module**

## A centralized API client MUST:

* ## Attach authentication credentials to every request

* ## Normalize API errors into a standard shape

* ## Expose typed methods for:

  * ## Fetching habits

  * ## Fetching completions

  * ## Creating/deleting completions

  * ## CRUD habits

  * ## CRUD goals

## The UI MUST NOT call `fetch` or `axios` directly outside this module.

## ---

## **6.4 Data Fetching & Caching Rules**

### **6.4.1 Query Scope**

## The following query scopes MUST exist:

* ## **Daily (Today):**

  * ## Active habits

  * ## Completion instances for current week

* ## **Daily (Past Date):**

  * ## Completion instances for that date

* ## **Progress:**

  * ## Completion instances covering visible calendar month

  * ## Habits (for weekly target calculations)

* ## **Habits:**

  * ## All non-deleted habits

  * ## Associated goal metadata

* ## **Goals:**

  * ## All non-deleted goals

## ---

### **6.4.2 Cache Invalidation Rules**

## The frontend MUST invalidate or update caches when:

* ## A completion instance is created or deleted:

  * ## Daily view

  * ## Progress view

* ## A habit is created, edited, or deleted:

  * ## Daily view

  * ## Progress view

  * ## Habits view

* ## A goal is edited or deleted:

  * ## Goals view

  * ## Habit edit dialogs

## Cache invalidation MUST be explicit and deterministic.

## ---

## **6.5 State Ownership & Boundaries**

### **6.5.1 Server State**

## The following MUST be treated as server state:

* ## Habits

* ## Habit versions

* ## Completion instances

* ## Goals

## These MUST be fetched from the backend and cached appropriately.

## ---

### **6.5.2 UI State**

## The following MAY be client-only UI state:

* ## Selected date

* ## Open dialogs/modals

* ## Inline editor open/closed state

* ## Loading indicators

## UI state MUST NOT encode business rules.

## ---

### **6.5.3 Draft State (Special Case)**

## Draft text state MUST:

* ## Be stored client-side only

* ## Be scoped by:

  * ## User ID

  * ## Habit ID

  * ## Date

* ## Be persisted across reloads

* ## Be cleared only on successful completion creation

## Drafts MUST NOT be sent to the backend.

## ---

## **6.6 Daily View Rendering Algorithm (Frontend)**

## For Today view, the frontend MUST:

1. ## Fetch habits and weekly completions

2. ## For each habit:

   * ## Resolve active habit version for the week

   * ## Compute `completed_this_week`

   * ## Compute `remaining = weekly_target - completed_this_week`

3. ## Determine render count:

   * ## `remaining <= 0` → 0

   * ## `remaining > 0` AND today ∈ Mon–Sat → 1

   * ## `remaining > 0` AND today \== Sunday → `remaining`

4. ## Render one checkbox per required instance

5. ## Bind each checkbox to:

   * ## Create completion (unchecked → checked)

   * ## Delete completion (checked → unchecked, today only)

## The frontend MUST NOT bypass backend validation.

## ---

## **6.7 Error Handling Rules**

* ## All API errors MUST be surfaced to the user in a friendly way

* ## Validation errors MUST be displayed inline where possible

* ## Transient errors MUST allow retry

* ## The UI MUST NOT enter an inconsistent state on failure

## ---

## **6.8 Accessibility & Performance Constraints**

* ## All interactive elements MUST be keyboard-accessible

* ## Rendering logic MUST avoid unnecessary recomputation

* ## Heavy calculations SHOULD be memoized

* ## Calendar rendering MUST be efficient for month navigation

## ---

## Continuing.

## ---

# **SECTION 7 — BACKEND ARCHITECTURE & API SPECIFICATION (NORMATIVE)**

## This section defines **backend responsibilities**, **business rule enforcement**, and **the complete API contract**.

## The backend MUST be the **source of truth** for:

* ## Authentication and user identity

* ## Authorization and data isolation

* ## Habit versioning rules (edits effective next Monday)

* ## Weekly target enforcement (no over-completion)

* ## Today-only mutation constraints

* ## Canonical error codes

## ---

## **7.1 Backend Technology Options (Two Only)**

### **Option A (Recommended)**

* ## Framework: FastAPI (Python)

* ## Validation: Pydantic

* ## DB access: SQLAlchemy or equivalent ORM

* ## Migrations: Alembic

### **Option B**

* ## Runtime: Node.js (TypeScript)

* ## Framework: Fastify or Express

* ## Validation: Zod

* ## DB access: Prisma or equivalent ORM

* ## Migrations: Prisma Migrate

## **Swap Cost:** Low–Moderate (API contract MUST remain identical; only implementation changes.)

## ---

## **7.2 Authentication & Authorization (Backend)**

### **7.2.1 Identity**

* ## The backend MUST identify the user via:

  * ## Session cookie (Auth.js), OR

  * ## Verified ID token (Firebase Auth)

* ## The backend MUST map external identity to internal `users.id`.

### **7.2.2 Authorization**

## For every request operating on user-owned resources:

* ## The backend MUST derive `user_id` from auth context.

* ## The backend MUST ensure all accessed rows belong to this `user_id`.

* ## The backend MUST NOT accept `user_id` from request payloads.

### **7.2.3 Responses for Unauthorized Access**

* ## Unauthenticated: MUST return `401 UNAUTHORIZED`

* ## Authenticated but forbidden: MUST return `403 FORBIDDEN` (or `404` if deliberately hiding existence, but MUST be consistent)

## ---

## **7.3 Time Semantics (Backend)**

## Because “today” is browser-local, the backend MUST implement “today” checks in one of the following ways (two options).

### **Option A (Recommended): Client provides date, backend validates it safely**

* ## Client sends `date=YYYY-MM-DD` for completion create

* ## Backend MUST validate:

  * ## `date` equals client-local today **as claimed**

  * ## AND the request includes a trustworthy “local today” signal

## To make this safe, backend MUST also require:

* ## Client sends `client_tz_offset_minutes` OR `client_timezone_iana`

* ## Backend computes server-side:

  * ## `server_view_of_client_today` using offset/timezone

* ## Backend accepts only if:

  * ## `date == server_view_of_client_today`

### **Option B: Backend stores user timezone on login and uses it**

* ## On login, backend stores user timezone string sent by client (e.g., `Europe/Stockholm`)

* ## Backend uses stored timezone for “today” checks

* ## Client still sends date, backend validates against stored tz

## **Recommendation:** Option A is simplest without long-lived tz storage.

## **Mandatory requirement (both options):**

* ## Backend MUST reject completion creation if date is not “today” per chosen validation rule.

## ---

## **7.4 Data Access Rules (Backend)**

### **7.4.1 Active Habit Version Resolution**

## For any given habit and week start (Monday date `week_start`):

## The backend MUST select the active version as:

* ## The habit\_version row with the greatest `effective_week_start` such that:

  * ## `effective_week_start <= week_start`

## If none exists, backend MUST treat this as data corruption and return a server error for affected operations.

### **7.4.2 Week Range**

## Given any date `d`, backend MUST compute:

* ## `week_start = Monday of d’s week`

* ## `week_end = Sunday of d’s week`

## All weekly queries MUST use these computed values.

## ---

## **7.5 API Conventions**

### **7.5.1 Base Requirements**

* ## All API responses MUST be JSON.

* ## All API requests and responses MUST be UTF-8.

* ## All endpoints (except `/api/health`) MUST require authentication.

### **7.5.2 Error Response Shape**

## On error, backend MUST return:

```json
{
  "errorCode": "STRING_CODE",
  "message": "Human-readable message"
}
```

## The backend MUST NOT return stack traces to clients.

### **7.5.3 Canonical Error Codes**

## The backend MUST use these codes (exact strings):

* ## `UNAUTHORIZED`

* ## `FORBIDDEN`

* ## `VALIDATION_ERROR`

* ## `INVALID_DATE`

* ## `PAST_DATE_READONLY`

* ## `HABIT_NOT_FOUND`

* ## `HABIT_DELETED`

* ## `HABIT_NOT_ACTIVE_FOR_WEEK`

* ## `WEEKLY_TARGET_ALREADY_MET`

* ## `TEXT_REQUIRED`

* ## `COMPLETION_NOT_FOUND`

* ## `COMPLETION_NOT_TODAY`

* ## `GOAL_NOT_FOUND`

* ## `GOAL_DELETED`

* ## `INTERNAL_ERROR`

## ---

## **7.6 API Endpoints (Complete)**

### **7.6.1 Health Check**

#### **`GET /api/health`**

* ## Auth: NOT required

* ## Response 200:

```json
{ "status": "ok" }
```

## ---

### **7.6.2 Current User**

#### **`GET /api/me`**

* ## Auth: required

* ## Response 200:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "googleUserId": "string",
  "createdAt": "ISO",
  "updatedAt": "ISO"
}
```

## ---

## **7.6.3 Goals**

#### **`GET /api/goals`**

* ## Auth: required

* ## Returns only `is_deleted=false` goals

* ## Response 200:

```json
[
  {
    "id": "uuid",
    "title": "string",
    "year": 2026,
    "description": "string|null",
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }
]
```

#### **`POST /api/goals`**

## Request:

```json
{
  "title": "string",
  "year": 2026,
  "description": "string|null"
}
```

## Validation:

* ## title MUST be non-empty, max length 120 recommended

* ## year MUST be reasonable (e.g., 2000–2100)

## Response 201:

```json
{ "id": "uuid" }
```

#### **`PUT /api/goals/{goalId}`**

## Request:

```json
{
  "title": "string",
  "year": 2026,
  "description": "string|null"
}
```

## Rules:

* ## Must belong to user

* ## Must not be deleted

## Response 200:

```json
{ "ok": true }
```

## Errors:

* ## If not found: `GOAL_NOT_FOUND`

* ## If deleted: `GOAL_DELETED`

#### **`DELETE /api/goals/{goalId}`**

## Rules:

* ## Soft delete goal

* ## Habits MUST NOT be deleted

* ## Future habit versions MUST NOT link to deleted goals (enforced on create/edit)

## Response 200:

```json
{ "ok": true }
```

## ---

## **7.6.4 Habits and Habit Versions**

### **Data Model Returned to Client**

## Backend MUST return habits along with version data sufficient for the client to:

* ## render current week correctly

* ## show edit fields

## Two API shapes are permitted; pick one and be consistent.

#### **Shape A (Recommended): Return habits \+ all versions**

## Pros: simplest, fewer endpoints. Cons: more payload.

#### **Shape B: Return habits \+ “current version for a given week\_start”**

## Pros: smaller payload. Cons: needs parameterization.

## For v1, use Shape A unless payload becomes an issue.

## ---

#### **`GET /api/habits`**

* ## Auth: required

* ## Returns only `is_deleted=false` habits

## Response 200 (Shape A):

```json
[
  {
    "id": "uuid",
    "name": "Gym",
    "orderIndex": 0,
    "linkedGoalId": "uuid|null",
    "isDeleted": false,
    "createdAt": "ISO",
    "updatedAt": "ISO",
    "versions": [
      {
        "id": "uuid",
        "weeklyTarget": 4,
        "requiresTextOnCompletion": false,
        "linkedGoalId": "uuid|null",
        "effectiveWeekStart": "YYYY-MM-DD",
        "createdAt": "ISO",
        "updatedAt": "ISO"
      }
    ]
  }
]
```

## ---

#### **`POST /api/habits`**

## Request:

```json
{
  "name": "string",
  "weeklyTarget": 4,
  "requiresTextOnCompletion": false,
  "linkedGoalId": "uuid|null",
  "orderIndex": 0,
  "clientTimezone": "IANA|string|null",
  "clientTzOffsetMinutes": 60
}
```

## Validation:

* ## name MUST be non-empty, max 80 chars recommended

* ## weeklyTarget MUST be integer \>= 1

* ## If linkedGoalId provided, goal MUST exist and not be deleted

## Rule:

* ## The created habit MUST become effective immediately:

  * ## Backend MUST create initial habit\_version with:

    * ## `effective_week_start = current week Monday` (computed using client timezone semantics per 7.3)

## Response 201:

```json
{ "id": "uuid" }
```

## Errors:

* ## invalid goal: `GOAL_NOT_FOUND` or `GOAL_DELETED`

* ## validation: `VALIDATION_ERROR`

## ---

#### **`PUT /api/habits/{habitId}`**

## Request:

```json
{
  "name": "string",
  "weeklyTarget": 5,
  "requiresTextOnCompletion": true,
  "linkedGoalId": "uuid|null",
  "orderIndex": 0,
  "clientTimezone": "IANA|string|null",
  "clientTzOffsetMinutes": 60
}
```

## Rules:

* ## Habit MUST belong to user and not be deleted

* ## Backend MUST:

  * ## Update the base habit fields (name, orderIndex) immediately

  * ## Create a new habit\_version effective next Monday:

    * ## `effective_week_start = next Monday` (computed using client timezone semantics)

## Important:

* ## Backend MUST NOT modify existing habit\_versions.

* ## Current week calculations MUST continue to use prior version.

## Response 200:

```json
{ "ok": true }
```

## Errors:

* ## `HABIT_NOT_FOUND`

* ## `HABIT_DELETED`

* ## `GOAL_NOT_FOUND` / `GOAL_DELETED`

* ## `VALIDATION_ERROR`

## ---

#### **`DELETE /api/habits/{habitId}`**

## Rules:

* ## Soft delete habit (`is_deleted=true`)

* ## MUST preserve habit\_versions and habit\_completions

## Response 200:

```json
{ "ok": true }
```

## Errors:

* ## `HABIT_NOT_FOUND`

## ---

## **7.6.5 Completions (Instances)**

#### **`GET /api/completions`**

## Query params:

* ## `start=YYYY-MM-DD`

* ## `end=YYYY-MM-DD` (inclusive or exclusive, choose one and document; recommended inclusive)

## Rules:

* ## Must return all completion instances in range for user

* ## Must not return deleted-user data (not applicable) or other users’ data

## Response 200:

```json
[
  {
    "id": "uuid",
    "habitId": "uuid",
    "date": "YYYY-MM-DD",
    "text": "string|null",
    "createdAt": "ISO",
    "updatedAt": "ISO"
  }
]
```

## Validation:

* ## start and end MUST be valid dates

* ## start MUST be \<= end

## Errors:

* ## `VALIDATION_ERROR`

## ---

#### **`POST /api/completions`**

## Request:

```json
{
  "habitId": "uuid",
  "date": "YYYY-MM-DD",
  "text": "string|null",
  "clientTimezone": "IANA|string|null",
  "clientTzOffsetMinutes": 60
}
```

## Hard Rules (all MUST be enforced):

1. ## Habit MUST exist, belong to user, and not be deleted

2. ## `date` MUST equal local “today” (per Section 7.3)

3. ## Habit MUST be active for the week containing `date`

4. ## Weekly target MUST NOT already be met for that week

5. ## If active habit\_version requires text:

   * ## `text` MUST be non-empty after trimming whitespace

## Week and version determination:

* ## backend MUST compute:

  * ## `week_start` and `week_end` for `date`

  * ## active habit\_version for `week_start`

## Target enforcement:

* ## backend MUST compute:

  * ## `completed_this_week = count(instances for habit within week range)`

* ## backend MUST reject if:

  * ## `completed_this_week >= weekly_target`

## Response 201:

```json
{ "id": "uuid" }
```

## Errors:

* ## `HABIT_NOT_FOUND`

* ## `HABIT_DELETED`

* ## `INVALID_DATE`

* ## `HABIT_NOT_ACTIVE_FOR_WEEK`

* ## `WEEKLY_TARGET_ALREADY_MET`

* ## `TEXT_REQUIRED`

* ## `VALIDATION_ERROR`

## ---

#### **`DELETE /api/completions/{completionId}`**

## Rules:

* ## Completion MUST exist and belong to user

* ## Completion date MUST be today (per Section 7.3)

* ## Deletion MUST remove exactly that instance

## Response 200:

```json
{ "ok": true }
```

## Errors:

* ## `COMPLETION_NOT_FOUND`

* ## `COMPLETION_NOT_TODAY`

* ## `FORBIDDEN`

## ---

## **7.7 Backend Business Logic Requirements (Non-Endpoint)**

### **7.7.1 Idempotency (Optional)**

## The backend MAY support idempotency keys for completion creation to avoid duplicates due to retries.

## If implemented:

* ## Client sends `Idempotency-Key` header

* ## Backend MUST ensure same key yields same completion result within a time window

## This is optional in v1.

## ---

## **7.8 Rate Limiting (Backend)**

## The backend SHOULD apply rate limits to mutation endpoints:

* ## completions create/delete

* ## habits create/edit/delete

* ## goals create/edit/delete

## Rate limits MUST be per-user.

## ---

## **7.9 Security Requirements (Backend)**

* ## Backend MUST validate all inputs

* ## Backend MUST escape or safely store text; rendering safety is frontend’s responsibility, but backend MUST NOT treat notes as HTML

* ## Backend MUST not log secrets or tokens

* ## Backend MUST provide structured logs for debugging (method, route, status, duration)

## ---

## Continuing.

## ---

# **SECTION 8 — DATABASE SCHEMA & INDEXES (NORMATIVE)**

## This section defines the **authoritative persistence model**. Implementations MAY vary, but the schema semantics MUST be preserved.

## The database MUST support:

* ## Per-user data isolation

* ## Habit versioning by effective week start

* ## Instance-based completions (multiple per day allowed)

* ## Soft deletes for habits and goals

* ## Efficient week and month queries for progress rendering

## ---

## **8.1 Database Options (Two Only)**

### **Option A (Recommended): PostgreSQL**

* ## PostgreSQL SHOULD be used for production if any multi-user usage is expected.

* ## PostgreSQL MUST enforce foreign keys and constraints.

* ## Migrations MUST be applied transactionally.

### **Option B: SQLite**

* ## SQLite MAY be used for MVP/single-instance deployments.

* ## SQLite MUST have foreign keys enabled (`PRAGMA foreign_keys = ON`).

* ## SQLite constraints SHOULD be enforced in application code where SQLite limitations apply.

## **Swap Cost:** Low–Moderate (Table shapes remain the same; connection strings, some constraint enforcement, and indexing strategy differ.)

## ---

## **8.2 Common Type Conventions**

### **8.2.1 Primary Keys**

* ## All primary keys MUST be UUIDs.

* ## If the DB driver does not support native UUID (e.g., SQLite), UUIDs MUST be stored as TEXT.

### **8.2.2 Timestamps**

* ## `created_at` and `updated_at` MUST be stored for all tables.

* ## Timestamps SHOULD be stored in UTC as instants (ISO timestamps), even though “date” fields represent local days.

### **8.2.3 Local Date Storage**

* ## The completion `date` and habit\_version `effective_week_start` MUST be stored as `YYYY-MM-DD`.

* ## In Postgres, these SHOULD be stored as `DATE`.

* ## In SQLite, these SHOULD be stored as `TEXT` with enforced format in code.

## ---

## **8.3 Tables (Authoritative)**

### **8.3.1 `users`**

## Stores the mapping between Google identity and internal user ID.

| Column | Type (Postgres) | Type (SQLite) | Constraints |
| ----- | ----- | ----- | ----- |
| id | UUID | TEXT | PK |
| google\_user\_id | TEXT | TEXT | UNIQUE, NOT NULL |
| email | TEXT | TEXT | NOT NULL |
| created\_at | TIMESTAMP | TEXT | NOT NULL |
| updated\_at | TIMESTAMP | TEXT | NOT NULL |

## Normative rules:

* ## `google_user_id` MUST be unique across all users.

* ## Email SHOULD be stored for display/debug; it MUST NOT be used as a primary identity key.

## ---

### **8.3.2 `goals`**

## Annual goals owned by a user.

| Column | Type (Postgres) | Type (SQLite) | Constraints |
| ----- | ----- | ----- | ----- |
| id | UUID | TEXT | PK |
| user\_id | UUID | TEXT | FK users(id), NOT NULL |
| title | TEXT | TEXT | NOT NULL |
| year | INTEGER | INTEGER | NOT NULL |
| description | TEXT | TEXT | NULL |
| is\_deleted | BOOLEAN | INTEGER | NOT NULL DEFAULT false |
| created\_at | TIMESTAMP | TEXT | NOT NULL |
| updated\_at | TIMESTAMP | TEXT | NOT NULL |

## Normative rules:

* ## Soft deletion MUST be implemented via `is_deleted`.

* ## Deleted goals MUST NOT be returned by default in `GET /api/goals`.

## ---

### **8.3.3 `habits`**

## Base habit record (stable identity \+ ordering \+ deletion). Behavior-changing properties live in versions.

| Column | Type (Postgres) | Type (SQLite) | Constraints |
| ----- | ----- | ----- | ----- |
| id | UUID | TEXT | PK |
| user\_id | UUID | TEXT | FK users(id), NOT NULL |
| name | TEXT | TEXT | NOT NULL |
| order\_index | INTEGER | INTEGER | NOT NULL DEFAULT 0 |
| is\_deleted | BOOLEAN | INTEGER | NOT NULL DEFAULT false |
| created\_at | TIMESTAMP | TEXT | NOT NULL |
| updated\_at | TIMESTAMP | TEXT | NOT NULL |

## Normative rules:

* ## `habits.name` MUST be non-empty.

* ## `is_deleted=true` MUST remove habit from forward-looking UI and calculations.

## ---

### **8.3.4 `habit_versions`**

## Immutable versions that apply from a given Monday onward.

| Column | Type (Postgres) | Type (SQLite) | Constraints |
| ----- | ----- | ----- | ----- |
| id | UUID | TEXT | PK |
| habit\_id | UUID | TEXT | FK habits(id), NOT NULL |
| weekly\_target | INTEGER | INTEGER | NOT NULL |
| requires\_text\_on\_completion | BOOLEAN | INTEGER | NOT NULL DEFAULT false |
| linked\_goal\_id | UUID | TEXT | FK goals(id), NULL |
| effective\_week\_start | DATE | TEXT | NOT NULL |
| created\_at | TIMESTAMP | TEXT | NOT NULL |
| updated\_at | TIMESTAMP | TEXT | NOT NULL |

## Normative rules:

* ## `weekly_target` MUST be ≥ 1\.

* ## `effective_week_start` MUST be a Monday.

  * ## In Postgres, this SHOULD be enforced via constraint if feasible; otherwise MUST be enforced in application code.

* ## Habit edits MUST create new rows here; existing rows MUST NOT be mutated.

* ## Linked goals:

  * ## `linked_goal_id` MAY reference a goal that is later deleted (historical record).

  * ## Backend MUST prevent creating new versions linking to deleted goals.

## ---

### **8.3.5 `habit_completions`**

## Instance-based completions. Multiple per habit per date are allowed.

| Column | Type (Postgres) | Type (SQLite) | Constraints |
| ----- | ----- | ----- | ----- |
| id | UUID | TEXT | PK |
| user\_id | UUID | TEXT | FK users(id), NOT NULL |
| habit\_id | UUID | TEXT | FK habits(id), NOT NULL |
| date | DATE | TEXT | NOT NULL |
| text | TEXT | TEXT | NULL |
| created\_at | TIMESTAMP | TEXT | NOT NULL |
| updated\_at | TIMESTAMP | TEXT | NOT NULL |

## Normative rules:

* ## The schema MUST NOT enforce a uniqueness constraint on `(habit_id, date)`.

* ## The schema MUST permit multiple rows for same habit and date.

* ## The backend MUST enforce “today-only deletion” and “no over-completion” rules; the DB alone MUST NOT be relied upon for those.

## ---

## **8.4 Constraints (Normative)**

### **8.4.1 Foreign Keys**

* ## Foreign keys MUST be enabled and enforced.

* ## On delete behavior:

  * ## The DB MUST NOT cascade deletes (because soft delete is used).

  * ## If a FK row is removed (should not happen), behavior is undefined; application SHOULD prevent hard deletes in v1.

### **8.4.2 Check Constraints**

## Postgres (Option A):

* ## The DB SHOULD enforce:

  * ## `weekly_target >= 1`

  * ## `year` reasonable range (optional)     SQLite (Option B):

* ## The application MUST enforce these constraints.

### **8.4.3 Soft Delete Rules**

* ## Soft delete flags MUST default to false.

* ## All “list” endpoints MUST exclude soft deleted records by default.

## ---

## **8.5 Indexes (Required)**

## Indexes MUST support:

* ## Fetching habits for a user

* ## Resolving active habit versions quickly

* ## Fetching completions by user and date range

* ## Aggregating completions by habit over a week/month

### **8.5.1 Required indexes (Both DB options)**

1. ## Habits listing and ordering

* ## Index name: `idx_habits_user_active_order`

* ## Columns: `(user_id, is_deleted, order_index)`

2. ## Habit version resolution by effective week start

* ## Index name: `idx_habit_versions_habit_effective`

* ## Columns: `(habit_id, effective_week_start DESC)`

3. ## Completions by user and date range

* ## Index name: `idx_completions_user_date`

* ## Columns: `(user_id, date)`

4. ## Completions by habit and date

* ## Index name: `idx_completions_habit_date`

* ## Columns: `(habit_id, date)`

### **8.5.2 Postgres optimization (Option A)**

* ## The DB MAY add a partial index for non-deleted habits:

  * ## WHERE `is_deleted = false`

* ## The DB MAY add composite index:

  * ## `(user_id, date, habit_id)` to speed grouped week aggregation.

## SQLite (Option B):

* ## Avoid too many indexes; keep required set above.

## ---

## **8.6 Canonical Queries (Backend MUST support)**

## These queries define the operational workload.

### **8.6.1 Fetch all active habits for user**

* ## Filter: `user_id = ? AND is_deleted = false`

* ## Sort: `order_index ASC`

### **8.6.2 Resolve active habit version for a week start**

## Given `habit_id` and `week_start`:

* ## Select habit\_versions where:

  * ## `habit_id = ?`

  * ## `effective_week_start <= week_start`

* ## Order by `effective_week_start DESC`

* ## Take first row

### **8.6.3 Count completed instances for a habit in a week**

## Given `habit_id`, `user_id`, `week_start`, `week_end`:

* ## Count completions where:

  * ## `user_id = ?`

  * ## `habit_id = ?`

  * ## `date BETWEEN week_start AND week_end`

### **8.6.4 Fetch completions for calendar month view**

## Given `user_id`, `range_start`, `range_end`:

* ## Fetch all completions where:

  * ## `user_id = ?`

  * ## `date BETWEEN range_start AND range_end`

## ---

## **8.7 Migration Requirements**

### **8.7.1 General**

* ## All schema changes MUST be applied via migrations.

* ## Manual DB edits MUST NOT be performed in production.

* ## Migration tooling MUST be consistent with backend option:

  * ## Option A: Alembic

  * ## Option B: Prisma Migrate (or equivalent)

### **8.7.2 Migration Safety**

* ## Migrations MUST be backwards compatible where possible.

* ## If a breaking migration is required:

  * ## A maintenance window strategy MUST be documented.

### **8.7.3 SQLite Caveats (Option B)**

* ## SQLite has limitations around altering columns.

* ## For complex changes, migration MAY require:

  * ## Create new table → copy data → swap tables.

* ## This MUST be documented in the migration.

## ---

## **8.8 Data Retention & Backups (DB-level)**

* ## The DB MUST support restoration from backups (see deployment section later).

* ## Soft-deleted records MUST remain in DB unless a future “hard delete my account” feature is added.

## ---

## **CHECKPOINT ✅**

## Section 8 is complete: full schema, constraints, and indexes.

## Continuing.

## ---

# **SECTION 9 — DEPLOYMENT, CONFIGURATION, AND OPERATIONS (NORMATIVE)**

## This section defines **how the system MUST be deployed, configured, and operated** in production. The goal is **zero-budget, production-safe deployment** with minimal operational burden.

## ---

## **9.1 Deployment Models (Two Only)**

### **9.1.1 Option A (Recommended): Single Full-Stack Deployment**

## **Description**

* ## One deployed service hosts:

  * ## Frontend application

  * ## Backend API

* ## One database instance (Postgres or SQLite)

## **Normative Requirements**

* ## Frontend and backend MUST share the same origin.

* ## API routes MUST be mounted under `/api/*`.

* ## No CORS configuration SHOULD be required.

## **Benefits**

* ## Lowest operational complexity

* ## Fewer environment variables

* ## Easier debugging for junior developers

## ---

### **9.1.2 Option B: Split Deployment (Frontend \+ Backend)**

## **Description**

* ## Frontend deployed separately (CDN or static hosting)

* ## Backend API deployed separately

* ## Database deployed separately

## **Normative Requirements**

* ## Backend MUST explicitly configure CORS.

* ## Frontend MUST use a configurable API base URL.

* ## OAuth redirect URIs MUST be configured correctly for both origins.

## **Tradeoff**

* ## Higher operational complexity

* ## More failure modes

## ---

### **Swap Cost**

* ## **Moderate**

* ## Mostly configuration and OAuth callback changes

* ## Application logic remains unchanged

## ---

## **9.2 Environment Configuration (Authoritative)**

## All configuration MUST be done via environment variables. No secrets MAY be committed to source control.

## ---

### **9.2.1 Common Environment Variables (Required)**

| Variable | Description |
| ----- | ----- |
| `APP_ENV` | `local` or `production` |
| `APP_BASE_URL` | Public URL of the app |
| `DATABASE_URL` | DB connection string or SQLite file path |
| `AUTH_SECRET` | Random secret for session/token signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

## ---

### **9.2.2 Frontend-Specific (Option B only)**

| Variable | Description |
| ----- | ----- |
| `API_BASE_URL` | Base URL for backend API |

## ---

### **9.2.3 Backend-Specific (Optional but Recommended)**

| Variable | Description |
| ----- | ----- |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` |
| `RATE_LIMIT_ENABLED` | Feature flag |
| `MAX_REQUESTS_PER_MINUTE` | Per-user rate limit |

## ---

## **9.3 Local Development Setup (Normative)**

## The repository MUST include a `README.md` with copy-pasteable steps.

## ---

### **9.3.1 Option A (Recommended)**

## Local development MUST support:

* ## Local frontend \+ backend

* ## Local database (Docker or file)

## Example flow:

1. ## `docker compose up -d` (database)

2. ## `npm install`

3. ## `npm run dev`

## ---

### **9.3.2 Option B**

## Local development MAY use:

* ## Fully containerized setup

* ## `docker compose up --build`

## Tradeoff:

* ## Slower iteration

* ## More moving parts

## ---

## **9.4 Build & Release Process**

### **9.4.1 Build Requirements**

* ## Builds MUST be reproducible.

* ## Type checking MUST pass.

* ## Linting SHOULD pass (warnings acceptable, errors not).

## ---

### **9.4.2 Deployment Requirements**

* ## Migrations MUST run automatically on deploy.

* ## Application MUST fail fast if migrations fail.

* ## Deployments SHOULD be atomic where possible.

## ---

## **9.5 HTTPS and Security (Deployment)**

* ## Production deployments MUST use HTTPS.

* ## OAuth callbacks MUST use HTTPS.

* ## Cookies MUST be:

  * ## `Secure`

  * ## `HttpOnly`

  * ## Correct `SameSite` setting

## ---

## **9.6 Logging (Operational Requirements)**

### **9.6.1 Backend Logging**

## The backend MUST log:

* ## Request method

* ## Path

* ## Status code

* ## Duration

* ## User identifier (hashed or internal ID)

## The backend MUST log errors with stack traces server-side only.

## ---

### **9.6.2 Frontend Logging**

* ## Frontend MAY log errors to console.

* ## Frontend MUST NOT log secrets or tokens.

## ---

## **9.7 Monitoring & Health**

### **9.7.1 Health Endpoint**

## The backend MUST expose:

* ## `GET /api/health`

* ## Response:

```json
{ "status": "ok" }
```

## ---

### **9.7.2 Monitoring Options**

#### **Option A (Recommended)**

* ## Platform-provided logs

* ## Simple uptime check (ping `/api/health`)

#### **Option B**

* ## Structured JSON logs

* ## Alerts on 5xx error spikes

## ---

## **9.8 Backups & Restore**

### **9.8.1 Backup Strategy (Mandatory)**

#### **Postgres**

* ## Nightly `pg_dump`

* ## Retention:

  * ## 7 daily

  * ## 4 weekly

#### **SQLite**

* ## Nightly file backup

* ## Backup MUST be taken while DB is in a safe state

## ---

### **9.8.2 Restore Procedure**

## The repository MUST document:

* ## Exact commands to restore from backup

* ## How to verify restore success

## This documentation MUST be tested at least once.

## ---

## **9.9 Failure Modes & Recovery**

## The system MUST handle:

* ## DB unavailable → show retryable error

* ## API unavailable → frontend MUST not crash

* ## Partial failures MUST not corrupt data

## Draft text MUST survive frontend reloads even if backend is temporarily unavailable.

## ---

## **CHECKPOINT ✅**

## Section 9 is complete.

## Continuing.

## ---

# **SECTION 10 — TESTING STRATEGY & ACCEPTANCE TEST MATRIX (NORMATIVE)**

## This section defines **how correctness is proven**. The goal of testing in this system is **to prevent silent logical errors**, especially around weeks, dates, and habit versioning.

## Testing MUST prioritize **business rule correctness** over visual fidelity.

## ---

## **10.1 Testing Strategy Options (Two Only)**

### **10.1.1 Option A (Recommended): Layered Testing**

## The system MUST implement:

1. ## **Unit tests** for pure logic

2. ## **Integration tests** for API behavior

3. ## **Minimal end-to-end (E2E) tests** for core user flows

## This option provides the highest confidence with the lowest maintenance cost.

## ---

### **10.1.2 Option B: E2E-Heavy Testing**

## The system MAY choose to:

* ## Rely primarily on browser-based E2E tests

* ## Minimize unit testing

## **Tradeoff**

* ## Slower test execution

* ## Higher flakiness

* ## Harder to debug failures

## ---

## **10.2 Test Tooling (Informative, Not Prescriptive)**

## Depending on tech choice:

* ## Frontend unit/component tests:

  * ## Vitest or Jest

  * ## React Testing Library

* ## Backend tests:

  * ## pytest (FastAPI)

  * ## Jest/Vitest \+ supertest (Node)

* ## E2E:

  * ## Playwright (recommended)

## Tool choice MAY vary, but test coverage MUST satisfy the cases below.

## ---

## **10.3 Mandatory Unit Test Coverage**

## The following logic MUST be covered by unit tests.

## ---

### **10.3.1 Date & Week Computation**

## Tests MUST verify:

* ## Monday is correctly computed as week start

* ## Sunday is correctly computed as week end

* ## Week boundaries work across:

  * ## Month boundaries

  * ## Year boundaries

* ## “Today” detection respects user-local timezone semantics

## **Example acceptance cases**

* ## Given a date on Sunday, week\_start MUST be the preceding Monday

* ## Given Dec 31 on a Wednesday, week\_start MUST be that week’s Monday in the same year (unless calendar dictates otherwise)

## ---

### **10.3.2 Habit Version Resolution**

## Tests MUST verify:

* ## Correct version is selected when multiple versions exist

* ## Edits effective next Monday do not affect current week

* ## Versions apply correctly across week boundaries

## **Example acceptance cases**

* ## Given version A effective Jan 1 (Monday) and version B effective Jan 8 (Monday):

  * ## A MUST apply to Jan 1–7

  * ## B MUST apply from Jan 8 onward

## ---

### **10.3.3 Remaining Instance Calculation**

## Tests MUST verify:

* ## Remaining instances are computed correctly

* ## No negative remaining values are rendered

* ## Sunday renders all remaining instances

## **Example acceptance cases**

* ## Weekly target \= 4, completed \= 2, Sunday → render 2 instances

* ## Weekly target \= 4, completed \= 4 → render 0 instances

## ---

## **10.4 Mandatory API Integration Tests**

## Integration tests MUST be run against a real database (test DB).

## ---

### **10.4.1 Authentication & Authorization**

## Tests MUST verify:

* ## Unauthenticated requests are rejected

* ## Authenticated users cannot access other users’ data

## ---

### **10.4.2 Completion Creation Rules**

## Tests MUST verify:

* ## Creating a completion for a past date fails

* ## Creating a completion beyond weekly target fails

* ## Creating a completion without required text fails

* ## Creating multiple instances on Sunday succeeds up to weekly target

## ---

### **10.4.3 Completion Deletion Rules**

## Tests MUST verify:

* ## Deleting today’s completion succeeds

* ## Deleting a past-day completion fails

* ## Deleting one instance does not delete others

## ---

### **10.4.4 Habit Versioning Rules**

## Tests MUST verify:

* ## Editing a habit mid-week does not change current week behavior

* ## New version applies starting next Monday

* ## Deleting a habit hides it from future views but preserves historical data

## ---

## **10.5 Mandatory End-to-End (E2E) Scenarios**

## At minimum, the following flows MUST be covered by E2E tests.

## ---

### **10.5.1 Core Happy Path**

1. ## User logs in

2. ## User creates a habit with weekly target

3. ## Habit appears on Daily view

4. ## User completes habit

5. ## Completion appears under Completed

6. ## Weekly progress updates correctly

## ---

### **10.5.2 Sunday Catch-Up Flow**

1. ## Habit weekly target \= 4

2. ## User completes habit twice earlier in week

3. ## On Sunday:

   * ## Two remaining instances appear

4. ## User completes both

5. ## Weekly target is met

6. ## Habit disappears from Daily view

## ---

### **10.5.3 Past Day Read-Only Flow**

1. ## User completes habit on Monday

2. ## User navigates to Monday via calendar

3. ## Completed instance is shown

4. ## Checkbox is disabled

5. ## No remaining section is visible

## ---

### **10.5.4 Habit Edit Versioning Flow**

1. ## User creates habit weekly target \= 3

2. ## User edits habit mid-week to weekly target \= 5

3. ## Current week still enforces target \= 3

4. ## Next Monday enforces target \= 5

## ---

## **10.6 Acceptance Test Matrix (Summary)**

## The system MUST pass tests validating:

* ## Weekly boundaries (Mon–Sun)

* ## No over-completion

* ## Sunday multi-instance rendering

* ## Today-only undo

* ## Past-day immutability

* ## Versioned habit edits

* ## Correct progress percentages

* ## Correct calendar coloring

## Any failure in these areas is considered **release-blocking**.

## ---

## Continuing. This is the **final content section**.

## ---

# **SECTION 11 — RELEASE CRITERIA & FINAL DEFINITION OF DONE (NORMATIVE)**

## This section defines **when the system is considered complete**, **safe for real users**, and **ready for handoff**.

## No additional features, refactors, or polish are required beyond what is specified here.

## ---

## **11.1 Release Readiness Criteria (Hard Requirements)**

## The system MUST meet **all** of the following criteria before it is considered ready for production use.

## ---

### **11.1.1 Functional Correctness**

## The system MUST satisfy all rules defined in Sections 1–10, including but not limited to:

* ## Weekly boundaries are correctly enforced (Monday–Sunday)

* ## Weekly targets are enforced without over-completion

* ## Sunday catch-up behavior works correctly

* ## Habit edits apply only from the next Monday

* ## Past days are strictly read-only

* ## Completion instances are created and deleted only when allowed

* ## Progress percentages and calendar coloring are correct

* ## Habits, goals, and completions are isolated per user

## Any deviation from these rules is **release-blocking**.

## ---

### **11.1.2 UX Completeness**

## The UI MUST:

* ## Provide a usable Daily flow for today

* ## Provide a read-only Daily view for past dates

* ## Allow creation, editing, and deletion of habits and goals

* ## Display weekly progress and monthly calendar views

* ## Provide clear loading, empty, and error states

* ## Be usable on both desktop and mobile

* ## Be keyboard-accessible for all core flows

## Visual polish MAY vary, but **behavior and affordances MUST be correct**.

## ---

### **11.1.3 Authentication & Security**

## The system MUST:

* ## Require authentication for all user data

* ## Prevent cross-user data access

* ## Use HTTPS in production

* ## Store secrets only in environment variables

* ## Reject invalid or malicious input

* ## Enforce today-only mutation rules server-side

## Any auth or authorization bypass is **release-blocking**.

## ---

### **11.1.4 Data Safety**

## The system MUST:

* ## Use soft deletes for habits and goals

* ## Preserve historical completion data

* ## Run DB migrations cleanly

* ## Have a documented backup and restore process

* ## Successfully restore from backup at least once (manual verification acceptable)

## ---

## **11.2 Testing Completion Criteria**

## The system MUST pass:

* ## All mandatory unit tests defined in Section 10

* ## All mandatory API integration tests

* ## All required E2E scenarios

## Specifically, tests MUST validate:

* ## Date/week logic correctness

* ## Habit version resolution

* ## Remaining instance calculation

* ## Sunday multi-instance behavior

* ## Today-only deletion

* ## Past-day immutability

* ## Progress calculations

## Any failing test in these areas is **release-blocking**.

## ---

## **11.3 Operational Readiness**

## Before release, the following MUST be verified:

* ## Production environment variables are correctly configured

* ## OAuth redirect URLs are correct for production domain

* ## Database persists across restarts

* ## Application starts cleanly from a fresh deploy

* ## `/api/health` returns `200 OK`

* ## Logs are accessible for debugging

* ## Rate limiting (if enabled) behaves reasonably

## ---

## **11.4 Explicitly Accepted Limitations (v1)**

## The following limitations are explicitly accepted for v1 and MUST NOT block release:

* ## No reminders or notifications

* ## No data export or account deletion UI

* ## No offline support

* ## No advanced analytics

* ## No admin tooling

* ## No cross-device sync for draft text

## These MAY be addressed in future versions.

## ---

## **11.5 Final Definition of Done (Canonical)**

## The system is considered **DONE** when:

1. ## A new user can:

   * ## Log in

   * ## Create habits

   * ## Complete habits across a week

   * ## Catch up on Sunday

   * ## Review progress

2. ## A returning user can:

   * ## View accurate historical data

   * ## Edit habits without affecting past weeks

3. ## The system:

   * ## Never lies about progress

   * ## Never allows invalid completions

   * ## Never mutates past data

   * ## Never leaks data across users

## If all of the above are true, the product is **production-ready**.

## ---

## **END OF SPECIFICATION**

## This document is the **single source of truth** for the system.

## Any implementation that violates this specification is considered incorrect.

## ---

## 

## 

## 

## 

