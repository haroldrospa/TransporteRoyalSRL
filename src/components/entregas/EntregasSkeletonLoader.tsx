import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const EntregasSkeletonLoader = () => {
  return (
    <div className="container mx-auto p-4 space-y-6" translate="no">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full">
        <div className="grid w-full grid-cols-3 h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium opacity-50">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium opacity-50">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium opacity-50">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="mt-4">
          <Card>
            <CardContent className="p-0">
              {/* Table Header Skeleton */}
              <div className="border-b bg-slate-50 p-4">
                <div className="grid grid-cols-10 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>

              {/* Table Rows Skeleton */}
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="grid grid-cols-10 gap-4 items-center">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center py-8" translate="no">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-slate-600">{'Cargando entregas...'}</span>
        </div>
      </div>
    </div>
  );
};