import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { MapPin, Navigation, Search, Filter, Star, Accessibility, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import DirectionsMap from './DirectionsMap';

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

const CampusMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const routingControlRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEssentialsOnly, setShowEssentialsOnly] = useState(false);
  const [showAccessibleOnly, setShowAccessibleOnly] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<POI | null>(null);

  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [newPOICoords, setNewPOICoords] = useState<[number, number] | null>(null);
  const [isAddMarkerDialogOpen, setAddMarkerDialogOpen] = useState(false);

  // Form state for new POI
  const [newPOIName, setNewPOIName] = useState('');
  const [newPOIDescription, setNewPOIDescription] = useState('');
  const [newPOICategory, setNewPOICategory] = useState<POI['category']>('services');

  const { toast } = useToast();

  // Sample POI data for Mubs University (you can expand this)
  const initialPois: POI[] = [
    {
      id: '1',
      name: 'Main Library',
      category: 'academic',
      coordinates: [0.3476, 32.5825], // Sample coordinates for Kampala area
      description: 'Central library with study spaces, computer labs, and research materials',
      isAccessible: true,
      isEssential: true,
      hours: '6:00 AM - 10:00 PM',
    },
    {
      id: '2',
      name: 'Student Center',
      category: 'services',
      coordinates: [0.3478, 32.5827],
      description: 'Student services, registrar, financial aid, and student organizations',
      isAccessible: true,
      isEssential: true,
      hours: '8:00 AM - 5:00 PM',
    },
    {
      id: '3',
      name: 'Business School',
      category: 'academic',
      coordinates: [0.3480, 32.5830],
      description: 'Main business administration building with lecture halls and faculty offices',
      isAccessible: true,
      isEssential: false,
      hours: '7:00 AM - 9:00 PM',
    },
    {
      id: '4',
      name: 'University Cafeteria',
      category: 'dining',
      coordinates: [0.3474, 32.5828],
      description: 'Main dining facility with various food options',
      isAccessible: true,
      isEssential: true,
      hours: '6:30 AM - 8:00 PM',
    },
    {
      id: '5',
      name: 'Sports Complex',
      category: 'recreation',
      coordinates: [0.3485, 32.5832],
      description: 'Gymnasium, swimming pool, and outdoor sports facilities',
      isAccessible: false,
      isEssential: false,
      hours: '6:00 AM - 10:00 PM',
    },
    {
      id: '6',
      name: 'Medical Center',
      category: 'emergency',
      coordinates: [0.3472, 32.5824],
      description: 'Campus health services and emergency medical care',
      isAccessible: true,
      isEssential: true,
      hours: '24/7',
    },
    {
      id: '7',
      name: 'Shuttle Stop - Main Gate',
      category: 'transportation',
      coordinates: [0.3470, 32.5820],
      description: 'Main campus shuttle stop and taxi pickup point',
      isAccessible: true,
      isEssential: true,
      hours: '5:30 AM - 11:00 PM',
    },
  ];

  const categoryColors = {
    academic: '#3B82F6',
    dining: '#EF4444',
    recreation: '#10B981',
    services: '#8B5CF6',
    transportation: '#F59E0B',
    emergency: '#DC2626',
  };

  const categoryIcons = {
    academic: '🎓',
    dining: '🍽️',
    recreation: '⚽',
    services: '🏢',
    transportation: '🚌',
    emergency: '🏥',
  };

  const categories = [
    { id: 'all', name: 'All Locations', icon: '📍' },
    { id: 'academic', name: 'Academic', icon: '🎓' },
    { id: 'dining', name: 'Dining', icon: '🍽️' },
    { id: 'recreation', name: 'Recreation', icon: '⚽' },
    { id: 'services', name: 'Services', icon: '🏢' },
    { id: 'transportation', name: 'Transportation', icon: '🚌' },
    { id: 'emergency', name: 'Emergency', icon: '🏥' },
  ];

  const [pois, setPois] = useState<POI[]>(initialPois);

  const filteredPOIs = pois.filter(poi => {
    const matchesSearch = poi.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || poi.category === selectedCategory;
    const matchesEssentials = !showEssentialsOnly || poi.isEssential;
    const matchesAccessible = !showAccessibleOnly || poi.isAccessible;
    
    return matchesSearch && matchesCategory && matchesEssentials && matchesAccessible;
  });

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Initialize map centered on Mubs University area with higher default zoom for clarity
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    }).setView([0.3476, 32.5825], 18);
    mapInstanceRef.current = map;

    // Use a clearer, high-contrast tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
      tileSize: 256,
      zoomOffset: 0,
      detectRetina: true
    }).addTo(map);

    // Add markers layer group
    markersRef.current.addTo(map);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(coords);

          // Enhanced user location marker with better visibility
          const userMarker = L.marker(coords, {
            icon: L.divIcon({
              html: `
                <div style="
                  background: #3B82F6; 
                  width: 24px; 
                  height: 24px; 
                  border-radius: 50%; 
                  border: 4px solid white; 
                  box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                  position: relative;
                  animation: pulse 2s infinite;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                  "></div>
                </div>
              `,
              className: 'user-location-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(map);

          userMarker.bindPopup(`
            <div class="text-center">
              <strong>Your Location</strong>
              <br/>
              <button 
                class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                id="add-poi-here-btn"
                type="button"
              >
                Add POI Here
              </button>
            </div>
          `, {
            offset: [0, -12],
            className: 'custom-popup'
          });

          // Listen for popupopen to attach event
          map.on('popupopen', (e: any) => {
            const btn = document.getElementById('add-poi-here-btn');
            if (btn) {
              btn.onclick = () => {
                window.dispatchEvent(new CustomEvent('openAddPOIAtUserLocation'));
              };
            }
          });
        },
        (error) => {
          console.log('Location access denied, using fallback:', error);
          const fallbackLocation: [number, number] = [0.3475, 32.5823];
          setUserLocation(fallbackLocation);
          toast({
            title: "Location",
            description: "Using campus center as starting point for directions"
          });
        }
      );
    }

    return () => {
      map.remove();
    };
  }, [toast]);

  // Listen for custom event to open the dialog at user location
  useEffect(() => {
    const handler = () => {
      if (userLocation) {
        setNewPOICoords(userLocation);
        setAddMarkerDialogOpen(true);
      }
    };
    window.addEventListener('openAddPOIAtUserLocation', handler);
    return () => window.removeEventListener('openAddPOIAtUserLocation', handler);
  }, [userLocation]);

  const handleAddCurrentLocation = () => {
    if (!userLocation) return;
    setNewPOICoords(userLocation);
    setAddMarkerDialogOpen(true);
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isPlacingMarker) {
        setNewPOICoords([e.latlng.lat, e.latlng.lng]);
        setAddMarkerDialogOpen(true);
        setIsPlacingMarker(false);
      }
    };
    
    if (isPlacingMarker && mapRef.current) {
        mapRef.current.style.cursor = 'crosshair';
        map.on('click', handleMapClick);
    } else if (mapRef.current) {
        mapRef.current.style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
      if (mapRef.current) {
          mapRef.current.style.cursor = '';
      }
    };
  }, [isPlacingMarker]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add filtered POI markers with enhanced visibility
    filteredPOIs.forEach(poi => {
      const marker = L.marker(poi.coordinates, {
        icon: L.divIcon({
          html: `
            <div style="
              background: ${categoryColors[poi.category]}; 
              color: white; 
              width: 36px; 
              height: 36px; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 18px;
              border: 4px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              font-weight: bold;
              ${poi.isEssential ? 'animation: pulse 2s infinite;' : ''}
              position: relative;
            ">
              ${categoryIcons[poi.category]}
              ${poi.isEssential ? '<div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #F59E0B; border: 2px solid white; border-radius: 50%;"></div>' : ''}
            </div>
          `,
          className: 'poi-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      });

      marker.bindPopup(`
        <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: #1f2937;">${poi.name}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${poi.description}</p>
          ${poi.hours ? `<p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Hours:</strong> ${poi.hours}</p>` : ''}
          <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;">
            ${poi.isEssential ? '<span style="background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500;">Essential</span>' : ''}
            ${poi.isAccessible ? '<span style="background: #D1FAE5; color: #065F46; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500;">Accessible</span>' : ''}
          </div>
          ${userLocation ? `
            <div style="margin-top: 10px;">
              <button 
                onclick="document.dispatchEvent(new CustomEvent('getDirections', {detail: '${poi.id}'}))"
                style="background: #3B82F6; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;"
              >
                <span>📍</span> Get Directions
              </button>
            </div>
          ` : ''}
        </div>
      `, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        setSelectedPOI(poi);
      });

      markersRef.current.addLayer(marker);
    });

    // Add event listener for directions button in popups
    const handleGetDirectionsFromPopup = (event: CustomEvent) => {
      const poi = pois.find(p => p.id === event.detail);
      if (poi) {
        handleGetDirections(poi);
      }
    };

    document.addEventListener('getDirections', handleGetDirectionsFromPopup as EventListener);

    return () => {
      document.removeEventListener('getDirections', handleGetDirectionsFromPopup as EventListener);
    };
  }, [filteredPOIs, userLocation, pois]);

  const navigateTo = (poi: POI) => {
    if (!mapInstanceRef.current) return;
    
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setShowDirections(false);
    }
    
    mapInstanceRef.current.setView(poi.coordinates, 19);
    setSelectedPOI(poi);
  };

  const handleGetDirections = (poi: POI) => {
    if (!userLocation) {
      toast({
        title: "Error",
        description: "Your location is not available",
        variant: "destructive"
      });
      return;
    }

    setDirectionsDestination(poi);
    setShowDirections(true);
    setSelectedPOI(null);
  };

  const handleBackFromDirections = () => {
    setShowDirections(false);
    setDirectionsDestination(null);
  };

  const handleMyLocationClick = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userLocation, 18);
    } else {
      toast({
        title: "Location",
        description: "Your location is not available."
      });
    }
  };

  const handleAddPOI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPOICoords || !newPOIName) return;

    const newPOI: POI = {
      id: new Date().toISOString(),
      name: newPOIName,
      description: newPOIDescription,
      category: newPOICategory,
      coordinates: newPOICoords,
      isAccessible: false,
      isEssential: false,
    };

    setPois(prevPois => [...prevPois, newPOI]);

    setAddMarkerDialogOpen(false);
    setNewPOIName('');
    setNewPOIDescription('');
    setNewPOICategory('services');
    setNewPOICoords(null);
  };

  // Show directions view if directions are requested
  if (showDirections && directionsDestination && userLocation) {
    return (
      <DirectionsMap
        destination={directionsDestination}
        userLocation={userLocation}
        onBack={handleBackFromDirections}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-4">
            <img src="/icons8-monzo.svg" alt="Monzo" className="w-8 h-8" />
            <h2 className="text-2xl font-bold text-gray-900">Mubs Campus Map</h2>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Always visible user location card */}
          {userLocation && (
            <Card className="mb-4 border-blue-100">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Your Location
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-xs space-y-1">
                  <p>Lat: {userLocation[0].toFixed(6)}</p>
                  <p>Lng: {userLocation[1].toFixed(6)}</p>
                  <Button
                    id="addCurrentLocationBtn"
                    onClick={handleAddCurrentLocation}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add POI Here
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <Button
              onClick={() => handleMyLocationClick()}
              variant="default"
              size="sm"
              className="w-full justify-start bg-blue-500 hover:bg-blue-600"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Go to My Location
            </Button>
            <Button
              onClick={() => setIsPlacingMarker(!isPlacingMarker)}
              variant={isPlacingMarker ? 'destructive' : 'outline'}
              size="sm"
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isPlacingMarker ? 'Cancel Placement' : 'Add New Location'}
            </Button>
            <Button
              onClick={() => setShowEssentialsOnly(!showEssentialsOnly)}
              variant={showEssentialsOnly ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
            >
              <Star className="w-4 h-4 mr-2" />
              First-Year Essentials
            </Button>
            <Button
              onClick={() => setShowAccessibleOnly(!showAccessibleOnly)}
              variant={showAccessibleOnly ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
            >
              <Accessibility className="w-4 h-4 mr-2" />
              Accessible Only
            </Button>
            {showDirections && (
              <Button
                onClick={handleBackFromDirections}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Back to Map
              </Button>
            )}
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {categories.map(category => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className="justify-start text-xs"
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* POI List */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Locations ({filteredPOIs.length})
          </h3>
          <div className="space-y-3">
            {filteredPOIs.map(poi => (
              <Card
                key={poi.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPOI?.id === poi.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => navigateTo(poi)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="mr-2">{categoryIcons[poi.category]}</span>
                      {poi.name}
                    </span>
                    <Navigation className="w-4 h-4 text-gray-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-2">{poi.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {poi.isEssential && (
                      <Badge variant="secondary" className="text-xs">Essential</Badge>
                    )}
                    {poi.isAccessible && (
                      <Badge variant="outline" className="text-xs">Accessible</Badge>
                    )}
                    <Badge
                      style={{ backgroundColor: categoryColors[poi.category] }}
                      className="text-xs text-white"
                    >
                      {poi.category}
                    </Badge>
                  </div>
                  {poi.hours && (
                    <p className="text-xs text-gray-500 mt-1">Hours: {poi.hours}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container with enhanced styling */}
      <div className="flex-1 relative bg-white rounded-lg shadow-inner">
        <div 
          ref={mapRef} 
          className="absolute inset-2 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md" 
          style={{ 
            minHeight: '400px',
            background: '#f8fafc'
          }} 
        />
      </div>

      {/* Selected POI Info */}
      {selectedPOI && (
        <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-96 bg-white rounded-xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-gray-900">{selectedPOI.name}</h3>
            <button
              onClick={() => setSelectedPOI(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{selectedPOI.description}</p>
          {selectedPOI.hours && (
            <p className="text-sm mb-3 text-gray-700">
              <strong className="text-gray-900">Hours:</strong> {selectedPOI.hours}
            </p>
          )}
          <div className="flex gap-2 mb-4 flex-wrap">
            {selectedPOI.isEssential && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Essential
              </Badge>
            )}
            {selectedPOI.isAccessible && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Accessible
              </Badge>
            )}
            <Badge
              style={{ backgroundColor: categoryColors[selectedPOI.category] }}
              className="text-white"
            >
              {selectedPOI.category}
            </Badge>
          </div>
          {userLocation && (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 shadow-md hover:shadow-lg transition-all" 
              onClick={() => handleGetDirections(selectedPOI)}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          )}
        </div>
      )}

      {/* Add POI Dialog */}
      <Dialog open={isAddMarkerDialogOpen} onOpenChange={setAddMarkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new Point of Interest</DialogTitle>
            <DialogDescription>
              {isPlacingMarker ? 
                "Click on the map to place the new POI." :
                "A marker has been placed at the location you clicked. Please fill out the details for this new POI."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPOI} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poi-name">Name</Label>
              <Input
                id="poi-name"
                value={newPOIName}
                onChange={(e) => setNewPOIName(e.target.value)}
                placeholder="e.g., New Study Area"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poi-description">Description</Label>
              <Textarea
                id="poi-description"
                value={newPOIDescription}
                onChange={(e) => setNewPOIDescription(e.target.value)}
                placeholder="A short description of the location."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poi-category">Category</Label>
              <Select value={newPOICategory} onValueChange={value => setNewPOICategory(value as POI['category'])}>
                <SelectTrigger id="poi-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id !== 'all').map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add POI</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampusMap;
