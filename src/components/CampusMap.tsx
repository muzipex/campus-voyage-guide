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
  const [showingDirections, setShowingDirections] = useState(false);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [newPOICoords, setNewPOICoords] = useState<[number, number] | null>(null);
  const [isAddMarkerDialogOpen, setAddMarkerDialogOpen] = useState(false);

  // Form state for new POI
  const [newPOIName, setNewPOIName] = useState('');
  const [newPOIDescription, setNewPOIDescription] = useState('');
  const [newPOICategory, setNewPOICategory] = useState<POI['category']>('services');

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
    if (!mapRef.current) return;

    // Initialize map centered on Mubs University area (approximate coordinates)
    const map = L.map(mapRef.current).setView([0.3476, 32.5825], 17);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add markers layer group
    markersRef.current.addTo(map);

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          console.log('User location obtained:', coords);
          setUserLocation(coords);
          
          // Add user location marker
          const userMarker = L.marker(coords, {
            icon: L.divIcon({
              html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map);
          
          userMarker.bindPopup('You are here');
        },
        (error) => {
          console.log('Location access denied, using fallback:', error);
          // Set a fallback location near campus
          const fallbackLocation: [number, number] = [0.3475, 32.5823];
          setUserLocation(fallbackLocation);
          toast.info("Using campus center as starting point for directions");
        }
      );
    } else {
      console.log('Geolocation not supported, using fallback');
      // Set a fallback location near campus
      const fallbackLocation: [number, number] = [0.3475, 32.5823];
      setUserLocation(fallbackLocation);
    }

    return () => {
      map.remove();
    };
  }, []);

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

    // Add filtered POI markers
    filteredPOIs.forEach(poi => {
      const marker = L.marker(poi.coordinates, {
        icon: L.divIcon({
          html: `
            <div style="
              background: ${categoryColors[poi.category]}; 
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
              ${poi.isEssential ? 'animation: pulse 2s infinite;' : ''}
            ">
              ${categoryIcons[poi.category]}
            </div>
          `,
          className: 'poi-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      });

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${poi.name}</h3>
          <p style="margin: 0 0 8px 0; color: #666;">${poi.description}</p>
          ${poi.hours ? `<p style="margin: 0 0 4px 0;"><strong>Hours:</strong> ${poi.hours}</p>` : ''}
          ${poi.floor ? `<p style="margin: 0 0 4px 0;"><strong>Floor:</strong> ${poi.floor}</p>` : ''}
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            ${poi.isEssential ? '<span style="background: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; font-size: 12px;">Essential</span>' : ''}
            ${poi.isAccessible ? '<span style="background: #D1FAE5; color: #065F46; padding: 2px 6px; border-radius: 4px; font-size: 12px;">Accessible</span>' : ''}
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedPOI(poi);
      });

      markersRef.current.addLayer(marker);
    });
  }, [filteredPOIs]);

  const navigateTo = (poi: POI) => {
    if (!mapInstanceRef.current) return;
    
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setShowingDirections(false);
    }
    
    mapInstanceRef.current.setView(poi.coordinates, 19);
    setSelectedPOI(poi);
  };

  const handleGetDirections = async (poi: POI) => {
    const map = mapInstanceRef.current;
    if (!map) {
      toast.error("Map not available");
      return;
    }

    console.log('Getting directions button clicked for:', poi.name);
    console.log('Current user location:', userLocation);
    
    setIsLoadingDirections(true);

    // Use fallback location if user location is not available
    const startLocation = userLocation || [0.3475, 32.5823];
    
    console.log('Starting directions from:', startLocation, 'to:', poi.coordinates);

    // Clear existing route
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    try {
      // Create routing control with better error handling
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(startLocation[0], startLocation[1]),
          L.latLng(poi.coordinates[0], poi.coordinates[1]),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        show: false, // Hide the itinerary panel
        lineOptions: {
          styles: [{ color: '#3B82F6', opacity: 0.8, weight: 6 }]
        }
      });

      // Add error handling
      routingControl.on('routesfound', (e: any) => {
        console.log('Route found successfully');
        setShowingDirections(true);
        setIsLoadingDirections(false);
        toast.success(`Directions to ${poi.name} are now showing!`);
      });

      routingControl.on('routingerror', (e: any) => {
        console.error('Routing error:', e);
        setIsLoadingDirections(false);
        toast.error("Could not find route. Showing direct line instead.");
        
        // Show a simple line as fallback
        const polyline = L.polyline([startLocation, poi.coordinates], {
          color: '#3B82F6',
          opacity: 0.8,
          weight: 6,
          dashArray: '10, 10'
        }).addTo(map);
        
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
        setShowingDirections(true);
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;
      
      // Close the POI info panel
      setSelectedPOI(null);
      
    } catch (error) {
      console.error('Error creating route:', error);
      setIsLoadingDirections(false);
      toast.error("Unable to create route. Please try again.");
    }
  };

  const clearDirections = () => {
    if (routingControlRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setShowingDirections(false);
      toast.info("Directions cleared");
    }
  };

  const handleMyLocationClick = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userLocation, 18);
    } else {
      toast.info("Your location is not available.");
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

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full lg:w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mubs Campus Map</h2>
          
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

          {/* Filter Buttons */}
          <div className="space-y-2 mb-4">
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
            {showingDirections && (
              <Button
                onClick={clearDirections}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Clear Directions
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

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
          <Button size="sm" variant="outline" className="w-full" onClick={handleMyLocationClick}>
            <MapPin className="w-4 h-4 mr-2" />
            My Location
          </Button>
          {showingDirections && (
            <Button size="sm" variant="outline" className="w-full" onClick={clearDirections}>
              Clear Route
            </Button>
          )}
        </div>

        {/* Selected POI Info */}
        {selectedPOI && (
          <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:w-80 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg">{selectedPOI.name}</h3>
              <button
                onClick={() => {
                  setSelectedPOI(null);
                  if (routingControlRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeControl(routingControlRef.current);
                    routingControlRef.current = null;
                    setShowingDirections(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-3">{selectedPOI.description}</p>
            {selectedPOI.hours && (
              <p className="text-sm mb-2"><strong>Hours:</strong> {selectedPOI.hours}</p>
            )}
            <div className="flex gap-2 mb-3">
              {selectedPOI.isEssential && (
                <Badge variant="secondary">Essential</Badge>
              )}
              {selectedPOI.isAccessible && (
                <Badge variant="outline">Accessible</Badge>
              )}
            </div>
            <Button 
              className="w-full" 
              size="sm" 
              onClick={() => handleGetDirections(selectedPOI)}
              disabled={isLoadingDirections}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isLoadingDirections ? 'Loading Directions...' : 'Get Directions'}
            </Button>
          </div>
        )}

        {/* Directions Status */}
        {showingDirections && (
          <div className="absolute top-4 left-4 bg-blue-600 text-white rounded-lg shadow-lg p-3">
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Showing directions</span>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoadingDirections && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading directions...</span>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isAddMarkerDialogOpen} onOpenChange={setAddMarkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new Point of Interest</DialogTitle>
            <DialogDescription>
              A marker has been placed at the location you clicked. Please fill out the details for this new POI.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPOI} className="space-y-4 pt-4">
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
              <Select value={newPOICategory} onValueChange={(value) => setNewPOICategory(value as POI['category'])}>
                <SelectTrigger id="poi-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id !== 'all').map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.icon} {category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setNewPOICoords(null)}>Cancel</Button>
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
