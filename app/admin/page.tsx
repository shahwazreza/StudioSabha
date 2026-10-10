import Link from "next/link";
import Greeting from "./Greeting";
import { InquiryCard, OrdersTable, SectionHeading, WorksTable } from "./components";
import { Plus } from "@/components/icons";
import { getAdminInquiries, getAdminOrders, getAdminWorks, startOfMonth } from "@/lib/admin-data";
import { formatCat, formatPrice } from "@/lib/types";
import { adminHref } from "@/lib/admin-path";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [works, orders, inquiries] = await Promise.all([
    getAdminWorks(),
    getAdminOrders(),
    getAdminInquiries(),
  ]);

  const forSale = works.filter((w) => w.status === "available");
  const onRequest = works.filter((w) => w.status === "inquire_only").length;
  const monthStart = startOfMonth();
  const soldThisMonth = orders.filter(
    (o) => ["paid", "fulfilled"].includes(o.status) && new Date(o.created_at) >= monthStart
  );
  const prints = forSale.filter((w) => w.is_print);
  const printsLeft = prints.reduce((sum, w) => sum + w.quantity_available, 0);
  const newInquiries = inquiries.filter((i) => !i.replied_at);

  const kpis = [
    { label: "Available", value: formatCat(forSale.length), detail: onRequest ? `for sale · ${onRequest} on request` : "works for sale", red: false },
    { label: "Sold this month", value: formatCat(soldThisMonth.length), detail: `${formatPrice(soldThisMonth.reduce((s, o) => s + o.total_cents, 0))} total`, red: false },
    { label: "Prints left", value: formatCat(printsLeft), detail: prints.length ? `across ${prints.length} edition${prints.length === 1 ? "" : "s"}` : "no prints listed", red: false },
    { label: "New inquiries", value: formatCat(newInquiries.length), detail: newInquiries.length ? "need a reply" : "all caught up", red: newInquiries.length > 0 },
  ];

  // Unanswered first, then the latest answered ones.
  const inquiryPreview = [...newInquiries, ...inquiries.filter((i) => i.replied_at)].slice(0, 3);

  return (
    <>
      <div className="flex flex-col gap-3.5 border-b-2 border-rule px-5 pb-[18px] pt-6 md:flex-row md:items-end md:justify-between md:px-10 md:pb-6 md:pt-9">
        <Greeting />
        <Link href={adminHref("/new")} className="btn btn-primary whitespace-nowrap px-4 py-[15px] text-[15px] md:px-[18px] md:py-3.5">
          Add new piece <Plus className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-rule md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border-b border-r border-rule px-5 py-3.5 md:border-b-0 md:py-5 md:pl-10 md:pr-6">
            <div className="text-[10px] uppercase tracking-[0.1em] opacity-60 md:text-[11px]">{k.label}</div>
            <div className={`text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-5xl ${k.red ? "text-accent" : ""}`}>
              {k.value}
            </div>
            <div className="hidden text-xs opacity-65 md:block">{k.detail}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-[8fr_4fr]">
        <div className="order-2 px-5 py-5 md:order-1 md:border-r-2 md:border-rule md:px-10 md:py-7">
          <SectionHeading title="Works" href={adminHref("/works")} linkLabel={`All ${formatCat(works.length)}`} />
          <WorksTable works={works.slice(0, 6)} />

          <div className="mt-8">
            <SectionHeading title="Recent orders" href={adminHref("/orders")} linkLabel="All orders" />
            <OrdersTable orders={orders.slice(0, 5)} />
          </div>
        </div>

        <div className="order-1 px-5 pt-5 md:order-2 md:px-8 md:py-7">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-xl md:text-2xl">Inquiries</h3>
            {newInquiries.length > 0 && <span className="tag tag-accent">{newInquiries.length} new</span>}
          </div>
          {inquiryPreview.length ? (
            inquiryPreview.map((i) => <InquiryCard key={i.id} inquiry={i} />)
          ) : (
            <p className="border-t-2 border-rule py-4 opacity-65">No inquiries yet.</p>
          )}
          {inquiries.length > 3 && (
            <Link href={adminHref("/inquiries")} className="btn-ghost text-sm">
              All inquiries →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
