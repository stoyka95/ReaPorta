import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StyleguideClient } from "./StyleguideClient";

export const metadata: Metadata = {
  title: "Design systém a styleguide",
  robots: { index: false, follow: false },
};

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_STYLEGUIDE !== "1") {
    notFound();
  }

  return <StyleguideClient />;
}
