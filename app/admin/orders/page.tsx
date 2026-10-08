import { OrdersTable } from "../components";
import { getAdminOrders } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">Paid through Square</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Orders</h1>
      </div>
      <div className="px-5 py-5 md:px-10 md:py-7">
        <OrdersTable orders={orders} />
      </div>
    </>
  );
}
