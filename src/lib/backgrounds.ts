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
  { url: 'https://cdn.pixabay.com/video/2024/02/26/200823-919331549_large.mp4', is_video: true, previewOffset: 5 },
  { url: 'https://cdn.pixabay.com/video/2023/08/25/177111-856840379_large.mp4', is_video: true, previewOffset: 10 },
  { url: 'https://cdn.pixabay.com/video/2023/09/14/180013-864514099_large.mp4', is_video: true, previewOffset: 3 },
  { url: 'https://cdn.pixabay.com/video/2023/02/03/149301-796894311_large.mp4', is_video: true, previewOffset: 8 },
  { url: 'https://cdn.pixabay.com/video/2022/11/16/139158-772022391_large.mp4', is_video: true, previewOffset: 2 },
  { url: 'https://cdn.pixabay.com/video/2024/05/27/212056-943923571_large.mp4', is_video: true, previewOffset: 6 },
];

export function getRandomBackground(type: 'default' | 'any' = 'any'): Background {
  const allBgs = [...staticImages, ...animatedBackgrounds];
  return allBgs[Math.floor(Math.random() * allBgs.length)];
}