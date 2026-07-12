"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type PickedLocation = { lat: number; lng: number; label: string };

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Research Triangle Park — center of our pilot region.
const DEFAULT_CENTER: [number, number] = [35.86, -78.84];

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  // Required by Nominatim usage policy — identifies the app, not the user.
  "User-Agent": "EcoLoop/1.0 (commute-matching-app)",
} as const;

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

function shortLabel(displayName: string): string {
  return displayName.split(",").slice(0, 3).join(",").trim();
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ value }: { value: PickedLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 13));
  }, [value, map]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder,
}: {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(value)}`,
          { headers: NOMINATIM_HEADERS }
        );
        setResults(res.ok ? await res.json() : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  async function pickFromMap(lat: number, lng: number) {
    let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: NOMINATIM_HEADERS }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) label = shortLabel(data.display_name);
      }
    } catch {
      // keep coordinate label
    }
    onChange({ lat, lng, label });
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {searching && (
          <span className="absolute right-3 top-2.5 text-xs text-gray-400">…</span>
        )}
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      lat: parseFloat(r.lat),
                      lng: parseFloat(r.lon),
                      label: shortLabel(r.display_name),
                    });
                    setQuery("");
                    setResults([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? 13 : 10}
          style={{ height: 240, width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pickFromMap} />
          <FlyTo value={value} />
          {value && <Marker position={[value.lat, value.lng]} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-500">
        {value ? (
          <>
            Selected: <span className="font-medium text-gray-700">{value.label}</span>
          </>
        ) : (
          "Search above or tap the map to drop a pin."
        )}
      </p>
    </div>
  );
}
