# Business Requirements Document (BRD)
## Project: Family Finance Management

- **Document Version:** 1.0.0
- **Status:** Approved Baseline
- **Author:** Senior Business Analyst
- **Technology Context:** Angular 22 Single Page Application (Frontend) & ASP.NET Core Web API on .NET 10 (Backend)
- **Primary Language:** English

---

## 1. Introduction

### 1.1 Purpose
This Business Requirements Document (BRD) specifies the functional, non-functional, business rules, architectural responsibility separation, and integration contracts for the **Family Finance Management** frontend application. 

The primary goal of this application is to empower households to plan monthly finances, allocate income systematically across seven predefined budget jars, log daily expenses against allocated jars, and monitor real-time spending progress.

### 1.2 Document Conventions & Definitions
- **Must / Shall:** Indicates an absolute requirement.
- **Should / Recommended:** Indicates a highly recommended behavior.
- **May / Optional:** Indicates an optional feature or preference.
- **VND (Vietnamese Dong):** The official currency of the system. All monetary figures are discrete whole integers (no minor fractional units).
- **Jar:** A designated budgetary compartment representing a specific spending category with a fixed percentage allocation.
- **Monthly Plan:** A specific budgetary entity uniquely bound to a single calendar year and month (`Year`, `Month`).

---

## 2. Project Technology Context & System Architecture

### 2.1 Technology Stack Definition
| Tier | Technology | Key Version / Components | Primary Role & Governance |
|---|---|---|---|
| **Backend** | ASP.NET Core Web API | **.NET 10**, Entity Framework Core, SQLite | Authoritative backend service, persistent storage, financial calculation engine, business rule enforcement. |
| **Frontend** | Angular Single Page Application (SPA) | **Angular 22 (Latest Stable)**, TypeScript (compatible with v22), Angular CLI | Client-side presentation, user interaction handling, reactive state management, client validation, REST API consumption. |
| **Protocol** | RESTful HTTP/JSON | JSON over HTTP/HTTPS, UTF-8 | Decoupled client-server communication using standardized contract DTOs. |

### 2.2 System Architecture & Integration Model
1. **Authoritative Source of Truth:**
   - The ASP.NET Core backend is the **sole authoritative source of truth** for all persistent records, business integrity rules, and financial calculations (such as jar budget allocation and spending summation).
   - The Angular frontend **must not** independently compute or alter financial figures or replace authoritative calculations.
2. **Stateless Presentation & Interaction Layer:**
   - The Angular 22 frontend manages user workflows, client form validations, visual indicators, and error reporting.
   - All financial operations initiate via REST calls, and UI displays reflect backend responses.
3. **Data Representation & Precision:**
   - Monetary values across REST contracts are transmitted as string-encoded integer representations (e.g., `"10000000"`) or 64-bit signed integers to prevent floating-point precision loss. The Angular client preserves this representation without introducing decimal conversions.
4. **API Contract Immutability:**
   - The backend API contracts, endpoints, parameter conventions, and DTO schemas are **frozen**. The frontend must conform strictly to existing endpoints without requiring backend modifications.

---

## 3. Business Objectives

The business objectives of the Family Finance Management system include:
- **BO-1 (Monthly Planning):** Enable families to establish one clear, immutable budget plan per calendar month based on declared net income.
- **BO-2 (Systematic Income Allocation):** Automatically distribute total monthly income across seven predefined jars according to proven financial allocation principles, ensuring 100% distribution with zero rounding loss.
- **BO-3 (Expense Attribution & Tracking):** Provide a frictionless way to record daily expenditures, categorize them into designated jars, and keep an accurate account of spending.
- **BO-4 (Spending & Budget Monitoring):** Provide real-time visibility into jar budgets, amounts consumed, remaining balances, and budget utilization rates to prevent overspending.

---

## 4. Actors and User Roles

- **Household Finance Manager (Primary User):** The family member responsible for entering monthly household income, viewing budget allocations, logging daily expenditures, and reviewing monthly financial health.
- **Calculation Engine (System Actor):** The backend allocation algorithm and database transaction manager responsible for executing mathematical allocations, checking period uniqueness, and maintaining ledger consistency.

