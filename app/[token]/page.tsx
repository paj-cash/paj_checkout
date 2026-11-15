import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Checkout } from "@/components/Checkout";
import { ApiError, getCheckout } from "@/lib/api";

export const metadata: Metadata = { title: "Pay" };

/**
 * The hosted checkout. The first state is read here, on the server, so the
 * page arrives already showing the right screen; from then on the client
 * keeps it current over the API's checkout socket.
 */
export default async function CheckoutPage({ params }: PageProps<"/[token]">) {
  const { token } = await params;
  const view = await getCheckout(token).catch((error: unknown) => {
    // A token that opens nothing is a bad link; anything else is ours, and
    // goes to the error boundary with its retry.
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });

  return <Checkout token={token} initial={view} />;
}
