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

const CenteredCell = ({ children }: { children: React.ReactNode }) => (
  <td className="p-3 text-center text-muted-foreground text-sm"> {/* Reduced p-4 to p-3, added text-sm */}
    {typeof children === 'string' ? (
      <span>{children}</span>
    ) : (
      <div className="flex justify-center items-center">{children}</div>
    )}
  </td>
);

export function FeatureComparisonGrid({ onChoosePlan }: { onChoosePlan: () => void }) {
  return (
    <Card className="mt-8 w-full"> {/* Reduced mt-16 to mt-8, removed max-w-6xl mx-auto */}
      <CardHeader className="text-center pb-4"> {/* Reduced pb-6 to pb-4 */}
        <CardTitle className="text-2xl">Feature Comparison</CardTitle> {/* Reduced text-3xl to text-2xl */}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto"> {/* Added overflow-x-auto */}
          <table className="w-full min-w-[500px] text-left"> {/* Reduced min-w-[600px] to min-w-[500px] */}
            <thead>
              <tr className="border-b">
                <th className="p-3 font-semibold text-sm">Feature</th> {/* Reduced p-4 to p-3, added text-sm */}
                <th className="p-3 font-semibold text-center text-sm">Free</th> {/* Reduced p-4 to p-3, added text-sm */}
                <th className="p-3 font-semibold text-center text-sm">Pro</th> {/* Reduced p-4 to p-3, added text-sm */}
                <th className="p-3 font-semibold text-center text-sm">Unlimited</th> {/* Reduced p-4 to p-3, added text-sm */}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="p-3 font-medium text-sm">{feature.name}</td> {/* Reduced p-4 to p-3, added text-sm */}
                  <CenteredCell>{feature.free}</CenteredCell>
                  <CenteredCell>{feature.pro}</CenteredCell>
                  <CenteredCell><span className="font-semibold text-primary">{feature.unlimited}</span></CenteredCell>
                </tr>
              ))}
              <tr className="bg-muted/50">
                <td className="p-3 font-semibold"></td> {/* Reduced p-4 to p-3 */}
                <td className="p-3 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs">Choose Plan</Button></td> {/* Reduced p-4 to p-3, added text-xs */}
                <td className="p-3 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs">Choose Plan</Button></td> {/* Reduced p-4 to p-3, added text-xs */}
                <td className="p-3 text-center"><Button variant="link" onClick={onChoosePlan} className="text-xs">Choose Plan</Button></td> {/* Reduced p-4 to p-3, added text-xs */}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}