---

## 5. Functional Requirements (With Responsibility Separation)

### 5.1 F1 — Monthly Planning

#### 5.1.1 Objective & User Story
- **Objective:** Allow the user to define a household income plan for a designated calendar year and month.
- **User Story:** *As a Household Finance Manager, I want to select a year and month and submit my total monthly income so that the system establishes a monthly budget plan and initializes my jars.*

#### 5.1.2 Preconditions
- The user has accessed the Monthly Planning view.
- No budget plan exists for the selected `(Year, Month)` combination.

#### 5.1.3 Workflows
- **Main Flow:**
  1. User selects `Year` (1–9999) and `Month` (1–12).
  2. User enters `MonthlyIncomeVnd` (positive integer in VND).
  3. User clicks "Create Plan".
  4. Frontend validates inputs locally and dispatches `POST /api/v1/budget-plans`.
  5. Backend validates, ensures uniqueness, executes jar allocation, persists to SQLite, and returns `201 Created` with full plan details.
  6. Frontend receives plan DTO and navigates user to the allocated jars / spending dashboard view.
- **Alternative Flow (Duplicate Plan):**
  - If a plan already exists for that month, backend responds with `409 Conflict` (`MONTHLY_PLAN_ALREADY_EXISTS`).
  - Frontend displays an actionable error message informing the user that a plan already exists and directs them to view the existing plan.
- **Alternative Flow (Validation Failure):**
  - If income is missing, non-numeric, or `<= 0`, frontend flags the field before submission.
  - If an invalid payload reaches backend, backend responds with `400 Bad Request` (`VALIDATION_ERROR`). Frontend displays field-level errors.

#### 5.1.4 Responsibility Breakdown
- **Frontend Responsibilities:**
  - Provide intuitive year/month selectors and numeric income input field.
  - Apply client-side validation (positive integer format, required fields).
  - Dispatch HTTP `POST` to `/api/v1/budget-plans`.
  - Handle HTTP `201`, `400`, `409`, and generic network errors gracefully.
- **Backend Responsibilities:**
  - Verify `Year` in `[1, 9999]` and `Month` in `[1, 12]`.
  - Validate `MonthlyIncomeVnd` parses to positive signed 64-bit integer (`long > 0`).
  - Enforce database uniqueness constraint on `(Year, Month)`.
  - Run Hare-Niemeyer allocation across 7 default jars.
  - Return created budget plan resource.

#### 5.1.5 API Dependencies
- **Endpoint:** `POST /api/v1/budget-plans`
- **Request Body:** `CreateBudgetPlanRequest` (`{ year: number, month: number, monthlyIncomeVnd: string }`)
- **Success Response:** `201 Created` -> `BudgetPlanResponse`
- **Failure Responses:** `400 Bad Request` (`ApiErrorResponse`), `409 Conflict` (`ApiErrorResponse`)

---

### 5.2 F2 — Income Allocation

#### 5.2.1 Objective & User Story
- **Objective:** Provide the breakdown of allocated funds across the seven predefined jars based on backend calculations.
- **User Story:** *As a Household Finance Manager, I want to review the exact budget allocated to each of the 7 jars so that I understand how much money is designated for each category.*

#### 5.2.2 Preconditions
- A monthly plan has been created for the selected year and month.

#### 5.2.3 Workflows
- **Main Flow:**
  1. User navigates to view a specific monthly plan or is redirected after plan creation.
  2. Frontend queries `GET /api/v1/budget-plans/{year}/{month}`.
  3. Backend fetches plan, confirms existence, maps allocation data, and returns `200 OK`.
  4. Frontend displays total income and each jar's name, allocation percentage, and allocated VND budget.
- **Alternative Flow (Plan Not Found):**
  - Backend returns `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`).
  - Frontend prompts user with an empty state and a direct link/button to create a plan for that period (F1).

#### 5.2.4 Responsibility Breakdown
- **Frontend Responsibilities:**
  - Trigger plan query on period change.
  - Render the 7 jars with their assigned names, percentages, and budgets.
  - Format monetary numbers using standard VND grouping without modifying underlying values.
