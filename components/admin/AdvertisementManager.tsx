import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface AdvertisementManagerProps {
  startupCallId?: string;
}

export default function AdvertisementManager({ startupCallId }: AdvertisementManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advertisement Management</h2>
          <p className="text-muted-foreground">Create and manage advertising materials for startup calls</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Database Setup Required</CardTitle>
          <CardDescription>
            The advertisement management feature requires database setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Database Migration Required</h3>
            <p className="text-muted-foreground mb-4">
              The advertisement management feature requires database tables to be created.
              Please run the database migration to enable this feature.
            </p>
            <div className="bg-muted p-4 rounded-md mb-4 text-left">
              <p className="font-mono text-sm">npx prisma migrate deploy</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Once the migration is complete, refresh this page to access the advertisement management features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 