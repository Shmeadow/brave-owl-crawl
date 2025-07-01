"use client";

import React, { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DashboardTabsSidebar } from "@/components/dashboard-tabs-sidebar"; // Renamed import
import { ChatPanel } from "@/components/chat-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("spaces"); // Default active tab

  // Placeholder content for different tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "spaces":
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Featured Spaces</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for Featured Space Cards */}
                <Card className="relative h-48 overflow-hidden group bg-card/50 backdrop-blur-sm">
                  <img src="/placeholder-space-1.jpg" alt="Rain Forest" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-4 text-white">
                    <h3 className="font-semibold text-lg">Rain Forest – Seattle, WA</h3>
                    <p className="text-sm text-gray-200">Mount Shuksan coffee stop ☕ jazzy lofi mix</p>
                    <button className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">Join</button>
                  </div>
                </Card>
                <Card className="relative h-48 overflow-hidden group bg-card/50 backdrop-blur-sm">
                  <img src="/placeholder-space-2.jpg" alt="Cozy Cabin" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-4 text-white">
                    <h3 className="font-semibold text-lg">Cozy Cabin – Winter Retreat</h3>
                    <p className="text-sm text-gray-200">Crackling fireplace 🔥 ambient snow sounds</p>
                    <button className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">Join</button>
                  </div>
                </Card>
                <Card className="relative h-48 overflow-hidden group bg-card/50 backdrop-blur-sm">
                  <img src="/placeholder-space-3.jpg" alt="Beach Sunset" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-4 text-white">
                    <h3 className="font-semibold text-lg">Beach Sunset – Malibu, CA</h3>
                    <p className="text-sm text-gray-200">Ocean waves 🌊 chillwave playlist</p>
                    <button className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">Join</button>
                  </div>
                </Card>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Recommended Spaces</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder for Recommended Space Cards */}
                {[
                  { title: "Lotus Lake", subtitle: "Bali, Indonesia", img: "/placeholder-space-4.jpg" },
                  { title: "Mount Rainier Lake", subtitle: "Blue Bottle, SF", img: "/placeholder-space-5.jpg" },
                  { title: "Amsterdam Loft", subtitle: "rainy café in Amsterdam", img: "/placeholder-space-6.jpg" },
                  { title: "Seoul, Korea", subtitle: "City lights, K-pop beats", img: "/placeholder-space-7.jpg" },
                  { title: "SFO Airport", subtitle: "Travel vibes, ambient sounds", img: "/placeholder-space-8.jpg" },
                  { title: "Warmth", subtitle: "Cozy fireplace, soft blankets", img: "/placeholder-space-9.jpg" },
                  { title: "Empire State", subtitle: "NYC skyline, jazz music", img: "/placeholder-space-10.jpg" },
                  { title: "Sunrise work session", subtitle: "Morning glow, inspiring tunes", img: "/placeholder-space-11.jpg" },
                  { title: "Lotus Pond in Kyoto", subtitle: "Zen garden, peaceful melodies", img: "/placeholder-space-12.jpg" },
                  { title: "Empty boat in the sea", subtitle: "Calm waters, distant gulls", img: "/placeholder-space-13.jpg" },
                  { title: "Cypress Tree Tunnel", subtitle: "Misty forest, nature sounds", img: "/placeholder-space-14.jpg" },
                  { title: "Martian Art by NASA’s HiRISE Camera", subtitle: "Sci-fi ambient, cosmic views", img: "/placeholder-space-15.jpg" },
                  { title: "A train ride of peace and quiet", subtitle: "Rhythmic clicks, passing landscapes", img: "/placeholder-space-16.jpg" },
                  { title: "Cozy Rain", subtitle: "Gentle downpour, warm indoors", img: "/placeholder-space-17.jpg" },
                ].map((space, index) => (
                  <Card key={index} className="relative h-48 overflow-hidden group bg-card/50 backdrop-blur-sm">
                    <img src={space.img} alt={space.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex flex-col justify-end p-4 text-white">
                      <h3 className="font-semibold text-lg">{space.title}</h3>
                      <p className="text-sm text-gray-200">{space.subtitle}</p>
                      <button className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">Join</button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        );
      case "sounds":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Sounds Panel Content (Lofi Audio Playlist)</CardContent>
          </Card>
        );
      case "cal":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Calendar Panel Content</CardContent>
          </Card>
        );
      case "timer":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Timer Panel Content (Pomodoro)</CardContent>
          </Card>
        );
      case "tasks":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Tasks Panel Content</CardContent>
          </Card>
        );
      case "notes":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Notes Panel Content</CardContent>
          </Card>
        );
      case "media":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Media Gallery Content</CardContent>
          </Card>
        );
      case "fortune":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Fortune Teller Content</CardContent>
          </Card>
        );
      case "breathe":
        return (
          <Card className="h-full flex items-center justify-center bg-card/80 backdrop-blur-md">
            <CardContent className="text-foreground">Breathe Animation Content</CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full pt-16"> {/* Padding top for fixed header */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar for Dashboard Tabs */}
        <ResizablePanel defaultSize={15} minSize={10} maxSize={25} className="hidden sm:block">
          <DashboardTabsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors hidden sm:flex" />

        {/* Main Content Area (contains renderTabContent and ChatPanel) */}
        <ResizablePanel defaultSize={85} minSize={50}>
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={65} minSize={40} className="p-4 overflow-y-auto">
              {renderTabContent()}
              <MadeWithDyad />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize={35} minSize={25} className="p-4">
              <ChatPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}