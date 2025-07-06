"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { Button } from './ui/button';

const features = [
  { name: 'Focus Tracking', free: '5 Sessions', pro: '10 Sessions', unlimited: 'Unlimited' },
  { name: 'Background Themes', free: '45 mins/day', pro: 'Unlimited', unlimited: 'Unlimited + Custom' },
  { name: 'Mood Journal', free: <Minus className="text-muted-foreground" />, pro: <Minus className="text-muted-foreground" />, unlimited: <Check className="text-green-500" /> },
  { name: 'Task Management', free: 'Basic', pro: 'Unlimited', unlimited: 'Unlimited' },
  { name: 'Pomodoro Settings', free: <Check className="text-green-500" />, pro: <Check className="text-green-500" />, unlimited: <Check className="text-green-500" /> },
  { name: 'Analytics', free: <Minus className="text-muted-foreground" />, pro: 'Basic', unlimited: 'Premium' },
  { name: 'Music Widgets', free: <Check className="text-green-500" />, pro: <Check className="text-green-500" />, unlimited: <Check className="text-green-500" /> },
  { name: 'Date/Time Display', free: <Check className="text-green-500" />, pro: <Check className="text-green-500" />, unlimited: <Check className="text-green-500" /> },
  { name: 'Ambience Controls', free: 'Basic', pro: 'Sound Packs', unlimited: 'Sound Packs' },
  { name: 'Profile Customization', free: 'Basic', pro: 'Basic', unlimited: 'Full' },
  { name: 'Cloud Sync', free: <Minus className="text-muted-foreground" />, pro: <Minus className="text-muted-foreground" />, unlimited: <Check className="text-green-500" /> },
];

export function FeatureComparisonGrid({ onChoosePlan }: { onChoosePlan: () => void }) {
  return (
    <Card className="mt-16 w-full max-w-6xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b">
                <th className="p-4 font-semibold">Feature</th>
                <th className="p-4 font-semibold text-center">Free</th>
                <th className="p-4 font-semibold text-center">Pro</th>
                <th className="p-4 font-semibold text-center">Unlimited</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="p-4 font-medium">{feature.name}</td>
                  <td className="p-4 text-center text-muted-foreground">{feature.free}</td>
                  <td className="p-4 text-center text-muted-foreground">{feature.pro}</td>
                  <td className="p-4 text-center font-semibold text-primary">{feature.unlimited}</td>
                </tr>
              ))}
              <tr className="bg-muted/50">
                <td className="p-4 font-semibold"></td>
                <td className="p-4 text-center"><Button variant="link" onClick={onChoosePlan}>Choose Plan</Button></td>
                <td className="p-4 text-center"><Button variant="link" onClick={onChoosePlan}>Choose Plan</Button></td>
                <td className="p-4 text-center"><Button variant="link" onClick={onChoosePlan}>Choose Plan</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}