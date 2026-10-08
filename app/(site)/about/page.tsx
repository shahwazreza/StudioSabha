import type { Metadata } from "next";
import ArtistAbout from "@/components/ArtistAbout";
import CommissionPoster from "@/components/CommissionPoster";
import SelectedWork from "@/components/SelectedWork";
import { getPortfolio } from "@/lib/artworks";
import { getAbout } from "@/lib/about";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About | StudioSabha",
};

export default async function AboutPage() {
  const [portfolio, about] = await Promise.all([getPortfolio(), getAbout()]);

  return (
    <div className="mx-auto max-w-page">
      <ArtistAbout about={about} full showWorkLink={portfolio.length > 0} />
      <SelectedWork pieces={portfolio} />
      <CommissionPoster />
    </div>
  );
}
