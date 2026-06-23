// Main entry point for aggregating and running backend testing suites
console.log("Loading AI Business Launchpad production test suites...");

import "./auth.test.js";
import "./billing.test.js";
import "./usage-tracking.test.js";
import "./feature-enforcement.test.js";
import "./budget-protection.test.js";

console.log("All test suites initialized.");
