import { notFound } from "next/navigation";

// Every checkout lives at /<token>; the bare domain is nothing to a payer.
export default function Home() {
  notFound();
}