- **Backend Responsibilities:**
  - Retrieve the plan record and associated `BudgetAllocations` from the database.
  - Return authoritative jar budget amounts.

#### 5.2.5 API Dependencies
- **Endpoint:** `GET /api/v1/budget-plans/{year}/{month}`
- **Success Response:** `200 OK` -> `BudgetPlanResponse`
- **Failure Responses:** `400 Bad Request` (`ApiErrorResponse`), `404 Not Found` (`ApiErrorResponse`)
- **Catalog Reference:** `GET /api/v1/budget-plans/default-jars` (optional for pre-fetching jar meta/labels)

---

### 5.3 F3 — Add Expense

#### 5.3.1 Objective & User Story
- **Objective:** Record a specific spending transaction, associate it with a designated jar in an existing monthly plan, and update budget figures.
- **User Story:** *As a Household Finance Manager, I want to log an expense with an amount, date, description, and selected jar so that my family's spending is tracked accurately.*

#### 5.3.2 Preconditions
- A monthly plan exists for the month corresponding to the expense date.
- The selected jar belongs to that monthly plan.

#### 5.3.3 Workflows
- **Main Flow:**
  1. User opens the "Add Expense" form.
  2. User inputs `expenseDate` (format: `YYYY-MM-DD`), selects `jarType` from the available 7 jars, inputs `amountVnd` (positive integer), and enters a `description` (1–500 chars).
  3. User submits form.
  4. Frontend validates inputs locally and calls `POST /api/v1/budget-plans/expenses`.
  5. Backend resolves the matching plan by `expenseDate.Year` and `expenseDate.Month`, confirms jar membership, records expense transaction, calculates new jar totals (`spentVnd`, `remainingVnd`), and returns `201 Created`.
  6. Frontend updates spending summaries and notifies user of success.
- **Alternative Flow (No Monthly Plan for Expense Date):**
  - If user selects a date in a month that has no budget plan, backend returns `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`).
  - Frontend informs user that the transaction cannot be saved because no budget plan exists for that month.
- **Alternative Flow (Over-Budget Expense):**
  - If `amountVnd` exceeds the remaining budget of the jar, backend **still saves** the expense (over-budget allowed).
  - Response returns negative `remainingVnd`. Frontend highlights this jar in warning/danger state.

#### 5.3.4 Responsibility Breakdown
- **Frontend Responsibilities:**
  - Render expense form with datepicker, jar dropdown/radio list, amount input, and description textarea.
  - Enforce client-side format checks (valid date string, non-empty jar, positive numeric string, description <= 500 characters).
  - Submit `POST /api/v1/budget-plans/expenses`.
  - Handle response: notify user of success, show updated jar balance, or display backend error codes.
- **Backend Responsibilities:**
  - Parse `expenseDate` (`YYYY-MM-DD`) and look up corresponding `BudgetPlan`.
  - Validate jar validity and association with the plan.
  - Enforce positive `amountVnd` and description length <= 500 characters.
  - Save expense within database transaction.
  - Calculate updated `spentVnd` and `remainingVnd` for that jar and return `CreateExpenseResponse`.

#### 5.3.5 API Dependencies
- **Endpoint:** `POST /api/v1/budget-plans/expenses`
- **Request Body:** `CreateExpenseRequest` (`{ expenseDate: string, jarType: string, amountVnd: string, description: string }`)
- **Success Response:** `201 Created` -> `CreateExpenseResponse` (includes `SavedExpenseResponse` & `ExpenseJarSummaryResponse`)
- **Failure Responses:** `400 Bad Request` (`VALIDATION_ERROR`, `JAR_NOT_IN_MONTHLY_PLAN`), `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`)

---

### 5.4 F4 — Spending by Jar

#### 5.4.1 Objective & User Story
- **Objective:** Provide a comprehensive tracking dashboard of all seven jars for a given month, displaying allocated budget, total spent, remaining balance, and utilization percentage.
- **User Story:** *As a Household Finance Manager, I want to view my monthly spending by jar so that I can see the budget, amount spent, and percentage used for each category in real time.*

#### 5.4.2 Preconditions
- A monthly plan exists for the selected year and month.

