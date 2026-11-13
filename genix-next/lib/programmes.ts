/** The two programmes and the combined pathway, worded as in Genix's home page reference (Nov 2026). Prices in INR. */
export type Programme = {
  id: "foundation" | "advanced" | "pathway";
  chip: string;
  audience: string;
  name: string;
  summary: string;
  topics: string[];
  months: number;
  classes: number;
  /** Total live teaching hours. */
  hours: number;
  /** The course-wise curriculum shown on the programme page (the pathway combines the other two). */
  curriculum?: string[];
  price: number;
  was?: number;
  offer?: string;
  priceNote?: string;
  photo: string;
  photoAlt: string;
};

export const programmes: Programme[] = [
  {
    id: "foundation",
    chip: "Level 1 · Foundation",
    audience: "For Beginners",
    name: "QA Foundation Programme",
    summary: "Build strong fundamentals in software testing and start your QA career with confidence.",
    topics: [
      "QA fundamentals, SDLC, STLC and testing methods",
      "Test scenarios, test cases and test data",
      "Defect life cycle, bug reporting and Jira",
      "First steps in API, SQL and test automation",
      "Practical exercises on a sample e-commerce app",
    ],
    months: 3,
    classes: 36,
    hours: 36,
    curriculum: [
      "Introduction to software testing and QA fundamentals",
      "SDLC, STLC and testing methodologies",
      "Functional and non-functional testing",
      "Test scenarios, test cases and test data preparation",
      "Defect life cycle and bug reporting",
      "Jira and test management basics",
      "Agile and Scrum fundamentals",
      "Basic API testing concepts and introduction to Postman",
      "SQL fundamentals and database validation",
      "Introduction to test automation: why and when to automate",
      "Overview of Selenium and Playwright",
      "Practical exercises using a sample e-commerce application",
    ],
    price: 10000,
    was: 12000,
    offer: "Launch Offer",
    photo: "/photos/foundation.webp",
    photoAlt: "A learner smiling while studying on a laptop",
  },
  {
    id: "advanced",
    chip: "Level 2 · Advanced",
    audience: "For Career Growth",
    name: "QA Advanced Programme",
    summary: "Develop advanced skills and gain experience in automation, APIs, databases and CI/CD.",
    topics: [
      "API testing with Postman, SQL and database testing",
      "JavaScript fundamentals for test automation",
      "Selenium and Playwright with Page Object Model",
      "Git, GitHub and CI/CD with GitHub Actions",
      "End-to-end project work and interview preparation",
    ],
    months: 3,
    classes: 36,
    hours: 36,
    curriculum: [
      "Advanced manual testing techniques",
      "API testing using Postman",
      "SQL queries and database testing",
      "JavaScript fundamentals for test automation",
      "Selenium automation fundamentals",
      "Playwright automation with hands-on exercises",
      "Locators, assertions, waits and browser interactions",
      "Reusable automation scripts and Page Object Model",
      "Test execution, debugging and reporting",
      "Git and GitHub fundamentals",
      "Introduction to CI/CD and GitHub Actions",
      "End-to-end testing of the sample e-commerce application",
      "Practical project work and interview preparation",
    ],
    price: 15000,
    priceNote: "per student, complete 3-month programme",
    photo: "/photos/advanced.webp",
    photoAlt: "A QA engineer at his desk with test results on screen",
  },
  {
    id: "pathway",
    chip: "Complete QA Learning Pathway",
    audience: "Best Value",
    name: "6 Months · Foundation + Advanced",
    summary: "A complete learning journey from fundamentals to advanced skills with one continuous project.",
    topics: [
      "Everything in Foundation and Advanced",
      "One continuous e-commerce project",
      "72 live classes (72 hours)",
      "Build a strong portfolio of real testing work",
      "Best value for long-term career growth",
    ],
    months: 6,
    classes: 72,
    hours: 72,
    price: 24000,
    was: 27000,
    offer: "Save ₹3,000",
    photo: "/photos/pathway.webp",
    photoAlt: "A learner taking notes during a live online class",
  },
];

/** Shared schedule for every programme. */
export const schedule = { perWeek: 3, hoursPerClass: 1, weekend: 2, weekday: 1, mode: "Live Online" };

/** The Complete QA Learning Pathway, as Genix describes it. */
export const pathwayIntro =
  "The combined Foundation + Advanced pathway takes learners from QA fundamentals through manual testing, API and database validation, practical automation exposure, and end-to-end testing using the sample e-commerce application.";

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** The free trial session, as described by Genix. */
export const trialIncludes = ["Live Interactive Session", "Course Overview", "Sample Practical Exercise", "Q&A and Guidance"];
