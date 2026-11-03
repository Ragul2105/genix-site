export type NavItem = { href: string; label: string; children?: { href: string; label: string }[] };

/** Main navigation, grouped as in the client's reference. Every link points at a page or section that exists. */
export const nav: NavItem[] = [
  { href: "/", label: "Home" },
  {
    href: "/programme", label: "QA Training", children: [
      { href: "/#foundation", label: "Foundation Programme" },
      { href: "/#advanced", label: "Advanced Programme" },
      { href: "/#pathway", label: "Complete QA Pathway" },
      { href: "/programme#curriculum", label: "Course Syllabus" },
      { href: "/enrol?interest=trial", label: "Free Trial Session" },
      { href: "/enrol", label: "Enrol Now" },
    ],
  },
  { href: "/approach", label: "Our Approach" },
  {
    href: "/careers", label: "Resources", children: [
      { href: "/careers", label: "Careers & Certification" },
      { href: "/careers#interview", label: "Interview Preparation" },
      { href: "/contact#faq", label: "FAQs" },
    ],
  },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** Footer columns (reference layout). */
export const footerCols = [
  {
    title: "QA Training", links: [
      { href: "/#foundation", label: "Foundation Programme" },
      { href: "/#advanced", label: "Advanced Programme" },
      { href: "/#pathway", label: "Complete QA Pathway" },
      { href: "/programme#curriculum", label: "Course Syllabus" },
      { href: "/enrol?interest=trial", label: "Free Trial Session" },
      { href: "/enrol", label: "Enrol Now" },
    ],
  },
  {
    title: "Testing Services", links: [
      { href: "/#svc-manual", label: "Manual Testing" },
      { href: "/#svc-automation", label: "Test Automation" },
      { href: "/#svc-manual", label: "API Testing" },
      { href: "/#svc-manual", label: "Database Testing" },
      { href: "/#svc-support", label: "End-to-End QA" },
      { href: "/contact#business", label: "Request a Quote" },
    ],
  },
  {
    title: "Resources", links: [
      { href: "/careers", label: "Careers & Certification" },
      { href: "/careers#interview", label: "Interview Preparation" },
      { href: "/contact#faq", label: "FAQs" },
    ],
  },
  {
    title: "About Us", links: [
      { href: "/about", label: "About Genix" },
      { href: "/approach", label: "Our Approach" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund Policy" },
];

/** Fill these in once approved. Anything left null is hidden from the site. */
export const contact: {
  email: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
  social: { label: string; href: string }[];
} = { email: null, phone: null, address: null, hours: null, social: [] };

export const journey = [
  "Search", "Product", "Cart", "Login", "Address", "Delivery",
  "Coupon", "Payment", "Order", "Notification", "My Orders",
];

export const layers = [
  "Browser / UI", "API", "Application Services", "Database", "External Systems",
];

/** Journey phases (NN/g journey-map phases), as [label, number of journey steps]. */
export const journeyPhases: [string, number][] = [
  ["Discover", 2],
  ["Checkout", 6],
  ["After purchase", 3],
];

/** What the highlighted step does in each layer (same story as the hero "charged twice" ticket). */
export const traceStep = "Payment";
export const traceNotes = [
  "Pay button submits",
  "POST /payments",
  "Charge + retry logic",
  "Order record written",
  "Payment provider",
];

/** `art` is a Storyset "Rafiki" illustration in public/illustrations/ (free licence: credited in the footer). */
export const learningCycle = [
  { title: "Real World", text: "Meet a realistic QA situation.", art: "real-world" },
  { title: "Think", text: "Decide what you would do.", art: "think" },
  { title: "Learn", text: "Introduce the relevant concept.", art: "learn" },
  { title: "See", text: "Watch professional practice demonstrated.", art: "see" },
  { title: "Do", text: "Perform the activity yourself.", art: "do" },
  { title: "Discuss", text: "Review decisions, mistakes and alternatives.", art: "discuss" },
  { title: "Interview", text: "Turn the experience into an interview answer.", art: "interview" },
  { title: "Reflect", text: "Consider how you would handle it on the job.", art: "reflect" },
];

export const logistics = [
  "Duration", "Schedule", "Delivery mode", "Fees",
  "Prerequisites", "Batch dates", "Trainer details", "Tools and technologies",
];
