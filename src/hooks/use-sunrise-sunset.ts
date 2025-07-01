"use client";

import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';

interface SunriseSunsetTimes {
  sunrise: Date | null;
  sunset: Date | null;
}

interface UseSunriseSunsetResult {
  times: SunriseSunsetTimes | null;
  loading: boolean;
  error: string | null;
}

export function useSunriseSunset(): UseSunriseSunsetResult {
  const [times, setTimes] = useState<SunriseSunsetTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    const fetchLocationAndTimes = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const today = new Date();
          const sunTimes = SunCalc.getTimes(today, latitude, longitude);
          setTimes({
            sunrise: sunTimes.sunrise,
            sunset: sunTimes.sunset,
          });
          setLoading(false);
        },
        (geoError) => {
          let errorMessage = "Failed to retrieve your location.";
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location services for this site.";
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case geoError.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
          }
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    };

    fetchLocationAndTimes();
    // Optionally refresh times daily or on a timer if needed, but for now, just on mount.
  }, []);

  return { times, loading, error };
}