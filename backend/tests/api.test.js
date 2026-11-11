const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  let body;

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";

    body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  let data = text;

  if (contentType.includes("application/json")) {
    data = JSON.parse(text);
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

function expectStatus(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected HTTP ${expected}, received ${result.status}`
  );
}

test(
  "SpendWise backend API: authentication, transactions, budgets, analytics, CSV, and isolation",
  { timeout: 120000 },
  async () => {
    const suffix = randomUUID().replace(/-/g, "");

    const userA = {
      name: "Automated Test A",
      email: `api-test-a-${suffix}@example.com`,
      password: randomUUID().replace(/-/g, ""),
    };

    const userB = {
      name: "Automated Test B",
      email: `api-test-b-${suffix}@example.com`,
      password: randomUUID().replace(/-/g, ""),
    };

    // 1. Health check
    const health = await request("/health");
    expectStatus(health, 200, "Health check");
    assert.equal(health.data.success, true);

    // 2. Protected route without a token
    const noToken = await request("/users/profile");
    expectStatus(noToken, 401, "Profile without token");

    // 3. Invalid registration
    const invalidRegistration = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Invalid Test",
        email: "not-an-email",
        password: "short",
      },
    });
    expectStatus(invalidRegistration, 400, "Invalid registration");

    // 4. Create isolated test accounts
    const registeredA = await request("/auth/register", {
      method: "POST",
      body: userA,
    });
    expectStatus(registeredA, 201, "Register user A");

    const registeredB = await request("/auth/register", {
      method: "POST",
      body: userB,
    });
    expectStatus(registeredB, 201, "Register user B");

    const loginA = await request("/auth/login", {
      method: "POST",
      body: {
        email: userA.email,
        password: userA.password,
      },
    });
    expectStatus(loginA, 200, "Login user A");
    assert.ok(loginA.data.token, "User A token is missing");

    const loginB = await request("/auth/login", {
      method: "POST",
      body: {
        email: userB.email,
        password: userB.password,
      },
    });
    expectStatus(loginB, 200, "Login user B");
    assert.ok(loginB.data.token, "User B token is missing");

    const tokenA = loginA.data.token;
    const tokenB = loginB.data.token;

    // 5. Create a transaction for user A
    const transactionBody = {
      title: "Automated lunch",
      amount: 250,
      type: "expense",
      category: "Food",
      paymentMethod: "UPI",
      description: "Automated test",
      date: "2026-11-11",
    };

    const createdTransaction = await request("/transactions", {
      method: "POST",
      token: tokenA,
      body: transactionBody,
    });
    expectStatus(createdTransaction, 201, "Create transaction");

    const transactionId = createdTransaction.data.transaction._id;
    assert.ok(transactionId, "Transaction ID is missing");

    // 6. Search user A's transaction
    const search = await request(
      "/transactions?search=Automated%20lunch",
      { token: tokenA }
    );
    expectStatus(search, 200, "Search transactions");
    assert.equal(search.data.total, 1);

    // 7. Verify user B cannot see or change user A's transaction
    const userBTransactions = await request("/transactions", {
      token: tokenB,
    });
    expectStatus(userBTransactions, 200, "User B transaction list");

    assert.equal(
      userBTransactions.data.transactions.some(
        (item) => item._id === transactionId
      ),
      false,
      "User B can see user A's transaction"
    );

    const otherUserUpdate = await request(`/transactions/${transactionId}`, {
      method: "PUT",
      token: tokenB,
      body: transactionBody,
    });
    expectStatus(otherUserUpdate, 404, "Cross-account transaction update");

    const otherUserDelete = await request(`/transactions/${transactionId}`, {
      method: "DELETE",
      token: tokenB,
    });
    expectStatus(otherUserDelete, 404, "Cross-account transaction delete");

    // 8. Create a monthly budget
    const budgetBody = {
      month: 11,
      year: 2026,
      totalLimit: 1000,
      categoryLimits: [
        { category: "Food", limit: 500 },
      ],
    };

    const createdBudget = await request("/budgets", {
      method: "POST",
      token: tokenA,
      body: budgetBody,
    });
    expectStatus(createdBudget, 201, "Create budget");

    const budgetId = createdBudget.data.budget._id;
    assert.ok(budgetId, "Budget ID is missing");

    const duplicateBudget = await request("/budgets", {
      method: "POST",
      token: tokenA,
      body: budgetBody,
    });
    expectStatus(duplicateBudget, 409, "Duplicate budget");

    // 9. Check budget calculations
    const budgetSummary = await request(
      "/budgets/summary?month=11&year=2026",
      { token: tokenA }
    );
    expectStatus(budgetSummary, 200, "Budget summary");

    assert.equal(budgetSummary.data.summary.totalSpent, 250);
    assert.equal(budgetSummary.data.summary.remaining, 750);

    // 10. Check budget isolation
    const otherBudgetRead = await request(`/budgets/${budgetId}`, {
      token: tokenB,
    });
    expectStatus(otherBudgetRead, 404, "Cross-account budget read");

    const otherBudgetUpdate = await request(`/budgets/${budgetId}`, {
      method: "PUT",
      token: tokenB,
      body: budgetBody,
    });
    expectStatus(otherBudgetUpdate, 404, "Cross-account budget update");

    const otherBudgetDelete = await request(`/budgets/${budgetId}`, {
      method: "DELETE",
      token: tokenB,
    });
    expectStatus(otherBudgetDelete, 404, "Cross-account budget delete");

    // 11. Check monthly dashboard summary
    const overview = await request(
      "/analytics/overview?month=11&year=2026",
      { token: tokenA }
    );
    expectStatus(overview, 200, "Analytics overview");

    assert.equal(overview.data.summary.income, 0);
    assert.equal(overview.data.summary.expenses, 250);
    assert.equal(overview.data.summary.savings, -250);
    assert.equal(overview.data.summary.budgetRemaining, 750);

    // 12. Check CSV export and filter
    const csv = await request(
      "/transactions/export?startDate=2026-11-01&endDate=2026-11-30",
      { token: tokenA }
    );
    expectStatus(csv, 200, "CSV export");
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.data, /Automated lunch/);

    const csvWithoutToken = await request("/transactions/export");
    expectStatus(csvWithoutToken, 401, "CSV export without token");

    // 13. Invalid input and malformed JSON
    const invalidBudget = await request("/budgets", {
      method: "POST",
      token: tokenA,
      body: {
        month: 13,
        year: 2026,
        totalLimit: 1000,
        categoryLimits: [],
      },
    });
    expectStatus(invalidBudget, 400, "Invalid budget");

    const malformedJson = await request("/auth/login", {
      method: "POST",
      body: '{"email":',
    });
    expectStatus(malformedJson, 400, "Malformed JSON");

    // 14. Change a password and invalidate the old token
    const newPassword = randomUUID().replace(/-/g, "");

    const changedPassword = await request("/users/change-password", {
      method: "PUT",
      token: tokenB,
      body: {
        currentPassword: userB.password,
        newPassword,
      },
    });
    expectStatus(changedPassword, 200, "Change password");

    const oldToken = await request("/users/profile", {
      token: tokenB,
    });
    expectStatus(oldToken, 401, "Old token after password change");

    const newLogin = await request("/auth/login", {
      method: "POST",
      body: {
        email: userB.email,
        password: newPassword,
      },
    });
    expectStatus(newLogin, 200, "Login with new password");

    // 15. Delete the test transaction and budget as their owner
    const deleteTransaction = await request(
      `/transactions/${transactionId}`,
      {
        method: "DELETE",
        token: tokenA,
      }
    );
    expectStatus(deleteTransaction, 200, "Owner deletes test transaction");

    const deleteBudget = await request(`/budgets/${budgetId}`, {
      method: "DELETE",
      token: tokenA,
    });
    expectStatus(deleteBudget, 200, "Owner deletes test budget");
  }
);