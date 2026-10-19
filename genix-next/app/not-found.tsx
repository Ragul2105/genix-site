import Link from "next/link";
import PageHero from "@/components/PageHero";

export default function NotFound() {
  return (
    <>
      <PageHero eyebrow="404" title="Page not found">The page you are looking for does not exist.</PageHero>
      <section className="sec"><div className="w"><Link className="btn y" href="/">Back to home</Link></div></section>
    </>
  );
}
