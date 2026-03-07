import { api } from "@/lib/api";
import { MySubnetsManager } from "@/components/tao/MySubnetsManager";

export const dynamic = "force-dynamic";

export default async function MySubnetsPage() {
  const subnets = await api.mySubnets();
  return <MySubnetsManager subnets={subnets} />;
}
