"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Minus } from 'lucide-react';
import { Button } from './ui/button';

const features = [
  { name: 'Focus Tracking', free: '5 Sessions', pro: '10 Sessions', unlimited: 'Unlimited' },
  { name: 'Background Themes', free: '45 mins/day', pro: 'Unlimited', unlimited: 'Unlimited + Custom' },
  { name: 'Mood Journal', free: <Minus className="text-muted-foreground h-3 w-3" />, pro: <Minus className="text-muted-foreground h-3 w-3" />, unlimited: <Check className="text-green-500 h-3 w-3" /> }, // Reduced icon size
  { name: 'Task Management', free: 'Basic', pro: 'Unlimited', unlimited: 'Unlimited' },
  { name: 'Pomodoro Settings', free: <Check className="text-green-500 h-3 w-3" />, pro: <Check className="text-green-500 h-3 w-3" />, unlimited: <Check className="text-green-500 h-3 w-3" /> }, // Reduced icon size
  { name: 'Analytics', free: <Minus className="text-muted-foreground h-3 w-3" />, pro: 'Basic', unlimited: 'Premium' }, // Reduced icon size
  { name: 'Music Widgets', free: <Check className="text-green-500 h-3 w-3" />, pro: <Check className="text-green-500 h-3 w-3" />, unlimited: <Check className="text-green-500 h-3 w-3" /> }, // Reduced icon size
  { name: 'Date/Time Display', free: <Check className="text-green-500 h-3 w-3" />, pro: <Check className="text-green-500 h-3 w-3" />, unlimited: <Check className="text-green-500 h-3 w-3" /> }, // Reduced icon size
  { name: 'Ambience Controls', free: 'Basic', pro: 'Sound Packs', unlimited: 'Sound Packs' },
  { name: 'Profile Customization', free: 'Basic', pro: 'Basic', unlimited: 'Full' },
  { name: 'Cloud Sync', free: <Minus className="text-muted-foreground h-3 w-3" />, pro: <Minus className="text-muted-foreground h-3 w-3" />, unlimited: <Check className="text-green-500 h-3 w-3" /> }, // Reduced icon size
];

const CenteredCell = ({ children }: { children: React.ReactNode }) => (
  <td className="p-1.5 text-center text-muted-foreground text-xs"> {/* Reduced padding and font size */}
    {typeof children === 'string' ? (
      <span>{children}</span>
    ) : (
      <div className="flex justify-center items-center">{children}</div>
    )}
  </td>
);

export function FeatureComparisonGrid({ onChoosePlan }: { onChoosePlan: () => void }) {
  return (
    <Card className="mt-6 sm:mt-8 w-full"> {/* Reduced margin-top */}
      <CardHeader className="text-center pb-3 sm:pb-4"> {/* Reduced padding-bottom */}
        <CardTitle className="text-xl sm:text-2xl">Feature Comparison</CardTitle> {/* Reduced font size */}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] sm:min-w-[500px] text-left"> {/* Reduced min-width */}
            <thead>
              <tr className="border-b">
                <th className="p-1.5 font-semibold text-xs sm:text-sm">Feature</th> {/* Reduced padding and font size */}
                <th className="p-1.5 font-semibold text-center text-xs sm:text-sm">Free</th> {/* Reduced padding and font size */}
                <th className="p-1.5 font-semibold text-center text-xs sm:text-sm">Pro</th> {/* Reduced padding and font size */}
                <th className="p-1.5 font-semibold text-center text-xs sm:text-sm">Unlimited</th> {/* Reduced padding and font size */}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="p-1.5 font-medium text-xs sm:text-sm">{feature.name}</td> {/* Reduced padding and font size */}
                  <CenteredCell>{feature.free}</CenteredCell>
                  <CenteredCell>{feature.pro}</CenteredCell>
                  <CenteredCell><span className="font-semibold text-primary">{feature.unlimited}</span></CenteredCell>
                </tr>
              ))}
              <tr className="bg-muted/50">
                <td className="p-1.5 font-semibold"></td> {/* Reduced padding */}
                <td className="p-1.5 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs h-auto py-0.5">Choose Plan</Button></td> {/* Reduced padding and button size */}
                <td className="p-1.5 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs h-auto py-0.5">Choose Plan</Button></td> {/* Reduced padding and button size */}
                <td className="p-1.5 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs h-auto py-0.5">Choose Plan</Button></td> {/* Reduced padding and button size */}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}