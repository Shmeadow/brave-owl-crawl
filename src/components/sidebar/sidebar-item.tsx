"use client";

import React from "react";
import { Button, Tooltip, YStack } from "tamagui";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isExpanded: boolean;
}

export function SidebarItem({ icon: Icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <Tooltip placement="right">
      <Tooltip.Trigger asChild>
        <Button
          icon={<Icon size={28} color="white" />}
          circular
          size="$5"
          onPress={onClick}
          backgroundColor={isActive ? "$blue7" : "transparent"}
          hoverStyle={{ backgroundColor: "$gray7" }}
          pressStyle={{ backgroundColor: "$gray8" }}
          borderWidth={isActive ? 2 : 0}
          borderColor={isActive ? "$blue8" : "transparent"}
          focusStyle={{ outlineWidth: 0 }}
        />
      </Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={[
          "quick",
          {
            opacity: {
              overshoot: true,
            },
          },
        ]}
        backgroundColor="$gray10"
        borderColor="$gray11"
        borderWidth={1}
      >
        <Tooltip.Arrow backgroundColor="$gray10" />
        <YStack>
          {label}
        </YStack>
      </Tooltip.Content>
    </Tooltip>
  );
}