import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsSkeleton = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card className="card-gradient border-card-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-9 w-32 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="card-gradient border-card-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-9 w-32 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
