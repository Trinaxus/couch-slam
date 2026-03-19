export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.includes('/embed/')) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}
