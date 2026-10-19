const MAX = 2000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: pretend success so bots learn nothing.
  if (clean(body.website)) return Response.json({ ok: true });

  const enquiry = {
    source: clean(body.source) === "enrol" ? "enrol" : "contact",
    type: clean(body.type),
    name: clean(body.name),
    email: clean(body.email),
    phone: clean(body.phone),
    loc: clean(body.loc),
    edu: clean(body.edu),
    role: clean(body.role),
    msg: clean(body.msg),
    receivedAt: new Date().toISOString(),
  };

  if (!enquiry.name) return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL.test(enquiry.email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (enquiry.source === "enrol" && !enquiry.phone) return Response.json({ error: "Please enter your phone number." }, { status: 400 });
  if (body.consent !== "on" && body.consent !== true) return Response.json({ error: "Please accept the Privacy Policy to continue." }, { status: 400 });

  const webhook = process.env.ENQUIRY_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiry),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      return Response.json({ ok: true });
    } catch (err) {
      console.error("Enquiry delivery failed", err);
      return Response.json({ error: "We could not send your message. Please try again later." }, { status: 502 });
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[enquiry] ENQUIRY_WEBHOOK_URL not set; dev log only:", enquiry);
    return Response.json({ ok: true });
  }

  console.error("ENQUIRY_WEBHOOK_URL is not configured; enquiry was not delivered.");
  return Response.json({ error: "Enquiries are temporarily unavailable. Please try again later." }, { status: 503 });
}
