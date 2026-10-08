import ArtworkForm from "@/components/ArtworkForm";

export default function NewArtworkPage() {
  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">Works</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Add a new piece</h1>
      </div>
      <div className="px-5 py-6 md:px-10 md:py-8">
        <ArtworkForm />
      </div>
    </>
  );
}
