export type Background = { url: string; is_video?: boolean; previewOffset?: number };

export const staticImages: Background[] = [
  { url: '/images/backgrounds/forest.jpg' },
  { url: '/images/backgrounds/mountains.jpg' },
  { url: '/images/backgrounds/beach.jpg' },
  { url: '/images/backgrounds/city.jpg' },
  { url: '/images/backgrounds/space.jpg' },
  { url: '/images/backgrounds/cafe.jpg' },
];

// New animated backgrounds from ani1.mp4 to ani28.mp4
export const animatedBackgrounds: Background[] = Array.from({ length: 28 }, (_, i) => ({
  url: `/videos/animated/ani${i + 1}.mp4`,
  is_video: true,
  previewOffset: 2, // A default preview start time for all videos
}));

export function getRandomBackground(type: 'default' | 'any' = 'any'): Background {
  const allBgs = [...staticImages, ...animatedBackgrounds];
  return allBgs[Math.floor(Math.random() * allBgs.length)];
}