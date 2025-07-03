"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon } from "lucide-react";
import { useBackground } from "@/context/background-provider";
import { useEffects } from "@/context/effect-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSupabase } from "@/integrations/supabase/auth";

const staticImages = [
  "/bg1.jpg",
  "/bg2.jpg",
  "/bg3.jpg",
  "/bg4.jpg",
  "/bg5.jpg",
];

const animatedBackgrounds = [
  { videoUrl: "/ani1.mp4", thumbnailUrl: "/ani1.jpg" },
  { videoUrl: "/ani2.mp4", thumbnailUrl: "/ani2.jpg" },
  { videoUrl: "/ani3.mp4", thumbnailUrl: "/ani3.jpg" },
  { videoUrl: "/ani4.mp4", thumbnailUrl: "/ani4.mp4" },
  { videoUrl: "/ani5.mp4", thumbnailUrl: "/ani5.mp4" },
];

const LOCAL_STORAGE_CUSTOM_IMAGES_KEY = 'app_custom_background_images';

export function BackgroundEffectsMenu() {
  const { background, setBackground } = useBackground();
  const { activeEffect, setEffect } = useEffects();
  const { supabase, session } = useSupabase();

  const [customImages, setCustomImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load custom images from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCustomImages = localStorage.getItem(LOCAL_STORAGE_CUSTOM_IMAGES_KEY);
      if (savedCustomImages) {
        try {
          setCustomImages(JSON.parse(savedCustomImages));
        } catch (e) {
          console.error("Error parsing custom images from local storage:", e);
          localStorage.removeItem(LOCAL_STORAGE_CUSTOM_IMAGES_KEY); // Clear bad data
        }
      }
    }
  }, []);

  // Save custom images to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_IMAGES_KEY, JSON.stringify(customImages));
    }
  }, [customImages]);

  const handleBackgroundChange = (url: string, isVideo: boolean) => {
    setBackground(url, isVideo);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for image types
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file (JPG, PNG, GIF, etc.).");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadImage = async () => {
    if (!session || !supabase) {
      toast.error("You must be logged in to upload background images.");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select an image file to upload.");
      return;
    }

    setIsUploading(true);
    const fileExt = selectedFile.name.split('.').pop();
    // Ensure unique path for each user and file
    const fileName = `${session.user.id}/${Date.now()}-${selectedFile.name}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('backgrounds')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false, // Do not upsert, create new file
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('backgrounds')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const newImageUrl = publicUrlData.publicUrl;
        setCustomImages(prev => [...prev, newImageUrl]);
        setBackground(newImageUrl, false); // Set as current background
        toast.success("Background image uploaded and set!");
        setSelectedFile(null); // Clear selected file
      } else {
        toast.error("Failed to get public URL for uploaded image.");
      }
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Background Effects</h3>

      <Tabs defaultValue="static-images" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="static-images">Static</TabsTrigger>
          <TabsTrigger value="animated-backgrounds">Animated</TabsTrigger>
          <TabsTrigger value="custom-uploads">Custom</TabsTrigger>
          <TabsTrigger value="visual-effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="static-images" className="mt-4">
          <ScrollArea className="h-72">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {staticImages.map((imageUrl) => {
                const isActive = !background.isVideo && background.url === imageUrl;
                return (
                  <div
                    key={imageUrl}
                    className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${
                      isActive
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                    onClick={() => handleBackgroundChange(imageUrl, false)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Background ${imageUrl.split("/").pop()}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">
                        Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="animated-backgrounds" className="mt-4">
          <ScrollArea className="h-72">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {animatedBackgrounds.map(({ videoUrl, thumbnailUrl }) => {
                const isActive = background.isVideo && background.url === videoUrl;
                return (
                  <div
                    key={videoUrl}
                    className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${
                      isActive
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                    onClick={() => handleBackgroundChange(videoUrl, true)}
                  >
                    <video
                      src={videoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">
                        Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* New Tab Content for Custom Uploads */}
        <TabsContent value="custom-uploads" className="mt-4">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Upload your own image backgrounds. Only visible to you.</p>
            <div className="space-y-2">
              <Label htmlFor="background-upload">Select Image</Label>
              <Input
                id="background-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || !session}
              />
              <Button
                onClick={handleUploadImage}
                className="w-full"
                disabled={!selectedFile || isUploading || !session}
              >
                {isUploading ? 'Uploading...' : 'Upload & Set Background'}
              </Button>
              {!session && (
                <p className="text-xs text-destructive">You must be logged in to upload custom backgrounds.</p>
              )}
            </div>
            <h4 className="text-md font-semibold mt-4">Your Uploaded Backgrounds</h4>
            <ScrollArea className="h-40 border rounded-md p-2">
              {customImages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No custom backgrounds uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {customImages.map((imageUrl) => {
                    const isActive = !background.isVideo && background.url === imageUrl;
                    return (
                      <div
                        key={imageUrl}
                        className={`relative w-full h-20 cursor-pointer rounded-md overflow-hidden group ${
                          isActive
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : "hover:ring-2 hover:ring-gray-300"
                        }`}
                        onClick={() => handleBackgroundChange(imageUrl, false)}
                      >
                        <img
                          src={imageUrl}
                          alt="Custom Background"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-xs font-bold">
                            Active
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="visual-effects" className="mt-4">
          <div className="flex flex-col gap-2">
            <Button
              variant={activeEffect === 'none' ? 'default' : 'outline'}
              onClick={() => setEffect('none')}
            >
              No Effect
            </Button>
            <Button
              variant={activeEffect === 'particles' ? 'default' : 'outline'}
              onClick={() => setEffect('particles')}
            >
              Particles Effect
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}