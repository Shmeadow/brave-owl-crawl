export const staticImages = [
  "/static/bg1.jpg",
  "/static/bg2.jpg",
  "/static/bg3.jpg",
  "/static/bg4.jpg",
  "/static/bg5.jpg",
  "/static/bg6.jpg",
  "/static/bg7.jpg",
  "/static/bg9.jpg",
  "/static/bg10.jpg",
  "/static/bg11.jpg",
  "/static/bg12.jpg",
];

export const animatedBackgrounds = [
  { videoUrl: "/animated/ani1.mp4" },
  { videoUrl: "/animated/ani2.mp4" },
  { videoUrl: "/animated/ani3.mp4" },
  // ani4.mp4 removed as requested
  { videoUrl: "/animated/ani5.mp4" },
  { videoUrl: "/animated/ani6.mp4" },
  { videoUrl: "/animated/ani7.mp4" },
  { videoUrl: "/animated/ani8.mp4" },
  { videoUrl: "/animated/ani9.mp4" },
  { videoUrl: "/animated/ani10.mp4" },
  { videoUrl: "/animated/ani11.mp4" },
  // ani12.mp4 removed as requested
  { videoUrl: "/animated/ani13.mp4" },
  { videoUrl: "/animated/ani14.mp4" },
  { videoUrl: "/animated/ani15.mp4" },
  { videoUrl: "/animated/ani16.mp4" },
  { videoUrl: "/animated/ani17.mp4" },
  { videoUrl: "/animated/ani18.mp4" },
  { videoUrl: "/animated/ani19.mp4" },
  { videoUrl: "/animated/ani20.mp4" },
  { videoUrl: "/animated/ani21.mp4" },
  { videoUrl: "/animated/ani22.mp4" },
  // ani23.mp4, ani24.mp4, ani25.mp4 removed as requested
];

export const allBackgrounds = [
    ...staticImages.map(url => ({ url, isVideo: false })),
    ...animatedBackgrounds.map(bg => ({ url: bg.videoUrl, isVideo: true }))
];

export const getRandomBackground = () => {
    const randomIndex = Math.floor(Math.random() * allBackgrounds.length);
    return allBackgrounds[randomIndex];
};