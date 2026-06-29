"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Crosshair } from "lucide-react";

export default function LocationPicker({ latitude, longitude, radius, onLocationChange, onAddressChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [position, setPosition] = useState({
    lat: parseFloat(latitude) || 17.385,
    lng: parseFloat(longitude) || 78.4867
  });
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Auto-fetch live GPS position
    if (!latitude && !longitude && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          onLocationChange(lat, lng);
          // Update map if already initialized
          if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], 15);
            if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
          }
          reverseGeocode(lat, lng);
        },
        () => {}, // silently fail if denied
        { timeout: 8000, maximumAge: 60000 }
      );
    }

    // Load leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load leaflet JS
    const loadLeaflet = async () => {
      if (window.L) { initMap(); return; }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      setPosition({ lat, lng });
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 15);
        if (circleRef.current && radius) {
          circleRef.current.setLatLng([lat, lng]);
          circleRef.current.setRadius(parseInt(radius));
        }
      }
    }
  }, [latitude, longitude, radius]);

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current).setView([position.lat, position.lng], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Custom marker icon
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:24px;height:24px;background:#4F46E5;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([position.lat, position.lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    // Radius circle
    if (radius) {
      circleRef.current = L.circle([position.lat, position.lng], {
        radius: parseInt(radius),
        color: "#4F46E5",
        fillOpacity: 0.08,
        weight: 2
      }).addTo(map);
    }

    // Click to move marker
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setPosition({ lat, lng });
      onLocationChange(lat, lng);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });

    // Drag marker
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      setPosition({ lat, lng });
      onLocationChange(lat, lng);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name && onAddressChange) {
        onAddressChange(data.display_name);
      }
    } catch {}
  };

  // Nominatim search — show all results
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  // Fetch current GPS on demand
  const fetchMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        onLocationChange(lat, lng);
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
          if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
      },
      () => {},
      { timeout: 8000 }
    );
  };

  const selectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);
    onLocationChange(lat, lng);
    if (onAddressChange) onAddressChange(result.display_name);
    // Update map
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 15);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar + My Location */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search address..."
            className="bg-transparent text-xs outline-none w-full text-slate-700" />
        </div>
        <button onClick={handleSearch} disabled={searching}
          className="px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50">
          {searching ? "..." : "Search"}
        </button>
        <button onClick={fetchMyLocation} title="Use my current location"
          className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 flex items-center gap-1">
          <Crosshair className="w-3.5 h-3.5" /> Live
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10 relative">
          {searchResults.map((r, i) => (
            <button key={i} onClick={() => selectResult(r)}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-brand-50 border-b border-slate-50 last:border-0 flex items-start gap-2">
              <MapPin className="w-3 h-3 text-brand-500 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-56 rounded-xl border border-slate-200" style={{ zIndex: 0 }} />

      {/* Coordinates */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" /> Lat: {position.lat.toFixed(6)}</span>
        <span>Lng: {position.lng.toFixed(6)}</span>
        <span className="text-slate-400 italic">Click map or drag marker to set location</span>
      </div>
    </div>
  );
}
