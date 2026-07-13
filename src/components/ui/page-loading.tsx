import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading({
  cards = 4,
  rows = 6,
  withHeader = true,
}: {
  cards?: number;
  rows?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="space-y-6 animate-in fade-in-0">
      {withHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-[26rem] max-w-full" />
        </div>
      )}

      {cards > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-muted/40">
                <tr>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <th key={index} className="px-4 py-3">
                      <Skeleton className="h-3 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {Array.from({ length: 6 }).map((_, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-36" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
