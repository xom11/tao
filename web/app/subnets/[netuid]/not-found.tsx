import Link from "next/link";

export default function SubnetNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <h1 className="text-4xl font-bold">Subnet not found</h1>
      <p className="text-muted-foreground">
        This subnet doesn&apos;t exist or hasn&apos;t been collected yet.
      </p>
      <Link
        href="/subnets"
        className="text-sm text-primary hover:underline"
      >
        Browse all subnets
      </Link>
    </div>
  );
}
