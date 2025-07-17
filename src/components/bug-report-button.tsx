"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bug } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabase } from '@/integrations/supabase/auth';
import { useGuestIdentity } from '@/hooks/use-guest-identity';

const bugReportSchema = z.object({
  report: z.string().min(10, { message: 'Please provide at least 10 characters.' }),
});

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useSupabase();
  const { guestId } = useGuestIdentity();

  const form = useForm<z.infer<typeof bugReportSchema>>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      report: '',
    },
  });

  const onSubmit = (values: z.infer<typeof bugReportSchema>) => {
    const userIdentifier = session ? `User ID: ${session.user.id}` : `Guest ID: ${guestId}`;
    const userAgent = navigator.userAgent;
    const body = encodeURIComponent(
      `Bug Report:\n${values.report}\n\n---\n${userIdentifier}\nBrowser: ${userAgent}`
    );
    const subject = encodeURIComponent('CozyHub Bug Report');
    
    window.location.href = `mailto:support@cozyhub.app?subject=${subject}&body=${body}`;
    
    toast.info("Opening your email client to send the report.");
    form.reset();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Submit a Bug">
          <Bug className="h-5 w-5" />
          <span className="sr-only">Submit a Bug</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[1100]" align="end">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Submit a Bug Report</h4>
            <p className="text-sm text-muted-foreground">
              Describe the issue you're encountering.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bug-report-textarea">Description</Label>
            <Textarea
              id="bug-report-textarea"
              placeholder="What went wrong?"
              {...form.register('report')}
              className="min-h-[100px]"
            />
            {form.formState.errors.report && (
              <p className="text-xs text-destructive">{form.formState.errors.report.message}</p>
            )}
          </div>
          <Button type="submit">Send Report</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}