import { api } from "@/lib/api";
import { NeuronTable } from "@/components/tao/NeuronTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SubnetDetailPage({
  params,
}: {
  params: { netuid: string };
}) {
  const netuid = parseInt(params.netuid, 10);
  const [subnet, neurons] = await Promise.all([api.subnet(netuid), api.neurons(netuid)]);

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
