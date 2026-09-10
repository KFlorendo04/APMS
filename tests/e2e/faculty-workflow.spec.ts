import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByPlaceholder("Enter your email")
    .fill("faculty@demo.apms.local");
  await page.getByPlaceholder("Enter your password").fill("Faculty123!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/faculty\/overview$/);
}

test("faculty design workflows create and update data", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Students Requiring Attention").first()).toBeVisible();
  await expect(page.getByText("AI Prediction Status")).toBeVisible();
  await expect(page.getByText("Synthetic prototype available")).toBeVisible();

  await page.getByText("Students", { exact: true }).first().click();
  await page.getByRole("button", { name: "Add Student" }).click();
  await page.getByLabel("Student ID *").fill("SWU-009");
  await page.getByLabel("Full Name *").fill("Mika Santos");
  await page.getByLabel("Phone Number *").fill("+63 900 111 2233");
  await page.getByLabel("Email Address *").fill("mika@university.edu");
  await page.getByLabel("Student Section *").fill("A3");
  await page.getByRole("button", { name: "Add Student", exact: true }).click();
  await expect(page.getByText("Mika Santos")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "persistent fictional validation dataset",
  );

  await page.getByRole("link", { name: "My Classes" }).click();
  await page.getByRole("button", { name: "Add Record" }).click();
  await page.getByLabel("Subject *").fill("Human Computer Interaction");
  await page.getByLabel("Class Section *").fill("BSIT-3B");
  await page.getByLabel("Total Students *").fill("30");
  await page.getByLabel("Passed").fill("27");
  await page.getByLabel("Failed").fill("3");
  await page.getByLabel("Avg Score").fill("86");
  await page.getByRole("button", { name: "Add Record", exact: true }).click();
  await expect(page.getByText("Human Computer Interaction")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "persistent fictional validation dataset",
  );

  await page.getByRole("link", { name: "Attendance" }).click();
  await expect(page.getByText("Attendance Roll Call")).toBeVisible();
  await page.getByRole("button", { name: "Mark all present" }).click();
  await page.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByRole("alert")).toContainText("Attendance saved");

  await page.getByRole("link", { name: "At-Risk Students" }).click();
  await expect(page.getByText("Students Requiring Attention").nth(1)).toBeVisible();
  await expect(page.getByText(/not official SWU SIS grades/)).toBeVisible();

  await page.getByRole("link", { name: "Feedback" }).click();
  await page.getByText("Excellent Performance", { exact: true }).click();
  await expect(page.getByLabel("Feedback Message")).toHaveValue(
    /Outstanding work/,
  );

  await page.getByRole("link", { name: "Analytics & Reports" }).click();
  await expect(page.getByText("Performance Trends")).toBeVisible();
  await expect(page.getByText("Grade Distribution")).toBeVisible();

  await page.getByRole("link", { name: "AI Prediction" }).click();
  await expect(page.getByText("AI-Assisted At-Risk Prediction")).toBeVisible();
  await expect(page.getByText("Synthetic logistic prototype · not institutionally validated", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name: "My Classes" }).click();
  await expect(page.getByText("Human Computer Interaction")).toBeVisible();
});
