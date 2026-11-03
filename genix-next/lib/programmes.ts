/** The two programmes and the combined pathway, as supplied by Genix (home page reference, Nov 2026). Prices in INR. */
export type Programme = {
  id: "foundation" | "advanced" | "pathway";
  level: string;
  name: string;
  forWho: string;
  summary: string;
  topics: string[];
  months: number;
  classes: number;
  price: number;
  was?: number;
  chip?: string;
};

export const programmes: Programme[] = [
  {
    id: "foundation",
    level: "Level 1",
    name: "QA Foundation Programme",
    forWho: "For beginners",
    summary: "Build strong fundamentals in software testing and start your QA career with confidence.",
    topics: [
      "Software testing fundamentals and the SDLC",
      "Agile, Scrum and QA roles",
      "Manual testing, test cases and test data",
      "Defect management and regression testing",
      "Hands-on practice on a real e-commerce project",
    ],
    months: 3,
    classes: 36,
    price: 10000,
    was: 12000,
    chip: "Launch offer",
  },
  {
    id: "advanced",
    level: "Level 2",
    name: "QA Advanced Programme",
    forWho: "For learners with manual testing knowledge",
    summary: "Develop advanced skills and gain experience in automation, APIs, databases and CI/CD.",
    topics: [
      "API testing with Postman",
      "SQL and database testing",
      "Test automation with Playwright / Selenium",
      "Git, CI/CD and pipeline testing",
      "Advanced scenarios on the same e-commerce project",
    ],
    months: 3,
    classes: 36,
    price: 15000,
  },
  {
    id: "pathway",
    level: "Level 1 + 2",
    name: "Complete QA Learning Pathway",
    forWho: "Foundation and Advanced together",
    summary: "One learning journey from fundamentals to advanced skills, on one continuous project.",
    topics: [
      "Everything in Foundation and Advanced",
      "One continuous e-commerce project from start to finish",
      "A portfolio of real testing work to talk about in interviews",
    ],
    months: 6,
    classes: 72,
    price: 24000,
    was: 27000,
    chip: "Save ₹3,000",
  },
];

/** Shared schedule for every programme. */
export const schedule = { perWeek: 3, hoursPerClass: 1, mode: "Live online" };

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

/** The free trial session, as described by Genix. */
export const trialIncludes = ["Live interactive session", "Course overview", "Sample practical exercise", "Q&A and guidance"];
