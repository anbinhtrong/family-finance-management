# Family Finance Management

**Family Finance Management** is a full-stack personal finance web application built around the **7 Budget Jars Method**. It enables families to create monthly income plans, automatically allocate budget shares, record everyday expenses, and track spending progress with clear financial visibility.

The solution is architected with an **API-First Full-Stack** design:
- **Frontend:** Angular 22 (Signals-first, Standalone Components, Zoneless-ready, Vitest).
- **Backend:** ASP.NET Core 10 Web API, Entity Framework Core 10.
- **Database:** SQLite (WAL mode enabled, robust ACID transactions).

---

## 1. Architecture & Tech Stack

### Frontend (Client)
- **Framework:** **Angular 22** (`@angular/core ~22.2.0`, `@angular/cli ~22.2.5`).
- **Language & Styling:** TypeScript 6.0, HTML5, SCSS with custom design tokens.
- **Angular 22 Key Concepts & Patterns:**
  - **100% Standalone Components & Directives:** No `NgModule` wrappers.
  - **Reactivity via Native Signals:** Built using `signal()`, `computed()`, and `effect()`.
  - **Modern Signal APIs:** Two-way binding with `model()`, inputs with `input()`, and events with `output()`.
  - **Built-in Control Flow:** Native `@if`, `@for`, and `@switch` blocks for clean, high-performance templating.
  - **Cross-Browser Month/Year Picker:** Custom popover grid component fully supported on **Chrome, Firefox, Safari, and Edge**.
- **Unit Testing:** [Vitest](https://vitest.dev/) (`vitest ^5.0.0`) powered by `@angular/build:unit-test` for sub-second test execution.
- **Development Server Port:** **`4400`** (configured in `angular.json` to align with backend CORS).

### Backend (API)
- **Framework:** **.NET 10** (ASP.NET Core Web API).
- **ORM:** Entity Framework Core 10 (`Microsoft.EntityFrameworkCore.Sqlite 10.0.14`).
- **Database Engine:** **SQLite** (`family-finance.db` with `PRAGMA journal_mode=WAL;`).
- **API Documentation:** OpenAPI / Swagger (`Swashbuckle.AspNetCore 10.3.1`).
- **Currency & Monetary Rules:** All monetary values are represented in **VND as positive 64-bit integers (`long`)**, avoiding floating-point inaccuracies.
- **Default API Port:** `http://localhost:54536/` (or via `launchSettings.json`).

---

## 2. The 7 Budget Jars Rule

When a monthly plan is created, total monthly income (in whole VND) is automatically allocated into 7 predefined jars based on fixed percentage splits:

| # | Jar Name | Key | Share (%) | Purpose |
|:---:|:---|:---|:---:|:---|
| 1 | **Living Expenses** | `living` | 35% | Fixed household necessities (rent, utilities, groceries, internet) |
| 2 | **Food** | `food` | 20% | Dining, daily meals, and groceries |
| 3 | **Children** | `children` | 10% | Childcare, tuition, supplies, and children activities |
| 4 | **Emergency Fund** | `emergency` | 10% | Rainy day savings for unexpected events |
| 5 | **Savings** | `savings` | 10% | Long-term capital accumulation and major goals |
| 6 | **Investment** | `investment` | 10% | Wealth creation, stocks, bonds, or retirement |
| 7 | **Entertainment & Travel** | `travel` | 5% | Leisure, vacations, dining out, and family recreation |

---

## 3. Project Structure

```text
family-finance-management/
├── src/
│   ├── FamilyFinance.Api/            # Backend .NET 10 Web API
│   │   └── FamilyFinance.Api/
│   │       ├── Controllers/          # RESTful Endpoints (BudgetPlans, Expenses)
│   │       ├── Data/                 # ApplicationDbContext & Migrations
│   │       ├── DTOs/                 # Request & Response Contracts
│   │       ├── Models/               # Domain Entities (BudgetPlan, BudgetAllocation, Expense)
│   │       ├── Services/             # BudgetAllocator, DefaultJarCatalog
│   │       ├── family-finance.db     # SQLite Database file
│   │       └── Program.cs            # Entry point, Middleware, CORS, DB Migrations
│   │
│   └── FamilyFinance.Client/         # Frontend Angular 22 Client
│       └── FamilyFinance.Client/
│           ├── src/app/
│           │   ├── layouts/          # AppLayout, Shell
│           │   ├── pages/            # HomePage (Dashboard), MonthlyPlanning, AddExpense
│           │   ├── features/         # Services (monthly-plan, expense), Models & Mappers
│           │   └── shared/           # Components (month-year-picker, header, sidebar)
│           ├── angular.json          # Angular CLI Configuration (Port 4400)
│           └── package.json          # Dependencies & Scripts
│
└── README.md                         # Project documentation
```

---

## 4. Setup & Running Locally

### Prerequisites
- **.NET SDK:** .NET 10.0+
- **Node.js:** Node.js 20+ or 22+
- **Package Manager:** npm 10+ or 12+

---

### Step 1: Start Backend API (.NET 10)

1. Open a terminal and navigate to the API directory:
   ```bash
   cd src/FamilyFinance.Api/FamilyFinance.Api
   ```

2. Restore packages and launch the service:
   ```bash
   dotnet restore
   dotnet run
   ```

3. Entity Framework Core automatically applies migrations and ensures the SQLite database exists.
4. Verify the backend via Swagger UI:
   - URL: `http://localhost:54536/swagger` (or the port specified in console output).

---

### Step 2: Start Frontend Client (Angular 22)

1. Open a second terminal window and navigate to the Client directory:
   ```bash
   cd src/FamilyFinance.Client/FamilyFinance.Client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Angular development server:
   ```bash
   npm start
   # or: npx ng serve
   ```

4. Open your browser and navigate to:
   - **`http://localhost:4400/`**

---

## 5. Running Tests

### Frontend Unit Tests (Angular 22 + Vitest)
The client leverages **Vitest** for fast, headless unit testing across all components, signals, and services:
```bash
cd src/FamilyFinance.Client/FamilyFinance.Client
npm test -- --watch=false
```

### Backend Unit Tests (.NET 10)
```bash
cd src/FamilyFinance.Api/FamilyFinance.Api
dotnet test
```

---

## 6. Key Features & User Experience

- **Monthly Dashboard (`/dashboard`):**
  - Instant financial overview: Total Income, Spent Amount, and Available Remaining Balance.
  - Custom 3x4 Popover Month-Year Picker with a **"This month"** shortcut, seamlessly supporting all modern browsers.
  - Visual budget progress bars for all 7 jars with dynamic **Over-budget** indicators.
  - Recent expense activity log sorted chronologically.
- **Monthly Budget Planning (`/monthly-planning`):**
  - Create a new budget plan with automatic VND allocations based on the 7 jars model.
  - Automatically receives the target `period` from the Dashboard or defaults to the current month.
  - Convenient navigation with **"‹ Back to dashboard"** and **"Cancel"** actions.
- **Add Expense (`/expenses/new`):**
  - Record transactions against the active monthly plan and selected budget jar.
  - Real-time balance preview and validation before saving.
