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
  { url: '/videos/animated/lofi_girl_study.mp4', is_video: true, previewOffset: 5 },
  { url: '/videos/animated/train_window_rain.mp4', is_video: true, previewOffset: 3 },
  { url: '/videos/animated/cozy_room_fireplace.mp4', is_video: true, previewOffset: 2 },
  { url: '/videos/animated/fantasy_library.mp4', is_video: true, previewOffset: 4 },
  { url: '/videos/animated/space_view.mp4', is_video: true, previewOffset: 6 },
];

export function getRandomBackground(type: 'default' | 'any' = 'any'): Background {
  const allBgs = [...staticImages, ...animatedBackgrounds];
  return allBgs[Math.floor(Math.random() * allBgs.length)];
}