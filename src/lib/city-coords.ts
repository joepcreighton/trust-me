export interface LatLng { lat: number; lng: number }

export const CITY_COORDS: Record<string, LatLng> = {
  "New York City": { lat: 40.7128, lng: -74.006 },
  "Brooklyn":      { lat: 40.6782, lng: -73.9442 },
  "Los Angeles":   { lat: 34.0522, lng: -118.2437 },
  "Chicago":       { lat: 41.8781, lng: -87.6298 },
  "Austin":        { lat: 30.2672, lng: -97.7431 },
  "Denver":        { lat: 39.7392, lng: -104.9903 },
  "San Diego":     { lat: 32.7157, lng: -117.1611 },
  "Seattle":       { lat: 47.6062, lng: -122.3321 },
  "Boston":        { lat: 42.3601, lng: -71.0589 },
  "Nashville":     { lat: 36.1627, lng: -86.7816 },
  "Miami":         { lat: 25.7617, lng: -80.1918 },
  "Portland":      { lat: 45.5051, lng: -122.675 },
  "Atlanta":       { lat: 33.749,  lng: -84.388 },
  "Washington DC": { lat: 38.9072, lng: -77.0369 },
  "Philadelphia":  { lat: 39.9526, lng: -75.1652 },
  "Charleston":    { lat: 32.7765, lng: -79.9311 },
  "Salt Lake City":{ lat: 40.7608, lng: -111.891 },
  "Phoenix":       { lat: 33.4484, lng: -112.074 },
  "Dallas":        { lat: 32.7767, lng: -96.797 },
  "Houston":       { lat: 29.7604, lng: -95.3698 },
  "Minneapolis":   { lat: 44.9778, lng: -93.265 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "New Orleans":   { lat: 29.9511, lng: -90.0715 },
  "Las Vegas":     { lat: 36.1699, lng: -115.1398 },
  "Detroit":       { lat: 42.3314, lng: -83.0458 },
  "Raleigh":       { lat: 35.7796, lng: -78.6382 },
  "Charlotte":     { lat: 35.2271, lng: -80.8431 },
  "Tampa":         { lat: 27.9506, lng: -82.4572 },
  "Orlando":       { lat: 28.5383, lng: -81.3792 },
  "Sacramento":    { lat: 38.5816, lng: -121.4944 },
};

export const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.006 };

export function cityToLatLng(city: string | undefined): LatLng {
  if (!city) return DEFAULT_CENTER;
  return CITY_COORDS[city] ?? DEFAULT_CENTER;
}
