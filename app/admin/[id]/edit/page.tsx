import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Artwork, formatCat } from "@/lib/types";
import { attachSizes } from "@/lib/artworks";
import ArtworkForm from "@/components/ArtworkForm";
import DeleteArtworkButton from "@/components/DeleteArtworkButton";

export default async function EditArtworkPage({ params }: { params: { id: string } }) {
  const { data: found } = await createClient()
    .from("artworks")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<Artwork>();

  if (!found) notFound();
  const [artwork] = await attachSizes([found]);

  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">Cat. {formatCat(artwork.catalogue_number)}</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">{artwork.title}</h1>
      </div>
      <div className="px-5 py-6 md:px-10 md:py-8">
        <ArtworkForm artwork={artwork} />

        <div className="mt-12 flex max-w-2xl flex-col gap-2 border-t-2 border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm opacity-65">
            Delete removes this piece and its photos permanently. To take it off the site but keep it, set Status to Hidden.
          </span>
          <DeleteArtworkButton
            id={artwork.id}
            title={artwork.title}
            imageUrls={artwork.image_urls}
            redirectTo="/admin/works"
            className="btn btn-secondary shrink-0 px-4 py-2.5 text-sm text-accent"
          />
        </div>
      </div>
    </>
  );
}
