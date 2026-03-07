'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default Leaflet icon in Next.js
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

interface RegionData {
    name: string;
    count: number;
    lat: number;
    lng: number;
}

// Basic fallback coordinates for known Indian states/cities
const KNOWN_LOCATIONS: Record<string, [number, number]> = {
    'agra': [27.1767, 78.0081],
    'noida': [28.5355, 77.3910],
    'mumbai': [19.0760, 72.8777],
    'bengaluru': [12.9716, 77.5946],
    'bangalore': [12.9716, 77.5946],
    'chennai': [13.0827, 80.2707],
    'jaipur': [26.9124, 75.7873],
    'rudrapur': [28.9816, 79.4005],
    'uttarakhand': [30.0668, 79.0193],
    'coimbatore': [11.0168, 76.9558],
    'delhi': [28.7041, 77.1025],
    'pune': [18.5204, 73.8567],
    'hyderabad': [17.3850, 78.4867],
    'kolkata': [22.5726, 88.3639],
    'ahmedabad': [23.0225, 72.5714],
};

function extractLocation(address: string): [number, number] | null {
    const lower = address.toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
        if (lower.includes(key)) return coords;
    }
    // Simple basic fallback if nothing matches
    return null;
}

// Simple deterministic hash for rough scattering of unknown locations to avoid complete overlap
function hashAddress(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

export default function RegionsMap({ regions }: { regions: Record<string, number> }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const markers = useMemo(() => {
        const mapData: RegionData[] = [];

        Object.entries(regions).forEach(([name, count]) => {
            if (name.toLowerCase() === 'same as billing' || !name.trim()) return;

            const coords = extractLocation(name);
            if (coords) {
                // Add tiny jitter to avoid exact overlaps
                const jitterLat = (Math.random() - 0.5) * 0.05;
                const jitterLng = (Math.random() - 0.5) * 0.05;
                mapData.push({
                    name,
                    count,
                    lat: coords[0] + jitterLat,
                    lng: coords[1] + jitterLng
                });
            } else {
                // If completely unknown, drop somewhere randomly near the center of India
                const hash = hashAddress(name);
                const randomLat = 20.5937 + ((hash % 100) / 100) * 10 - 5;
                const randomLng = 78.9629 + (((hash >> 4) % 100) / 100) * 10 - 5;
                mapData.push({
                    name,
                    count,
                    lat: randomLat,
                    lng: randomLng
                });
            }
        });

        return mapData;
    }, [regions]);

    if (!mounted) {
        return (
            <div className="w-full min-h-[300px] h-[300px] flex items-center justify-center bg-muted/20 rounded-xl relative overflow-hidden">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground relative z-10" />
            </div>
        );
    }

    return (
        <div className="w-full h-[350px] relative rounded-xl overflow-hidden border">
            <MapContainer
                center={[22.5, 79.0]} // Center of India
                zoom={4}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {markers.map((marker, i) => (
                    <Marker key={i} position={[marker.lat, marker.lng]} icon={customIcon}>
                        <Popup>
                            <div className="font-sans min-w-[150px]">
                                <p className="font-semibold text-xs mb-1.5 leading-tight">{marker.name}</p>
                                <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5">
                                    <strong className="text-emerald-600 font-bold">{marker.count}</strong> order{marker.count !== 1 && 's'}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
