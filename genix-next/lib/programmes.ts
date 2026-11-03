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
      "Software testing fundamentals & SDLC",
      "Agile, Scrum and QA roles",
      "Manual testing, test cases and test data",
      "Defect management and regression testing",
      "Hands-on practice with a real e-commerce project",
    ],
    months: 3,
    classes: 36,
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
      "API testing with Postman",
      "SQL and database testing",
      "Test automation with Playwright / Selenium",
      "Git, CI/CD and pipeline testing",
      "Advanced scenarios on the real e-commerce project",
    ],
    months: 3,
    classes: 36,
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
    price: 24000,
    was: 27000,
    offer: "Save ₹3,000",
    photo: "/photos/pathway.webp",
    photoAlt: "A learner taking notes during a live online class",
  },
];

/** Shared schedule for every programme. */
export const schedule = { perWeek: 3, hoursPerClass: 1, mode: "Live Online" };

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** The free trial session, as described by Genix. */
export const trialIncludes = ["Live Interactive Session", "Course Overview", "Sample Practical Exercise", "Q&A and Guidance"];
