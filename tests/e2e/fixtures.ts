/**
 * Playwright Test Fixtures
 * 
 * Custom fixtures for Page Object Models following Playwright best practices.
 * This allows using page objects directly in tests with automatic initialization.
 * 
 * @see https://playwright.dev/docs/test-fixtures
 */

import { test as base } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';
import { LoginPage } from './page-objects/LoginPage';
import { EmployeeDashboardPage } from './page-objects/EmployeeDashboardPage';
import { AdminDashboardPage } from './page-objects/AdminDashboardPage';

// Extend base test with page object fixtures
type PageObjects = {
  homePage: HomePage;
  loginPage: LoginPage;
  employeeDashboard: EmployeeDashboardPage;
  adminDashboard: AdminDashboardPage;
};

export const test = base.extend<PageObjects>({
  // HomePage fixture
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  // LoginPage fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // EmployeeDashboardPage fixture
  employeeDashboard: async ({ page }, use) => {
    const employeeDashboard = new EmployeeDashboardPage(page);
    await use(employeeDashboard);
  },

  // AdminDashboardPage fixture
  adminDashboard: async ({ page }, use) => {
    const adminDashboard = new AdminDashboardPage(page);
    await use(adminDashboard);
  },
});

export { expect } from '@playwright/test';