#### 5.4.3 Workflows
- **Main Flow:**
  1. User selects a month and navigates to the "Spending by Jar" dashboard.
  2. Frontend sends `GET /api/v1/budget-plans/{year}/{month}/spending-by-jars`.
  3. Backend checks plan existence, sums expenses per jar, calculates percentage used (`spentVnd * 100 / budgetVnd` rounded to 2 decimal places), and returns `200 OK`.
  4. Frontend renders 7 jar progress cards showing:
     - Jar Name & Type
     - Allocated Budget (VND)
     - Total Spent (VND)
     - Percentage Used (`%`)
     - Visual Progress Bar (Color-coded based on thresholds)
- **Alternative Flow (No Plan Exists):**
  - Backend responds with `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`).
  - Frontend renders message: *"Create a monthly plan before viewing spending by jar"* with call to action.

#### 5.4.4 Responsibility Breakdown
- **Frontend Responsibilities:**
  - Query spending API when period changes.
  - Render progress bars and cards for each of the 7 jars.
  - Apply presentation rules (e.g. green for <80%, yellow for 80-99%, red for >=100%).
  - Present authoritative backend metrics (`percentageUsed`, `budgetVnd`, `spentVnd`) without client-side recalculation.
- **Backend Responsibilities:**
  - Verify plan existence for `(Year, Month)`.
  - Aggregate total spent for each jar.
  - Compute accurate percentage used rounded to 2 decimal places.
  - Return `SpendingByJarsResponse`.

#### 5.4.5 API Dependencies
- **Endpoint:** `GET /api/v1/budget-plans/{year}/{month}/spending-by-jars`
- **Success Response:** `200 OK` -> `SpendingByJarsResponse`
- **Failure Responses:** `400 Bad Request` (`VALIDATION_ERROR`), `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`), `500 Internal Server Error` (`INTERNAL_ERROR`)

---

## 6. Business Rules Classification

### 6.1 Core Business Rules (CBR - Backend Enforced)
These rules represent invariant domain logic and integrity constraints enforced authoritatively by the ASP.NET Core backend.

| Rule ID | Rule Description | Enforcing Component | Backend Reference |
|---|---|---|---|
| **CBR-001** | **Positive Monthly Income:** Monthly income must be an integer greater than 0 (`> 0 VND`). | Backend Controller / Validator | `BudgetPlansController.cs` (Validate) |
| **CBR-002** | **Period Uniqueness:** Exactly one budget plan is permitted per calendar `(Year, Month)`. Duplicate creation must be rejected with HTTP 409. | Backend DB Constraint / SQLite | `BudgetPlans.Year + Month` Unique Index |
| **CBR-003** | **Fixed Seven Jars:** Every plan must contain exactly seven predefined jars: Living Expenses (35%), Food (20%), Children (10%), Emergency Fund (10%), Savings (10%), Investment (10%), Entertainment & Travel (5%). | Backend Catalog Service | `DefaultJarCatalog.cs` |
| **CBR-004** | **100% Total Allocation:** The sum of all jar allocation percentages must equal exactly 100%. | Backend Domain Guard | `DefaultJarCatalog.TotalPercentage` |
| **CBR-005** | **Authoritative Allocation (Hare-Niemeyer):** The backend is the sole authority for budget allocation calculations. The sum of allocated jar budgets must exactly equal total monthly income (`Sum(BudgetVnd) == MonthlyIncomeVnd`). | Backend Allocator | `BudgetAllocator.cs` |
| **CBR-006** | **Whole VND Representation:** Currency is VND. All monetary values are discrete integers fitting in 64-bit signed integers. Fractional currency is prohibited. | Backend Models / SQLite | `Expense.AmountVnd`, `BudgetPlan.MonthlyIncomeVnd` |
| **CBR-007** | **Expense Validation:** An expense must have a valid `expenseDate` (`YYYY-MM-DD`), a valid recognized `jarType`, an amount `> 0 VND`, and a non-empty `description` (<= 500 characters). | Backend Validator | `BudgetPlansController.ValidateExpenseRequest` |
| **CBR-008** | **Plan-Expense Date Alignment:** An expense can only be recorded if a budget plan exists for that expense date's year and month. | Backend Controller | `BudgetPlansController.CreateExpense` |
| **CBR-009** | **Over-Budget Allowance:** An expense is not blocked if it causes a jar's total spending to exceed its budget. Over-budget spending is accepted and yields a negative remaining balance. | Backend Transaction Logic | `BudgetPlansController.CreateExpense` |
| **CBR-010** | **Authoritative Aggregation:** Spent amounts and utilization percentages are aggregated and computed authoritatively by the backend. | Backend DB Aggregation | `BudgetPlansController.GetSpendingByJars` |

