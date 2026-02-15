import { Pin, PinterestAPIResponse, PinterestPinItem } from '../types';
import { PINTEREST_API_BASE } from '../constants';

const NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Quinn"];
const TOPICS = ["Minimalism", "Architecture", "Travel", "Food", "Fashion", "Art", "Tech"];

// Function to generate random dimensions for EXTREME jagged layout
const getRandomDimensions = () => {
  const width = 600;
  // Extreme variation: Short (300px) to Very Tall (1200px)
  // This creates aspect ratios from 0.5 (wide/short) to 2.0 (very tall)
  const height = Math.floor(Math.random() * (1200 - 300 + 1) + 300);
  return { width, height };
};

const generateMockPins = (count: number): Pin[] => {
  return Array.from({ length: count }).map((_, i) => {
    const { width, height } = getRandomDimensions();
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    // Using Unsplash source with specific dimensions to actually get different images
    const sig = Math.floor(Math.random() * 10000);
    
    return {
      id: `mock-${i}-${sig}`,
      // We append random dimensions to the unsplash URL to get a crop that matches our generated aspect ratio
      url: `https://images.unsplash.com/photo-${getUnsplashId(i)}?w=${width}&h=${height}&auto=format&fit=crop&q=80`,
      width: width,
      height: height,
      description: `${topic} Inspiration ${i + 1}`,
      author: NAMES[Math.floor(Math.random() * NAMES.length)],
      tags: [topic.toLowerCase(), "inspiration", "daily"],
      userId: 'system',
      createdAt: Date.now() - Math.floor(Math.random() * 10000000),
      likeCount: Math.floor(Math.random() * 500)
    };
  });
};

const getUnsplashId = (index: number) => {
  const ids = [
    "1541963463532-d68292c34b19", // Book
    "1493663284031-b7e3aefcae8e", // Living room
    "1515886657613-9f3515b0c78f", // Fashion
    "1504674900247-0877df9cc836", // Food
    "1507525428034-b723cf961d3e", // Travel
    "1513519245088-0e12902e5a38", // Bedroom
    "1550684848-fac1c5b4e853",    // Neon
    "1583847661867-7ceddf29aef9", // Abstract
    "1519710164239-da123dc03ef4", // Arch
    "1496747611176-843222e1e57c", // Sustainable
    "1529626455594-4ff0802cfb7e", // Portrait
    "1470071459604-3b5ec3a7fe05", // Nature
    "1515405295579-ba7f9f427320", // Tech
    "1494438639946-1ebd1d20bf85", // Gold
    "1500917293891-ef795e70e1f6", // Model
  ];
  return ids[index % ids.length];
};

export const MOCK_PINS: Pin[] = generateMockPins(24);

const transformPin = (item: PinterestPinItem): Pin => {
  // Try to find the largest image
  const image = item.media?.images?.['1200x'] || item.media?.images?.['600x'] || item.media?.images?.['400x300'];
  const imageUrl = image?.url || '';

  return {
    id: item.id,
    url: imageUrl,
    width: image?.width || 600,
    height: image?.height || 800,
    description: item.description || item.title || item.alt_text || "No description",
    author: item.board_owner?.username || "Pinterest User",
    tags: item.title ? item.title.split(' ') : [],
    link: item.link,
    userId: 'pinterest-api',
    createdAt: Date.now(),
  };
};

const PROXY_GENERATORS = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

export const fetchPins = async (apiKey: string, query?: string): Promise<Pin[]> => {
  const cleanKey = apiKey.trim();
  const endpoint = `${PINTEREST_API_BASE}/pins`;
  const urlParams = new URLSearchParams({
    page_size: '50',
  });

  const targetUrl = `${endpoint}?${urlParams.toString()}`;
  
  let response;
  let lastError;

  for (const generateProxyUrl of PROXY_GENERATORS) {
    try {
      const fullUrl = generateProxyUrl(targetUrl);
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (res) {
        response = res;
        if (res.ok) break; 
        if (res.status === 401 || res.status === 403) break;
      }
    } catch (e) {
      console.warn(`Proxy attempt failed:`, e);
      lastError = e;
    }
  }

  if (!response) {
    throw lastError || new Error("Network Error: Unable to connect to Pinterest API.");
  }

  if (!response.ok) {
     if (response.status === 401 || response.status === 403) {
      throw new Error("Authorization Failed"); 
    }
    throw new Error(`Pinterest API returned status ${response.status}`);
  }

  try {
    const data: PinterestAPIResponse = await response.json();
    if (!data.items) return [];

    let pins = data.items
      .filter(item => item.media?.images)
      .map(transformPin)
      .filter(pin => pin.url !== '');

    if (query) {
      const lowerQuery = query.toLowerCase();
      pins = pins.filter(pin => 
        pin.description.toLowerCase().includes(lowerQuery) || 
        pin.author.toLowerCase().includes(lowerQuery) ||
        (pin.tags && pin.tags.some(t => t.toLowerCase().includes(lowerQuery)))
      );
    }

    return pins;
  } catch (parseError) {
    console.error("Error parsing API response:", parseError);
    throw new Error("Received invalid data from Pinterest API.");
  }
};