# SpendWise

SpendWise is a responsive personal finance and expense analytics platform designed to help users track income, manage expenses, set monthly budgets, and understand their financial habits through interactive reports.

The project is designed as a polished full-stack portfolio application suitable for a college submission, GitHub repository, resume, LinkedIn showcase, and technical interviews.

## Project Summary

SpendWise gives every user a private financial workspace where they can:

- Register and log in securely.
- Record income and expenses.
- Search, filter, sort, edit, and delete transactions.
- Create monthly and category-based budgets.
- Monitor budget utilization and overspending warnings.
- View financial trends through interactive charts.
- Export filtered transaction data as CSV.
- Manage their profile and account settings.

The application uses a vanilla HTML, CSS, and JavaScript frontend with a Node.js and Express.js REST API, MongoDB database, JWT authentication, and Chart.js visualizations.

## Current status

SpendWise is complete as a working **college and portfolio MVP**. The
frontend and backend are deployed and connected to MongoDB Atlas.

### Live project

- [Open SpendWise](https://spendwise-frontend-on8z.onrender.com)
- [Backend health check](https://spendwise-backend-dxhj.onrender.com/api/health)

### Implemented features

- Responsive landing, registration, and login pages
- JWT authentication and protected routes
- Income and expense transaction management
- Transaction search, filters, sorting, and pagination
- Monthly and category-based budgets
- Dashboard summaries and Chart.js visualizations
- Spending, savings, and budget analytics
- Filtered CSV transaction export
- Profile updates and password changes
- Input validation, security headers, and authentication rate limiting

### Testing

The backend has an automated integration test covering core authentication,
transaction, budget, analytics, CSV export, and account-isolation flows.
Key frontend flows have also been tested locally and on the live site.

### Future improvements

- Complete the production security and deployment review
- Expand automated frontend and API test coverage
- Add custom analytics date ranges and month-over-month comparisons
- Improve account recovery and session management
- Add optional features such as recurring transactions and savings goals

This project is intended as a learning and portfolio application. It has
not yet undergone a complete production security review and should not be
used for sensitive financial data without further hardening.


## Technology Stack

### Frontend

- HTML5
- CSS3 with responsive layouts and CSS variables
- Vanilla JavaScript ES6+
- Chart.js
- Lucide Icons
- Fetch API

### Backend

- Node.js
- Express.js
- REST API architecture
- JWT authentication
- bcrypt password hashing
- express-validator input validation
- Helmet security headers
- express-rate-limit
- Multer for controlled file handling

### Database and Deployment

- MongoDB Atlas
- Mongoose
- Git and GitHub
- Postman for API testing
- Vercel or Netlify for the frontend
- Render or another Node.js host for the backend

## Proposed Project Structure

This is the original plan, not an inventory of the current files. The current
frontend uses `frontend/html/` for pages and `frontend/js/app.js` for the
dashboard views. The backend implementation is organized under its existing
`controllers`, `models`, `routes`, `middleware`, and `utils` folders.

```text
SpendWise/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── transactions.html
│   ├── budgets.html
│   ├── analytics.html
│   ├── reports.html
│   ├── settings.html
│   ├── 404.html
│   ├── css/
│   │   ├── style.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── transactions.css
│   │   ├── budgets.css
│   │   ├── analytics.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── config.js
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   ├── analytics.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   ├── charts.js
│   │   └── utils.js
│   └── assets/
│       ├── images/
│       └── icons/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── transaction.controller.js
│   │   ├── budget.controller.js
│   │   └── analytics.controller.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── transaction.routes.js
│   │   ├── budget.routes.js
│   │   └── analytics.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── validation.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── transaction.service.js
│   │   ├── budget.service.js
│   │   └── analytics.service.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── transaction.validator.js
│   │   └── budget.validator.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── csvExport.js
│   │   └── ApiError.js
│   ├── tests/
│   ├── app.js
│   ├── server.js
│   └── package.json
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

## Core Database Models

### User

Stores the user name, unique email, hashed password, preferred currency, and timestamps. Password hashes are never returned through the API.

### Transaction

Stores the authenticated user reference, title, amount, type, category, payment method, description, date, and timestamps. Every transaction is scoped to its owner.

### Budget

Stores the authenticated user reference, month, year, total spending limit, and category limits. A unique compound index prevents duplicate budgets for the same user and period.

## API Overview

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/change-password

POST   /api/transactions
GET    /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/transactions/summary
GET    /api/transactions/export

POST   /api/budgets
GET    /api/budgets
GET    /api/budgets/:id
PUT    /api/budgets/:id
DELETE /api/budgets/:id
GET    /api/budgets/summary

GET    /api/analytics/overview
GET    /api/analytics/income-expense
GET    /api/analytics/category-breakdown
GET    /api/analytics/monthly-trends
GET    /api/analytics/budget-performance
GET    /api/analytics/savings-trends
```

## Complete Development Roadmap

### Phase 1 — Planning and Project Setup

- Create the final folder structure.
- Initialize the root and backend npm projects.
- Add `.gitignore` and `.env.example`.
- Configure Express, dotenv, CORS, and centralized error handling.
- Configure MongoDB connection logic in `backend/config/db.js`.
- Create the initial README and development scripts.
- Verify that the backend starts successfully.

**Deliverable:** A running backend skeleton, connected configuration, and documented project structure.

### Phase 2 — UI/UX Foundation

- Create the SpendWise visual design system.
- Define colors, typography, spacing, shadows, buttons, forms, tables, cards, modals, badges, and alerts.
- Build the landing, login, registration, dashboard, transaction, budget, analytics, reports, settings, and 404 pages.
- Add responsive layouts for desktop, tablet, and mobile.
- Add navigation, empty states, loading states, toast notifications, and confirmation dialogs.
- Use mock data temporarily to validate the visual experience.

**Deliverable:** A complete responsive frontend prototype with consistent SaaS styling.

### Phase 3 — Authentication and User Management

- Create the User Mongoose model.
- Implement registration and login endpoints.
- Hash passwords with bcrypt.
- Generate and validate JWT access tokens.
- Add protected-route middleware.
- Implement logout and current-user endpoints.
- Connect frontend authentication forms to the API.
- Add profile and password-change functionality.

**Deliverable:** Secure user registration, login, logout, protected pages, and account management.

### Phase 4 — Transaction Management

- Create the Transaction model and indexes.
- Implement transaction create, read, update, and delete endpoints.
- Add frontend add/edit transaction modal forms.
- Add validation on both frontend and backend.
- Implement search, type/category filters, date ranges, sorting, and pagination.
- Add ownership checks to every transaction operation.
- Replace dashboard mock data with real transaction data.

**Deliverable:** Complete income and expense management connected to MongoDB.

### Phase 5 — Dashboard and Financial Summary

- Implement summary calculations for balance, income, expenses, savings, and remaining budget.
- Add recent transactions and top spending categories.
- Add monthly period selection.
- Create income-versus-expense and category-distribution charts.
- Add loading, error, and empty states.
- Confirm that dashboard values update after transaction changes.

**Deliverable:** A live dashboard powered by authenticated database records.

### Phase 6 — Budget Management

- Create the Budget model and unique user-period index.
- Implement budget create, read, update, and delete endpoints.
- Add total and category-level budget limits.
- Calculate actual spending against the selected budget.
- Add normal, warning, critical, and exceeded states.
- Build the budgets page and progress indicators.

**Deliverable:** Functional monthly budget planning and utilization monitoring.

### Phase 7 — Analytics and Reports

- Create analytics service functions and aggregation queries.
- Implement monthly and yearly summaries.
- Add category breakdown, spending trends, savings trends, and budget-performance charts.
- Add filters for current month, previous month, last 3 months, last 6 months, current year, and custom dates.
- Implement secure CSV exports using authenticated and filtered records.
- Build the reports page.

**Deliverable:** Accurate interactive analytics and exportable financial reports.

### Phase 8 — Security and Quality Hardening

- Add Helmet security headers.
- Add authentication rate limiting.
- Configure production-safe CORS.
- Validate and sanitize all incoming data.
- Confirm that users cannot access another user’s records.
- Remove sensitive data from logs and responses.
- Verify environment variables are never committed.
- Improve API error responses and frontend error handling.

**Deliverable:** A safer, more reliable application ready for deployment testing.

### Phase 9 — Testing and Bug Fixing

- Test registration, login, logout, and protected routes.
- Test all transaction and budget CRUD operations.
- Test filters, pagination, date ranges, analytics, and CSV exports.
- Test invalid input and unauthorized requests.
- Test multiple-user data isolation.
- Check desktop, tablet, and mobile layouts.
- Run syntax checks and API tests through Postman.
- Fix all major functional and visual issues.

**Deliverable:** A stable MVP with verified core functionality.

### Phase 10 — Deployment and Portfolio Release

- Create production environment variables.
- Deploy the backend and connect MongoDB Atlas.
- Deploy the frontend and configure the production API URL.
- Configure CORS and authentication cookies/tokens for production.
- Test the live application end to end.
- Add screenshots and a demo account to the README.
- Add architecture documentation and API examples.
- Record a short demo video.
- Publish the GitHub repository.
- Prepare resume bullets, LinkedIn post, and project presentation.

**Deliverable:** A live, documented, portfolio-ready SpendWise application.

## Suggested Four-Week Schedule

| Week | Focus | Main Output |
|---|---|---|
| Week 1 | Setup, design system, authentication | Working foundation and responsive UI |
| Week 2 | Transactions and dashboard | Real income/expense tracking |
| Week 3 | Budgets and analytics | Budget monitoring and charts |
| Week 4 | Reports, testing, deployment, documentation | Stable live portfolio project |

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5500
COOKIE_SECRET=your_cookie_secret
```

## Portfolio Positioning

Resume description:

> Built SpendWise, a responsive personal finance analytics platform using vanilla JavaScript, Node.js, Express.js, MongoDB, and Chart.js, with JWT authentication, transaction CRUD operations, monthly budgeting, interactive reports, CSV exports, validation, and user-specific data protection.

Screenshots, a live demo, clear API documentation, security notes, and a short walkthrough can help explain the project to recruiters and interviewers. Describe the functionality that has actually been implemented and tested.

## Run the frontend locally

With the backend running, open another terminal:

```powershell
cd frontend
node serve.cjs
```

Visit `http://localhost:5500`. The frontend uses the local backend on port
5000 for localhost, and the configured Render backend when hosted. The
backend `CLIENT_URL` must match the frontend origin. Chart.js and fonts load
from external CDNs and need an internet connection.

The browser stores the access token in session storage. Logging out removes
it from that browser session; this is not server-side token revocation.
Tokens are accessible to JavaScript, so XSS protections and a production
authentication review remain important. The API's password-change operation
invalidates earlier tokens.

## Data and reports

MongoDB stores user, transaction, and budget records in the database specified
by `MONGODB_URI`. CSV reports are generated for the authenticated user and
sent to the browser; the backend does not save a report file. Downloads may
contain financial information and should not be committed to Git.

## Run the backend locally

### Requirements

- Node.js 22 or another compatible supported version
- npm
- A MongoDB Atlas cluster or local MongoDB server

### Setup

1. Install backend dependencies:

   ```powershell
   cd backend
   npm install
   ```

2. Create a `.env` file in the project root. Use your own values:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret
   JWT_EXPIRES_IN=1h
   CLIENT_URL=http://localhost:5500
   ```

3. Start the server from the `backend` folder:

   ```powershell
   npm start
   ```

4. Open the health endpoint in your browser:

   ```text
   http://localhost:5000/api/health
   ```

Never commit the real `.env` file, database credentials, JWT secrets,
or exported financial records.

## Run API tests

Start the backend in one terminal. In another terminal, go to the
`backend` folder and run:

```powershell
npm test
```

The integration test connects to the running API and creates two test
accounts in the configured MongoDB database. Use a separate test database.

On a successful run, it deletes its test transaction and budget. The test
accounts remain because account deletion is not yet implemented.

The tests do not cover every endpoint or production deployment setting.
