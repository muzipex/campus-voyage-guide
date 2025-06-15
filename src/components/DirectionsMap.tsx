
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { ArrowLeft, Navigation, Volume2, VolumeX } from 'lucide-react';
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);

  // Voice synthesis function
  const speakInstruction = (text: string) => {
    if (!voiceEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    utterance.pitch = 1.0;
    
    // Use a clear voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && !voice.name.includes('Google')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Process routing instructions for voice
  const processInstructions = (instructions: any[]) => {
    const voiceInstructions = instructions.map((instruction: any) => {
      let text = instruction.text || instruction.instruction || '';
      
      // Clean up instruction text for better speech
      text = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
      text = text.replace(/\d+(\.\d+)?\s*(m|km|ft|mi)/g, ''); // Remove distances
      text = text.replace(/\s+/g, ' ').trim(); // Clean whitespace
      
      // Convert common routing terms to more natural speech
      text = text.replace(/\bSL\b/g, 'slight left');
      text = text.replace(/\bSR\b/g, 'slight right');
      text = text.replace(/\bTL\b/g, 'turn left');
      text = text.replace(/\bTR\b/g, 'turn right');
      text = text.replace(/\bC\b/g, 'continue straight');
      text = text.replace(/\bhead\s+/i, '');
      
      return text || 'Continue on route';
    });

    setRouteInstructions(voiceInstructions);
    
    // Speak the first instruction
    if (voiceInstructions.length > 0) {
      speakInstruction(`Starting navigation to ${destination.name}. ${voiceInstructions[0]}`);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with higher zoom and better options for clarity
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    }).setView(userLocation, 18);
    mapInstanceRef.current = map;

    // Use clearer tile layer with better contrast
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
      detectRetina: true
    }).addTo(map);

    // Enhanced user location marker
    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        html: `
          <div style="
            background: #10B981; 
            width: 26px; 
            height: 26px; 
            border-radius: 50%; 
            border: 4px solid white; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
            font-weight: bold;
          ">
            📍
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })
    }).addTo(map);
    userMarker.bindPopup('<strong>Your Location</strong>', {
      offset: [0, -13],
      className: 'custom-popup'
    });

    // Enhanced destination marker
    const destMarker = L.marker(destination.coordinates, {
      icon: L.divIcon({
        html: `
          <div style="
            background: #EF4444; 
            color: white; 
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 20px;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            font-weight: bold;
          ">
            🎯
          </div>
        `,
        className: 'destination-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      })
    }).addTo(map);
    destMarker.bindPopup(`<strong>${destination.name}</strong>`, {
      offset: [0, -19],
      className: 'custom-popup'
    });

    // Create routing control with enhanced styling
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
          styles: [{ 
            color: '#3B82F6', 
            opacity: 0.9, 
            weight: 8,
            dashArray: '0, 10, 5, 5'
          }]
        },
        createMarker: function() { return null; }, // Don't create default markers
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
      });

      routingControl.on('routesfound', (e: any) => {
        console.log('Route found successfully');
        const routes = e.routes;
        const summary = routes[0].summary;
        const distance = (summary.totalDistance / 1000).toFixed(1);
        const time = Math.round(summary.totalTime / 60);
        
        // Process instructions for voice guidance
        if (routes[0].instructions) {
          processInstructions(routes[0].instructions);
        }
        
        toast.success(`Route found! ${distance}km, ${time} minutes`);
      });

      routingControl.on('routingerror', (e: any) => {
        console.error('Routing error:', e);
        toast.error("Could not find route. Showing direct line instead.");
        
        // Show a clearer fallback line
        const polyline = L.polyline([userLocation, destination.coordinates], {
          color: '#3B82F6',
          opacity: 0.8,
          weight: 8,
          dashArray: '15, 10'
        }).addTo(map);
        
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
        
        // Provide basic voice instruction for direct route
        if (voiceEnabled) {
          speakInstruction(`Heading directly to ${destination.name}. Follow the blue line on the map.`);
        }
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;
      
    } catch (error) {
      console.error('Error creating route:', error);
      toast.error("Unable to create route. Please try again.");
    }

    return () => {
      // Stop any ongoing speech when component unmounts
      window.speechSynthesis.cancel();
      map.remove();
    };
  }, [destination, userLocation, voiceEnabled]);

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
    }
    setVoiceEnabled(!voiceEnabled);
    toast.info(voiceEnabled ? 'Voice guidance disabled' : 'Voice guidance enabled');
  };

  const speakNextInstruction = () => {
    if (routeInstructions.length > 0 && currentInstructionIndex < routeInstructions.length) {
      const instruction = routeInstructions[currentInstructionIndex];
      speakInstruction(instruction);
      setCurrentInstructionIndex(prev => Math.min(prev + 1, routeInstructions.length - 1));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b p-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Directions to {destination.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{destination.description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoice}
            className={`shadow-sm hover:shadow-md transition-all ${
              voiceEnabled ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Map Container */}
      <div className="flex-1 relative bg-white p-4">
        <div 
          ref={mapRef} 
          className="absolute inset-4 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg" 
          style={{ 
            minHeight: '400px',
            background: '#f8fafc'
          }}
        />
        
        {/* Enhanced Destination Info Card */}
        <div className="absolute bottom-8 left-8 right-8 lg:right-auto lg:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-gray-900">{destination.name}</h3>
            <Navigation className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{destination.description}</p>
          {destination.hours && (
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">
              <strong className="text-gray-900">Hours:</strong> {destination.hours}
            </p>
          )}
          {routeInstructions.length > 0 && (
            <div className="space-y-2">
              <Button
                onClick={speakNextInstruction}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!voiceEnabled}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Repeat Current Instruction
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Voice guidance: {voiceEnabled ? 'ON' : 'OFF'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectionsMap;