### 6.2 Frontend Validation Rules (FVR - Client-Side)
These rules enhance UX by intercepting invalid inputs before sending HTTP requests. *They never supersede backend validation.*

| Rule ID | Rule Description | Applied Feature | Trigger / Behavior |
|---|---|---|---|
| **FVR-001** | **Required Income:** Income field must not be empty, null, or zero. Must consist exclusively of ASCII digits (`[0-9]+`). | F1 (Monthly Planning) | On blur / submit: Display *"Monthly income is required and must be greater than zero."* |
| **FVR-002** | **Valid Period Selection:** Year must be between 1 and 9999; Month must be between 1 and 12. | F1, F2, F4 | Dropdown / Datepicker bounds: Prevent selection of out-of-range dates. |
| **FVR-003** | **Required Expense Fields:** Expense Date, Jar Type, Amount, and Description are all mandatory. | F3 (Add Expense) | Form submit disabled or displays error badges if any field is pristine/empty. |
| **FVR-004** | **Expense Amount Formatting:** Amount input accepts only positive numeric characters. Negative numbers and decimals are blocked on keypress/paste. | F3 (Add Expense) | Input mask / validator prevents negative signs `-` or decimal points `.`. |
| **FVR-005** | **Description Boundary:** Description must be trimmed, non-empty, and contain at most 500 characters. | F3 (Add Expense) | Character counter `X / 500`; blocks submission if > 500. |

### 6.3 Presentation Rules (PR - Display & UX)
These rules govern formatting, visual hierarchy, and UI state rendering in Angular.

| Rule ID | Rule Description | Applied Feature | UX / Presentation Detail |
|---|---|---|---|
| **PR-001** | **VND Currency Formatting:** Display all monetary values with standard Vietnamese number grouping (e.g., `10,000,000 ₫` or `10.000.000 VND`). Underneath, bind to raw string/number. | F1, F2, F3, F4 | Custom Angular Pipe or standard `DecimalPipe` / `CurrencyPipe`. |
| **PR-002** | **Jar Identification & Theming:** Each jar has a consistent thematic color and icon matching brand guidelines across all views: <br>• Living Expenses: `#1D4ED8` (Blue)<br>• Food: `#15803D` (Green)<br>• Children: `#B45309` (Amber)<br>• Emergency: `#DC2626` (Red)<br>• Savings: `#047857` (Teal)<br>• Investment: `#7C3AED` (Purple)<br>• Entertainment: `#C026D3` (Fuchsia) | F2, F3, F4 | Consistent chip, badge, and progress bar coloring. |
| **PR-003** | **Utilization Progress Visualization:** Visual progress bar color corresponds to `percentageUsed`:<br>• `< 80%`: Safe (Green / Primary)<br>• `80% – 99.99%`: Warning (Yellow / Amber)<br>• `>= 100%`: Danger / Over-budget (Red). | F4 (Spending by Jar) | Dynamic CSS class binding on progress bars. |
| **PR-004** | **Empty State Navigation:** When a user requests data for a month lacking a plan (HTTP 404), display a clean empty state card with a direct call-to-action button *"Create Plan for This Month"*. | F2, F4 | Friendly informative UX instead of raw error toast. |
| **PR-005** | **Server Error Mapping:** Transform backend `ApiErrorResponse` and `ApiFieldError` lists directly to their corresponding form control visual states. | F1, F3 | Highlight specific invalid input borders and render backend `message`. |

---

## 7. Validation Requirements & Field Matrix

