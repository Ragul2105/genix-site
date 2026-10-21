/** The course project's layers, top to bottom. Parts are 1-based curriculum parts (lib/curriculum.ts). */
export const stackLayers = [
  {
    key: "ui", name: "Browser / UI", color: "#2563EB",
    what: "What the customer sees and clicks: search, product pages, cart and checkout, on web and mobile.",
    tests: "Functional and UI testing, forms and validation, responsive, compatibility, accessibility and usability.",
    parts: [4, 8],
  },
  {
    key: "api", name: "API", color: "#6EA8FF",
    what: "The requests and responses behind every click.",
    tests: "REST requests and responses, authentication, positive and negative cases, API test data.",
    parts: [6],
  },
  {
    key: "services", name: "Application Services", color: "#0B1F3A",
    what: "The business rules: cart totals, coupons, payment retries, order creation.",
    tests: "Integration and end-to-end transactions across services, plus performance and security fundamentals.",
    parts: [6, 8],
  },
  {
    key: "db", name: "Database", color: "#E0A800",
    what: "Where orders, customers and payments are stored.",
    tests: "SQL for testers: checking that the data behind each screen is right.",
    parts: [7],
  },
  {
    key: "external", name: "External Systems", color: "#2DB86A",
    what: "The payment provider, email and SMS, delivery partners.",
    tests: "External systems and dependencies: what happens when something outside the app fails.",
    parts: [6],
  },
] as const;

/** Practices that run across every layer rather than living in one. */
export const crossCutting = [
  { name: "Automation", part: 10 },
  { name: "Git", part: 11 },
  { name: "CI/CD", part: 12 },
];
