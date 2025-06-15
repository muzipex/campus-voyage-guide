
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { ArrowLeft, Navigation } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface POI {
  id: string;
  name: string;
  category: 'academic' | 'dining' | 'recreation' | 'services' | 'transportation' | 'emergency';
  coordinates: [number, number];
  description: string;
  isAccessible: boolean;
  isEssential: boolean;
  hours?: string;
  floor?: string;
}

interface DirectionsMapProps {
  destination: POI;
  userLocation: [number, number];
  onBack: () => void;
}

const DirectionsMap: React.FC<DirectionsMapProps> = ({ destination, userLocation, onBack }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(userLocation, 17);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add user location marker
    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'user-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(map);
    userMarker.bindPopup('You are here');

    // Add destination marker
    const destMarker = L.marker(destination.coordinates, {
      icon: L.divIcon({
        html: `
          <div style="
            background: #EF4444; 
            color: white; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 16px;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            📍
          </div>
        `,
        className: 'destination-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(map);
    destMarker.bindPopup(destination.name);

    // Create routing control
    try {
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLocation[0], userLocation[1]),
          L.latLng(destination.coordinates[0], destination.coordinates[1]),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#3B82F6', opacity: 0.8, weight: 6 }]
        }
      });

      routingControl.on('routesfound', (e: any) => {
        console.log('Route found successfully');
        toast.success(`Route to ${destination.name} loaded!`);
      });

      routingControl.on('routingerror', (e: any) => {
        console.error('Routing error:', e);
        toast.error("Could not find route. Showing direct line instead.");
        
        // Show a simple line as fallback
        const polyline = L.polyline([userLocation, destination.coordinates], {
          color: '#3B82F6',
          opacity: 0.8,
          weight: 6,
          dashArray: '10, 10'
        }).addTo(map);
        
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;
      
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error("Unable to create route. Please try again.");
    }

    return () => {
      map.remove();
    };
  }, [destination, userLocation]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Directions to {destination.name}</h2>
            <p className="text-sm text-gray-600">{destination.description}</p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />
        
        {/* Destination Info Card */}
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg">{destination.name}</h3>
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm mb-2">{destination.description}</p>
          {destination.hours && (
            <p className="text-sm text-gray-500">Hours: {destination.hours}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectionsMap;
