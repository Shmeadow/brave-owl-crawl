const backgrounds = {
-   default: await import('@/lib/backgrounds').then(mod => mod.getRandomBackground()),
+   default: await import('@/lib/backgrounds').then(mod => mod.getRandomBackground('default')),
   ...session ? await fetchPersonalizedBG(userProfile) : {},
 };