export default function Flow({ items }: { items: string[] }) {
  return <ul className="flow">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
