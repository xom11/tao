import { api } from "@/lib/api";
import { NeuronTable } from "@/components/tao/NeuronTable";
import { MinerChart } from "@/components/tao/MinerChart";
import { SubnetHistoryChart } from "@/components/tao/SubnetHistoryChart";
import { MinerHistoryChart } from "@/components/tao/MinerHistoryChart";
import { SubnetNotes } from "@/components/tao/SubnetNotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SubnetDetailPage({
  params,
}: {
  params: { netuid: string };
}) {
  const BLOCKS_PER_DAY = 7200;

  const netuid = parseInt(params.netuid, 10);
  const [subnet, neurons, history, minerHistory] = await Promise.all([
    api.subnet(netuid),
    api.neurons(netuid),
    api.subnetHistory(netuid),
    api.minerHistory(netuid),
  ]);

  const tempo = subnet.tempo ?? 100;
  function calcDaily(n: { daily_tao: number | null; emission_tao: number | null }) {
    if (n.daily_tao != null) return n.daily_tao;
    if (n.emission_tao == null || tempo === 0) return 0;
    return (n.emission_tao / tempo) * BLOCKS_PER_DAY;
  }
  const validators = neurons.filter((n) => n.role === "validator");
  const miners = neurons.filter((n) => n.role === "miner");
  const owners = neurons.filter((n) => n.role === "owner");
  const validatorDaily = validators.reduce((s, n) => s + calcDaily(n), 0);
  const minerDaily = miners.reduce((s, n) => s + calcDaily(n), 0);
  const validatorsEarning = validators.filter((n) => calcDaily(n) > 0).length;
  const minersEarning = miners.filter((n) => calcDaily(n) > 0).length;

  function fTao(v: number) {
    return v >= 1000 ? `${(v / 1000).toFixed(2)}k` : v.toFixed(2);
  }

  const links = [
    subnet.subnet_url && { label: "Website", href: subnet.subnet_url, icon: "🌐" },
    subnet.github_repo && { label: "GitHub", href: subnet.github_repo, icon: "⌨️" },
    subnet.discord && {
      label: `Discord: ${subnet.discord}`,
      href: `https://discord.com/users/${subnet.discord}`,
      icon: "💬",
    },
    subnet.subnet_contact && { label: subnet.subnet_contact, href: `mailto:${subnet.subnet_contact}`, icon: "✉️" },
  ].filter(Boolean) as { label: string; href: string; icon: string }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {subnet.logo_url && (
          <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border bg-muted">
            <Image
              src={subnet.logo_url}
              alt={subnet.subnet_name ?? `SN${netuid}`}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">
              {subnet.subnet_name ?? `Subnet ${netuid}`}
            </h1>
            {subnet.symbol && (
              <span className="text-muted-foreground font-normal text-lg">{subnet.symbol}</span>
            )}
            <span className="text-muted-foreground text-sm">#{netuid}</span>
            {subnet.is_my_subnet && <Badge>⭐ mine</Badge>}
          </div>
          {subnet.description && (
            <p className="text-sm text-muted-foreground mt-1">{subnet.description}</p>
          )}
          {links.length > 0 && (
            <div className="flex gap-3 mt-2 flex-wrap">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm text-muted-foreground">Max Neurons</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{subnet.max_neurons ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Emission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {subnet.emission_value != null ? `${(subnet.emission_value * 100).toFixed(2)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tempo</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{subnet.tempo ?? "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Immunity Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subnet.immunity_period_human ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {subnet.immunity_period != null ? `${subnet.immunity_period} blocks` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Register Fee (τ)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {subnet.register_fee_tao != null ? subnet.register_fee_tao.toFixed(4) : "—"}
            </p>
          </CardContent>
        </Card>
        {/* Neuron role stats — luôn hiện dù đang ở tab nào */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Validators — Daily TAO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold font-mono">{fTao(validatorDaily)} τ</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{validatorsEarning}/{validators.length}</span> earning
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">Miners — Daily TAO</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">{fTao(minerDaily)} τ</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{minersEarning}/{miners.length}</span> earning
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Owner</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="font-mono text-sm break-all">{subnet.owner ?? "—"}</p>
            {owners.length > 0 && (
              <p className="text-xs text-muted-foreground shrink-0">
                <span className="font-medium text-amber-600 dark:text-amber-400">{owners.length}</span> neuron
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <SubnetNotes netuid={netuid} initialNotes={subnet.notes ?? null} />

      <Tabs defaultValue="metagraph">
        <TabsList>
          <TabsTrigger value="metagraph">Metagraph</TabsTrigger>
          <TabsTrigger value="chart">Miner Chart</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="metagraph">
          <NeuronTable neurons={neurons} tempo={subnet.tempo ?? 100} />
        </TabsContent>
        <TabsContent value="chart">
          <div className="space-y-10">
            <MinerChart neurons={neurons} tempo={subnet.tempo ?? 100} />
            <div>
              <p className="text-sm font-medium mb-3">Miner Daily TAO History</p>
              <MinerHistoryChart data={minerHistory} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <SubnetHistoryChart history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
