import React from 'react';
import { Skeleton } from '@client/src/components/ui/skeleton';

const WorkDetailSkeleton: React.FC = () => (
  <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
    <Skeleton className="h-5 w-20 mb-6" />
    <Skeleton className="h-12 md:h-16 w-2/3 mb-4" />
    <Skeleton className="h-6 w-1/2 mb-8" />
    <Skeleton className="aspect-[16/9] w-full rounded-md mb-16" />
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-4/6" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  </section>
);

export default WorkDetailSkeleton;
