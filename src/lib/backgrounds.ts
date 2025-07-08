export type Background = { url: string; is_video?: boolean; previewOffset?: number };

export const staticImages: Background[] = [
  { url: '/images/backgrounds/forest.jpg' },
  { url: '/images/backgrounds/mountains.jpg' },
  { url: '/images/backgrounds/beach.jpg' },
  { url: '/images/backgrounds/city.jpg' },
  { url: '/images/backgrounds/space.jpg' },
  { url: '/images/backgrounds/cafe.jpg' },
];

export const animatedBackgrounds: Background[] = [
  { url: 'https://www.youtube.com/watch?v=M3n9irByaLA', is_video: true },
  { url: 'https://www.youtube.com/watch?v=edn7FurOFxM', is_video: true },
  { url: 'https://www.youtube.com/watch?v=IC38LWnquWw', is_video: true },
  { url: 'https://www.youtube.com/watch?v=yf5NOyy1SXU', is_video: true },
  { url: 'https://www.youtube.com/watch?v=kLZ4plrttPI', is_video: true },
];

export function getRandomBackground(type: 'default' | 'any' = 'any'): Background {
  const allBgs = [...staticImages, ...animatedBackgrounds];
  return allBgs[Math.floor(Math.random() * allBgs.length)];
}