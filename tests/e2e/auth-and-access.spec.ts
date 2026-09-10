import { expect, test, type Page } from '@playwright/test';

const accounts = [
  ['Faculty', 'faculty@demo.apms.local', 'Faculty123!', 'faculty', 'overview'],
  ['Academic Admin', 'dean@demo.apms.local', 'Dean123!', 'academic_admin', 'overview'],
  ['System Admin', 'admin@demo.apms.local', 'Admin123!', 'system_admin', 'overview'],
] as const;

async function login(page: Page, account: (typeof accounts)[number]) {
  const [, email, password, role, home] = account;
  await page.goto('/');
  await page.getByPlaceholder('Enter your email').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/portal/${role}/${home}$`));
}

test('invalid credentials stay on login with a safe error', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Enter your email').fill('faculty@demo.apms.local');
  await page.getByPlaceholder('Enter your password').fill('incorrect');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await expect(page).toHaveURL('/');
});

for (const account of accounts) {
  test(`${account[0]} reaches only the correct portal`, async ({ page }) => {
    await login(page, account);
    const otherRole = account[3] === 'faculty' ? 'system_admin' : 'faculty';
    await page.goto(`/portal/${otherRole}/overview`);
    await expect(page).toHaveURL(new RegExp(`/portal/${account[3]}/`));
  });
}

test('unauthenticated protected route redirects to login', async ({ page }) => {
  await page.goto('/portal/system_admin/logs');
  await expect(page).toHaveURL('/');
  await expect(page.getByText('AI-Powered Student Evaluation')).toBeVisible();
});

test('faculty student search and add-student guidance work', async ({ page }) => {
  await login(page, accounts[0]);
  await page.getByText('Students', { exact: true }).first().click();
  await expect(page).toHaveURL(/\/portal\/faculty\/students$/);
  await page.getByPlaceholder('Search by name, ID, or email...').fill('Maria');
  await expect(page.getByText('Maria Santos').last()).toBeVisible();
  await page.getByRole('button', { name: 'Add Student' }).click();
  await expect(page.getByText("Enter the student's information to add them to the system.")).toBeVisible();
  await page.getByLabel('Close dialog').click();
  await expect(page.getByText("Enter the student's information to add them to the system.")).toBeHidden();
});
