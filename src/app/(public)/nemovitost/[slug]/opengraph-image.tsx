import { ImageResponse } from "next/og";
import { BRAND } from "@/config/brand";
import { getListingBySlug } from "@/db/queries/listings";
import { CATEGORY_LABELS, formatArea, formatPrice, OFFER_LABELS } from "@/lib/format";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ListingOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  const title = listing?.title ?? BRAND.tagline;
  const price = listing
    ? formatPrice(listing.price, listing.priceUnit, {
        priceOnRequest: listing.priceOnRequest,
      })
    : BRAND.name;
  const subtitle = listing
    ? [
        OFFER_LABELS[listing.offerType],
        CATEGORY_LABELS[listing.category],
        listing.district ?? listing.city,
        formatArea(listing.usableArea),
      ]
        .filter(Boolean)
        .join(" · ")
    : BRAND.description;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        backgroundColor: "#F4F4F6",
        backgroundImage:
          "radial-gradient(circle at 12% 10%, rgba(133, 96, 245, 0.22), transparent 55%), radial-gradient(circle at 90% 90%, rgba(218, 206, 255, 0.35), transparent 55%)",
        color: "#17171E",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <path
              d="M6 35V18C6 10.268 12.268 4 20 4s14 6.268 14 14v17h-7.2V18a6.8 6.8 0 1 0-13.6 0v17H6Z"
              fill="#6D3FE0"
            />
            <circle cx="20" cy="24.5" r="4.1" fill="#6D3FE0" />
          </svg>
          <span style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {BRAND.name}
          </span>
        </div>
        <div
          style={{
            background: "#ECE6FF",
            color: "#482699",
            padding: "10px 22px",
            borderRadius: "999px",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          {listing ? OFFER_LABELS[listing.offerType] : "Reality"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          background: "rgba(255, 255, 255, 0.84)",
          border: "1px solid rgba(23, 23, 30, 0.08)",
          borderRadius: "28px",
          padding: "40px 44px",
        }}
      >
        <div style={{ fontSize: "52px", fontWeight: 700, color: "#6D3FE0" }}>{price}</div>
        <div style={{ fontSize: "38px", fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: "24px", color: "#565665" }}>{subtitle}</div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "20px",
          color: "#6A6A7A",
        }}
      >
        <span>{BRAND.tagline}</span>
        <span>reaporta.cz</span>
      </div>
    </div>,
    { ...size },
  );
}
