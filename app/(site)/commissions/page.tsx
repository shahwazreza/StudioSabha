import type { Metadata } from "next";
import ContactForm from "../contact/ContactForm";
import InquiryLayout from "@/components/InquiryLayout";
import SelectedWork from "@/components/SelectedWork";
import { getPortfolio } from "@/lib/artworks";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Commissions | StudioSabha",
};

export default async function CommissionsPage() {
  const portfolio = await getPortfolio();

  return (
    <>
      <InquiryLayout mode="commission">
        <ContactForm defaultType="commission" />
      </InquiryLayout>
      {/* Her portrait work, as proof of what a commission can look like. */}
      <div className="mx-auto max-w-page">
        <SelectedWork pieces={portfolio} preview />
      </div>
    </>
  );
}