| Field | Source DTO | Type / Format | Mandatory | Client Validation (FVR) | Server Validation (CBR) | Server Error Code |
|---|---|---|---|---|---|---|
| `year` | `CreateBudgetPlanRequest` | Integer | Yes | Range `1..9999` | `year < 1 \|\| year > 9999` | `OUT_OF_RANGE` |
| `month` | `CreateBudgetPlanRequest` | Integer | Yes | Range `1..12` | `month < 1 \|\| month > 12` | `OUT_OF_RANGE` |
| `monthlyIncomeVnd` | `CreateBudgetPlanRequest` | String (ASCII digits) | Yes | Required, digits only, `> 0` | Required, digits only, parses to `long > 0` | `REQUIRED`, `INVALID_FORMAT`, `MUST_BE_POSITIVE` |
| `expenseDate` | `CreateExpenseRequest` | String (`YYYY-MM-DD`) | Yes | Valid date format | Exact format `yyyy-MM-dd`, matching active plan | `REQUIRED`, `INVALID_FORMAT`, `MONTHLY_PLAN_NOT_FOUND` |
| `jarType` | `CreateExpenseRequest` | String (enum code) | Yes | Selected from list | Must match one of 7 catalog `ApiValue`s | `REQUIRED`, `INVALID_VALUE`, `JAR_NOT_IN_MONTHLY_PLAN` |
| `amountVnd` | `CreateExpenseRequest` | String (ASCII digits) | Yes | Required, digits only, `> 0` | Required, digits only, parses to `long > 0` | `REQUIRED`, `INVALID_FORMAT`, `MUST_BE_POSITIVE` |
| `description` | `CreateExpenseRequest` | String | Yes | Trimmed length `1..500` | Non-empty trimmed string, length `<= 500` | `REQUIRED`, `TOO_LONG` |

---

## 8. Non-Functional Requirements

- **NFR-01: Usability & Feedback:** The UI must provide immediate visual feedback upon form submission (loading spinners, disabled buttons) to prevent accidental double submissions.
- **NFR-02: Performance:** Client navigation between tabs/views must occur in `< 100ms`. API responses must render immediately upon arrival without layout shifts.
- **NFR-03: Data Consistency & Integrity:** The client must strictly consume backend figures for all allocations, spending sums, and percentages. No local approximations or client overrides are permitted.
- **NFR-04: Error Handling & Resilience:** Every HTTP error must be handled gracefully. Field errors must map to form controls. Unhandled network or 500 errors must display a user-friendly retry banner.
- **NFR-05: Maintainability & Modern Angular Standards:** Frontend code must be structured using modern **Angular 22** standalone components, inject-based dependency injection, signal-based state management where appropriate, and strong TypeScript typings.
- **NFR-06: Security & Sanitization:** All user inputs (especially `description`) must be sanitized against Cross-Site Scripting (XSS) before rendering in HTML templates.

---

## 9. API Dependencies & Contract Matrix

| Feature | User Action | Endpoint | Method | Request DTO | Response DTO | Expected Status Codes |
|---|---|---|---|---|---|---|
| **F1** | Create Monthly Plan | `/api/v1/budget-plans` | `POST` | `CreateBudgetPlanRequest` | `BudgetPlanResponse` | `201 Created`<br>`400 Bad Request`<br>`409 Conflict` |
| **F1/F2** | Fetch Default Jars Meta | `/api/v1/budget-plans/default-jars` | `GET` | *None* | `DefaultJarsResponse` | `200 OK` |
| **F2** | View Allocated Plan | `/api/v1/budget-plans/{year}/{month}` | `GET` | *None* (Route params) | `BudgetPlanResponse` | `200 OK`<br>`400 Bad Request`<br>`404 Not Found` |
| **F3** | Add New Expense | `/api/v1/budget-plans/expenses` | `POST` | `CreateExpenseRequest` | `CreateExpenseResponse` | `201 Created`<br>`400 Bad Request`<br>`404 Not Found` |
| **F4** | View Spending by Jar | `/api/v1/budget-plans/{year}/{month}/spending-by-jars` | `GET` | *None* (Route params) | `SpendingByJarsResponse` | `200 OK`<br>`400 Bad Request`<br>`404 Not Found`<br>`500 Server Error` |

