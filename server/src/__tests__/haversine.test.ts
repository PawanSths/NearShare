import { describe, it, expect } from 'vitest';
import { haversineDistanceKm, isWithinRadiusKm } from '../utils/haversine.js';

describe('haversineDistanceKm', () => {
  it('returns ~0 for same point', () => {
    expect(haversineDistanceKm(37.7749, -122.4194, 37.7749, -122.4194)).toBeCloseTo(0, 1);
  });

  it('calculates distance between SF and LA', () => {
    const dist = haversineDistanceKm(37.7749, -122.4194, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(550);
    expect(dist).toBeLessThan(620);
  });

  it('calculates distance between NY and London', () => {
    const dist = haversineDistanceKm(40.7128, -74.006, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(5500);
    expect(dist).toBeLessThan(5600);
  });
});

describe('isWithinRadiusKm', () => {
  it('returns true for same point within 1km', () => {
    expect(isWithinRadiusKm(37.7749, -122.4194, 37.7749, -122.4194, 1)).toBe(true);
  });

  it('returns false for distant point within 1km', () => {
    expect(isWithinRadiusKm(37.7749, -122.4194, 34.0522, -118.2437, 1)).toBe(false);
  });

  it('returns true for nearby point within 100km', () => {
    expect(isWithinRadiusKm(37.7749, -122.4194, 37.8, -122.5, 100)).toBe(true);
  });
});
