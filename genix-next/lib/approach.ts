/** Our Approach page content. The comparison and cycle come from the programme copy; the walkthrough is a worked example. */
export const traditionalPath = ["Concept", "Tool", "Exercise", "Interview preparation"];

/** One ticket (the home page's "charged twice" scenario) walked through each step of the learning cycle. */
export const ticketWalkthrough = [
  "A ticket arrives: a customer was charged twice after retrying a failed payment.",
  "Before any theory: what could cause a double charge, and where would you look first?",
  "The concepts behind it: how the cart, payment and order services talk, and why retries need safeguards.",
  "Watch it investigated the professional way: reproduce it, check the API response, inspect the order record.",
  "Reproduce it yourself, capture the evidence and write the defect report.",
  "Compare reports: severity versus priority, what was missed, other ways to test it.",
  "Turn it into an answer for “Tell me about a critical bug you found.”",
  "How would you handle this on a real team, and what would you add to regression?",
];

/** How the one project grows with the course (layer keys match lib/project.ts; "all" = every layer). */
export const projectProgression = [
  { layer: "ui", text: "It starts in the browser: the customer journey from Search to My Orders." },
  { layer: "api", text: "When learners study APIs, they investigate what happens behind the cart." },
  { layer: "db", text: "With databases, they validate order information." },
  { layer: "all", text: "With automation, they automate regression scenarios." },
  { layer: "all", text: "With CI/CD, those tests become part of a pipeline." },
];

/** The same journey in other domains: different screens, same testing questions. */
export const industries = ["E-commerce", "Banking", "Travel", "SaaS"];
export const industryPatterns: [string, string[]][] = [
  ["Find", ["Search & product", "Find a payee", "Search flights", "Compare plans"]],
  ["Commit", ["Cart & coupon", "Enter an amount", "Choose seat & fare", "Pick a plan"]],
  ["Pay", ["Payment", "Authorise transfer", "Card payment", "Subscription billing"]],
  ["Record", ["Order", "Ledger entry", "Booking reference", "Account & invoice"]],
  ["Notify", ["Notification", "Debit alert", "E-ticket email", "Welcome email"]],
];
