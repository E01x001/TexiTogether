/**
 * Location Coordinates for Taxi Together App
 * Predefined coordinates for key locations around Camp Humphreys
 */

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Coordinates for predefined locations
 * Camp Humphreys area and Pyeongtaek Station
 */
export const LOCATION_COORDINATES: Record<string, LocationCoordinate> = {
  'Pyeongtaek Station': {
    latitude: 36.9914,
    longitude: 127.0886,
    name: 'Pyeongtaek Station',
  },
  'Walking Gate': {
    latitude: 36.9656,
    longitude: 127.0398,
    name: 'Walking Gate (Camp Humphreys)',
  },
  'CPX': {
    latitude: 36.9687,
    longitude: 127.0456,
    name: 'CPX (Camp Humphreys)',
  },
  'Main Gate': {
    latitude: 36.9621,
    longitude: 127.0412,
    name: 'Main Gate (Camp Humphreys)',
  },
  'BX': {
    latitude: 36.9703,
    longitude: 127.0443,
    name: 'BX (Camp Humphreys)',
  },
};

/**
 * Get coordinates for a location name
 * @param locationName - Name of the location
 * @returns LocationCoordinate or null if not found
 */
export function getCoordinates(locationName: string): LocationCoordinate | null {
  return LOCATION_COORDINATES[locationName] || null;
}

/**
 * Calculate center point between two coordinates
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Center coordinate
 */
export function getCenterCoordinate(
  coord1: LocationCoordinate,
  coord2: LocationCoordinate
): { latitude: number; longitude: number } {
  return {
    latitude: (coord1.latitude + coord2.latitude) / 2,
    longitude: (coord1.longitude + coord2.longitude) / 2,
  };
}

/**
 * Calculate appropriate zoom level delta for map region
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Object with latitudeDelta and longitudeDelta
 */
export function getRegionDelta(
  coord1: LocationCoordinate,
  coord2: LocationCoordinate
): { latitudeDelta: number; longitudeDelta: number } {
  const latDiff = Math.abs(coord1.latitude - coord2.latitude);
  const lngDiff = Math.abs(coord1.longitude - coord2.longitude);

  // Add padding (50% extra space around markers)
  const latitudeDelta = latDiff * 1.5 || 0.05;
  const longitudeDelta = lngDiff * 1.5 || 0.05;

  return { latitudeDelta, longitudeDelta };
}