---

## 10. Acceptance Criteria (Testable Given / When / Then)

### 10.1 F1 — Monthly Planning
- **AC-F1-01 (Successful Plan Creation):**
  - **Given** no monthly plan exists for Year `2026`, Month `11`
  - **When** the user submits income `"30000000"` for `2026-11`
  - **Then** the system sends a POST request and receives `201 Created`
  - **And** the plan displays exactly 7 jars totaling `30,000,000 VND`.
- **AC-F1-02 (Duplicate Plan Prevention):**
  - **Given** a plan already exists for Year `2026`, Month `11`
  - **When** the user attempts to submit another plan for `2026-11`
  - **Then** the backend responds with `409 Conflict` (`MONTHLY_PLAN_ALREADY_EXISTS`)
  - **And** the UI displays an alert stating the plan already exists.
- **AC-F1-03 (Invalid Income Rejection):**
  - **Given** the monthly planning form is open
  - **When** the user inputs `"0"`, `"-50000"`, `"abc"`, or leaves it blank
  - **Then** client validation flags the field and prevents form submission.

### 10.2 F2 — Income Allocation
- **AC-F2-01 (Authoritative Allocation Display):**
  - **Given** an existing plan with income `"50000000"`
  - **When** the user views the income allocation
  - **Then** the frontend displays all 7 jars with exact budgets calculated by backend:
    - Living Expenses (35%): `17,500,000 VND`
    - Food (20%): `10,000,000 VND`
    - Children (10%): `5,000,000 VND`
    - Emergency Fund (10%): `5,000,000 VND`
    - Savings (10%): `5,000,000 VND`
    - Investment (10%): `5,000,000 VND`
    - Entertainment & Travel (5%): `2,500,000 VND`
  - **And** the sum of all jar budgets equals exactly `50,000,000 VND`.
- **AC-F2-02 (Unplanned Month Handling):**
  - **Given** no plan exists for Year `2027`, Month `01`
  - **When** the user navigates to view allocation for `2027-01`
  - **Then** backend returns `404 Not Found`
  - **And** the UI shows an empty state prompting the user to create a plan.

### 10.3 F3 — Add Expense
- **AC-F3-01 (Successful Expense Logging):**
  - **Given** an active plan for `2026-11`
  - **When** the user submits an expense with Date `"2026-11-05"`, Jar `"food"`, Amount `"250000"`, Description `"Supermarket"`
  - **Then** the backend returns `201 Created`
  - **And** the UI confirms success and displays updated jar spent and remaining figures.
- **AC-F3-02 (Missing Plan for Expense Date):**
  - **Given** no plan exists for `2025-05`
  - **When** the user logs an expense with date `"2025-05-12"`
  - **Then** the backend responds with `404 Not Found` (`MONTHLY_PLAN_NOT_FOUND`)
  - **And** the UI displays an error indicating that no plan exists for that month.
- **AC-F3-03 (Over-budget Recording Allowed):**
  - **Given** a jar with remaining budget `100,000 VND`
  - **When** the user logs an expense of `150,000 VND` for that jar
  - **Then** the backend saves the transaction and returns remaining balance `"-50000"`
  - **And** the UI displays the negative remaining balance and flags the jar as over-budget.

### 10.4 F4 — Spending by Jar
- **AC-F4-01 (Accurate Spending Breakdown):**
  - **Given** an active plan with logged expenses
  - **When** the user opens the "Spending by Jar" screen
  - **Then** each jar displays `budgetVnd`, `spentVnd`, and `percentageUsed` from backend
  - **And** each jar's progress bar visually represents `percentageUsed`.
- **AC-F4-02 (Zero Spending State):**
  - **Given** a new plan with no logged expenses
  - **When** the user views the spending screen
  - **Then** all jars show `0 VND` spent and `0%` progress.

---

## 11. Scope, Constraints & Architectural Boundaries

### 11.1 In Scope
- Development of the **Angular 22 Single Page Application** frontend.
- Implementation of features **F1 (Monthly Planning)**, **F2 (Income Allocation)**, **F3 (Add Expense)**, and **F4 (Spending by Jar)**.
- Full compliance with existing ASP.NET Core REST API endpoints and DTO contracts.
- Client-side validation, error mapping, and responsive presentation.

