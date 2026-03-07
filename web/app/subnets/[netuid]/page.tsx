import { api } from "@/lib/api";
import { NeuronTable } from "@/components/tao/NeuronTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SubnetDetailPage({
  params,
}: {
  params: { netuid: string };
}) {
  const netuid = parseInt(params.netuid, 10);
  const [subnet, neurons] = await Promise.all([api.subnet(netuid), api.neurons(netuid)]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">
          {subnet.subnet_name ?? `Subnet ${netuid}`}
          {subnet.symbol && <span className="ml-2 text-muted-foreground font-normal text-lg">{subnet.symbol}</span>}
        </h1>
        <span className="text-muted-foreground">#{netuid}</span>
        {subnet.is_my_subnet && <Badge>⭐ mine</Badge>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Max Neurons</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{subnet.max_neurons ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Emission</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{subnet.emission_value?.toFixed(4) ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tempo</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{subnet.tempo ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Alpha Price (τ)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {subnet.alpha_price_tao != null ? subnet.alpha_price_tao.toFixed(6) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Immunity Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subnet.immunity_period_human ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{subnet.immunity_period != null ? `${subnet.immunity_period} blocks` : ""}</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">
        Owner: <span className="font-mono">{subnet.owner ?? "—"}</span>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Top Neurons by Stake</h2>
        <NeuronTable neurons={neurons} />
      </div>
    </div>
  );
}
