import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import InquiryLayout from "@/components/InquiryLayout";
import { getArtworkById } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Contact | StudioSabha",
};

// "Ask about this piece" links here with ?artwork=<id>.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: { artwork?: string };
}) {
  const artwork = searchParams.artwork ? await getArtworkById(searchParams.artwork) : null;

  return (
    <InquiryLayout mode="contact">
      <ContactForm
        defaultType={artwork ? "listed_piece" : "question"}
        artwork={
          artwork
            ? { id: artwork.id, title: artwork.title }
            : undefined
        }
      />
    </InquiryLayout>
  );
}