### 11.2 Out of Scope
- Modifying, extending, or reimplementing backend APIs or database schemas.
- User authentication, multi-tenant family isolation, and role-based permissions.
- Customizing jar names, reordering jars, or modifying predefined allocation percentages.
- Editing or deleting existing expenses (as backend endpoints currently do not support PUT/DELETE).
- Multi-currency support or client-side financial calculations.

### 11.3 Technical & Architectural Constraints
- **Frozen Backend:** The ASP.NET Core (.NET 10) backend is pre-existing and immutable. All frontend design must conform to existing API contracts.
- **Framework Target:** The frontend target framework is **Angular 22**.
- **Monetary Precision:** The frontend must never convert VND strings to floating point numbers for financial logic.

---

## 12. Technical Preparation: Angular 22 Upgrade Requirement

### 12.1 Current Repository Inspection Finding
- Inspection of the template repository frontend (`frontend/package.json`) indicates the codebase was scaffolded with:
  - `@angular/core`: `^21.2.0`
  - `@angular/cli`: `^21.2.24`
  - `typescript`: `~5.9.2`
  - Node environment on development host: `v26.3.1` (npm `12.2.0`).

### 12.2 Technical Preparation Task (Pre-Implementation Phase)
In accordance with user confirmation, the application **must target Angular 22**. 
- **Action Plan (Future Task):** A dedicated technical preparation task must be performed prior to feature implementation:
  1. Verify the official Angular 22 release notes, dependencies, and peer dependency matrix (TypeScript, RxJS).
  2. Execute the official Angular migration CLI (`ng update @angular/core@22 @angular/cli@22`) or update dependencies in `package.json`.
  3. Ensure compatibility with Node.js host version.
  4. Ensure all standalone component setups and routing compile cleanly under Angular 22.
- *Note:* During the current requirements specification phase, no source files, `package.json`, or lockfiles have been modified.

---

## 13. Requirement Traceability Matrix (RTM)

| Req ID | Feature Name | User Story | Enforced Rules | API Endpoint | Primary Test Case / AC |
|---|---|---|---|---|---|
| **REQ-F1** | Monthly Planning | F1-US-01 | CBR-001, CBR-002, FVR-001, FVR-002 | `POST /api/v1/budget-plans` | AC-F1-01, AC-F1-02, AC-F1-03 |
| **REQ-F2** | Income Allocation | F2-US-01 | CBR-003, CBR-004, CBR-005, PR-001, PR-002 | `GET /api/v1/budget-plans/{y}/{m}` | AC-F2-01, AC-F2-02 |
| **REQ-F3** | Add Expense | F3-US-01 | CBR-006, CBR-007, CBR-008, CBR-009, FVR-003, FVR-004, FVR-005 | `POST /api/v1/budget-plans/expenses` | AC-F3-01, AC-F3-02, AC-F3-03 |
| **REQ-F4** | Spending by Jar | F4-US-01 | CBR-010, PR-001, PR-002, PR-003, PR-004 | `GET /api/v1/budget-plans/{y}/{m}/spending-by-jars` | AC-F4-01, AC-F4-02 |

---

## 14. Open Questions & Baseline Decision Log

| ID | Issue / Topic | Resolution & Baseline Decision | Status |
|---|---|---|---|
| **OQ-01** | Scope of F4 | Confirmed as **Spending by Jar** using `GET /api/v1/budget-plans/{year}/{month}/spending-by-jars`. Expense Edit/Delete is Out of Scope. | **Resolved** |
| **OQ-02** | Over-budget Handling | Backend accepts over-budget expenses. Frontend will display negative remaining balances and apply danger/warning styling (PR-003) without blocking submission. | **Resolved** |
| **OQ-03** | Target Angular Version | Confirmed **Angular 22**. Repository inspection confirmed Angular 21 is currently in package.json; upgrade will be documented and executed in technical preparation. | **Resolved** |
| **OQ-04** | Authentication & Multi-Tenancy | Out of scope for this assignment. Single-family standalone context. | **Resolved** |

