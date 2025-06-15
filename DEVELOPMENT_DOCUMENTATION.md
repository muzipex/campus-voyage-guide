
# Campus Map Application Development Guide

**Developed by: Mugerwa Simon Peter**  
**Tribute to: SICA Developers**

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [Project Setup](#project-setup)
4. [File Structure](#file-structure)
5. [Database Setup (Supabase)](#database-setup-supabase)
6. [Core Components Implementation](#core-components-implementation)
7. [Styling and UI](#styling-and-ui)
8. [Features Implementation](#features-implementation)
9. [Deployment](#deployment)
10. [Credits](#credits)

---

## Project Overview

This is a comprehensive campus map application for Mubs University that provides:
- Interactive campus map with POI (Points of Interest) markers
- Navigation and directions between locations
- Voice-guided turn-by-turn navigation
- Location search and filtering
- User-generated content (adding new POIs)
- Responsive design for mobile and desktop

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Mapping**: Leaflet.js, Leaflet Routing Machine
- **Backend**: Supabase (PostgreSQL database, Authentication, Edge Functions)
- **Styling**: Tailwind CSS (can be replaced with custom CSS)
- **APIs**: OpenStreetMap tiles, OSRM routing service
- **Browser APIs**: Geolocation API, Web Speech API

## Project Setup

### Prerequisites
1. Node.js (for package management and build tools)
2. Supabase account
3. Basic understanding of HTML, CSS, JavaScript
4. Text editor (VS Code recommended)

### Initial Setup
```bash
# Create project directory
mkdir campus-map-app
cd campus-map-app

# Initialize npm project
npm init -y

# Install development dependencies
npm install --save-dev live-server
npm install leaflet leaflet-routing-machine
```

## File Structure

```
campus-map-app/
├── index.html
├── styles/
│   ├── main.css
│   ├── components.css
│   └── leaflet-custom.css
├── scripts/
│   ├── main.js
│   ├── map.js
│   ├── directions.js
│   ├── voice-navigation.js
│   ├── poi-manager.js
│   └── supabase-client.js
├── data/
│   └── initial-pois.js
└── assets/
    └── icons/
```

## Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### 2. Database Schema

Create the following table in Supabase SQL Editor:

```sql
-- Points of Interest table
CREATE TABLE public.pois (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'dining', 'recreation', 'services', 'transportation', 'emergency')),
  coordinates POINT NOT NULL,
  description TEXT,
  is_accessible BOOLEAN DEFAULT false,
  is_essential BOOLEAN DEFAULT false,
  hours TEXT,
  floor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view POIs" ON public.pois FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert POIs" ON public.pois FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own POIs" ON public.pois FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete their own POIs" ON public.pois FOR DELETE USING (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_pois_category ON public.pois(category);
CREATE INDEX idx_pois_coordinates ON public.pois USING GIST(coordinates);
```

## Core Components Implementation

### 1. HTML Structure (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mubs Campus Map</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="styles/main.css">
    <link rel="stylesheet" href="styles/components.css">
    <link rel="stylesheet" href="styles/leaflet-custom.css">
</head>
<body>
    <div id="app">
        <!-- Sidebar -->
        <div id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <h2>Mubs Campus Map</h2>
                <p class="subtitle">Navigate your campus with ease</p>
            </div>
            
            <!-- Search Section -->
            <div class="search-section">
                <div class="search-container">
                    <input type="text" id="searchInput" placeholder="Search locations..." class="search-input">
                    <button id="searchBtn" class="search-btn">🔍</button>
                </div>
            </div>
            
            <!-- Filter Controls -->
            <div class="filter-section">
                <button id="addLocationBtn" class="filter-btn primary">📍 Add New Location</button>
                <button id="essentialsBtn" class="filter-btn">⭐ First-Year Essentials</button>
                <button id="accessibleBtn" class="filter-btn">♿ Accessible Only</button>
                <button id="myLocationBtn" class="filter-btn">📍 My Location</button>
            </div>
            
            <!-- Categories -->
            <div class="categories-section">
                <h3>Categories</h3>
                <div class="categories-grid">
                    <button class="category-btn active" data-category="all">📍 All</button>
                    <button class="category-btn" data-category="academic">🎓 Academic</button>
                    <button class="category-btn" data-category="dining">🍽️ Dining</button>
                    <button class="category-btn" data-category="recreation">⚽ Recreation</button>
                    <button class="category-btn" data-category="services">🏢 Services</button>
                    <button class="category-btn" data-category="transportation">🚌 Transport</button>
                    <button class="category-btn" data-category="emergency">🏥 Emergency</button>
                </div>
            </div>
            
            <!-- POI List -->
            <div class="poi-list-section">
                <h3>Locations <span id="locationCount">(0)</span></h3>
                <div id="poiList" class="poi-list"></div>
            </div>
        </div>
        
        <!-- Main Map Container -->
        <div id="mapContainer" class="map-container">
            <div id="map" class="map"></div>
            
            <!-- Map Controls -->
            <div class="map-controls">
                <button id="voiceToggle" class="voice-toggle">🔊</button>
            </div>
            
            <!-- POI Details Card -->
            <div id="poiDetails" class="poi-details hidden">
                <button class="close-btn" id="closeDetails">×</button>
                <h3 id="poiName"></h3>
                <p id="poiDescription"></p>
                <div id="poiMeta" class="poi-meta"></div>
                <button id="getDirectionsBtn" class="directions-btn">🧭 Get Directions</button>
            </div>
            
            <!-- Directions Panel -->
            <div id="directionsPanel" class="directions-panel hidden">
                <div class="directions-header">
                    <button id="backToMap" class="back-btn">← Back</button>
                    <h3>Directions</h3>
                    <button id="voiceToggleDirections" class="voice-toggle">🔊</button>
                </div>
                <div id="directionsInfo" class="directions-info"></div>
                <button id="repeatInstruction" class="repeat-btn">🔄 Repeat Instruction</button>
            </div>
        </div>
        
        <!-- Add POI Modal -->
        <div id="addPoiModal" class="modal hidden">
            <div class="modal-content">
                <h3>Add New Point of Interest</h3>
                <form id="addPoiForm">
                    <input type="text" id="poiNameInput" placeholder="Location name" required>
                    <textarea id="poiDescInput" placeholder="Description"></textarea>
                    <select id="poiCategorySelect" required>
                        <option value="">Select category</option>
                        <option value="academic">🎓 Academic</option>
                        <option value="dining">🍽️ Dining</option>
                        <option value="recreation">⚽ Recreation</option>
                        <option value="services">🏢 Services</option>
                        <option value="transportation">🚌 Transportation</option>
                        <option value="emergency">🏥 Emergency</option>
                    </select>
                    <div class="form-actions">
                        <button type="button" id="cancelAddPoi">Cancel</button>
                        <button type="submit">Add POI</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Custom Scripts -->
    <script src="data/initial-pois.js"></script>
    <script src="scripts/supabase-client.js"></script>
    <script src="scripts/voice-navigation.js"></script>
    <script src="scripts/poi-manager.js"></script>
    <script src="scripts/directions.js"></script>
    <script src="scripts/map.js"></script>
    <script src="scripts/main.js"></script>
</body>
</html>
```

### 2. Supabase Client (scripts/supabase-client.js)

```javascript
// Supabase configuration
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database operations
class DatabaseManager {
    // Get all POIs
    static async getPOIs() {
        try {
            const { data, error } = await supabase
                .from('pois')
                .select('*');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching POIs:', error);
            return [];
        }
    }
    
    // Add new POI
    static async addPOI(poi) {
        try {
            const { data, error } = await supabase
                .from('pois')
                .insert([{
                    name: poi.name,
                    category: poi.category,
                    coordinates: `POINT(${poi.coordinates[1]} ${poi.coordinates[0]})`,
                    description: poi.description,
                    is_accessible: poi.isAccessible || false,
                    is_essential: poi.isEssential || false,
                    hours: poi.hours,
                    floor: poi.floor
                }]);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding POI:', error);
            throw error;
        }
    }
    
    // Update POI
    static async updatePOI(id, updates) {
        try {
            const { data, error } = await supabase
                .from('pois')
                .update(updates)
                .eq('id', id);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating POI:', error);
            throw error;
        }
    }
    
    // Delete POI
    static async deletePOI(id) {
        try {
            const { data, error } = await supabase
                .from('pois')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error deleting POI:', error);
            throw error;
        }
    }
}
```

### 3. Main Map Implementation (scripts/map.js)

```javascript
class CampusMap {
    constructor() {
        this.map = null;
        this.markers = new L.LayerGroup();
        this.userLocation = null;
        this.selectedPOI = null;
        this.pois = [];
        this.filteredPOIs = [];
        
        this.categoryColors = {
            academic: '#3B82F6',
            dining: '#EF4444',
            recreation: '#10B981',
            services: '#8B5CF6',
            transportation: '#F59E0B',
            emergency: '#DC2626'
        };
        
        this.categoryIcons = {
            academic: '🎓',
            dining: '🍽️',
            recreation: '⚽',
            services: '🏢',
            transportation: '🚌',
            emergency: '🏥'
        };
        
        this.initializeMap();
        this.loadPOIs();
        this.getUserLocation();
    }
    
    initializeMap() {
        // Initialize map centered on Mubs University
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true
        }).setView([0.3476, 32.5825], 18);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 20,
            detectRetina: true
        }).addTo(this.map);
        
        // Add markers layer
        this.markers.addTo(this.map);
        
        // Handle map clicks for adding POIs
        this.map.on('click', (e) => this.handleMapClick(e));
    }
    
    async loadPOIs() {
        try {
            // Load from database
            const dbPOIs = await DatabaseManager.getPOIs();
            
            // Convert database POIs to our format
            const convertedPOIs = dbPOIs.map(poi => ({
                id: poi.id,
                name: poi.name,
                category: poi.category,
                coordinates: this.parsePoint(poi.coordinates),
                description: poi.description,
                isAccessible: poi.is_accessible,
                isEssential: poi.is_essential,
                hours: poi.hours,
                floor: poi.floor
            }));
            
            // Merge with initial POIs if database is empty
            this.pois = convertedPOIs.length > 0 ? convertedPOIs : window.initialPOIs || [];
            this.filteredPOIs = [...this.pois];
            this.updateMap();
            this.updatePOIList();
        } catch (error) {
            console.error('Error loading POIs:', error);
            // Fallback to initial POIs
            this.pois = window.initialPOIs || [];
            this.filteredPOIs = [...this.pois];
            this.updateMap();
            this.updatePOIList();
        }
    }
    
    parsePoint(pointString) {
        // Parse PostgreSQL POINT format: "POINT(lng lat)"
        const match = pointString.match(/POINT\(([^)]+)\)/);
        if (match) {
            const [lng, lat] = match[1].split(' ').map(Number);
            return [lat, lng];
        }
        return [0, 0];
    }
    
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = [position.coords.latitude, position.coords.longitude];
                    this.addUserMarker();
                },
                (error) => {
                    console.log('Location access denied, using fallback');
                    this.userLocation = [0.3475, 32.5823];
                }
            );
        } else {
            this.userLocation = [0.3475, 32.5823];
        }
    }
    
    addUserMarker() {
        if (!this.userLocation) return;
        
        const userMarker = L.marker(this.userLocation, {
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
        }).addTo(this.map);
        
        userMarker.bindPopup('<strong>You are here</strong>');
    }
    
    updateMap() {
        this.markers.clearLayers();
        
        this.filteredPOIs.forEach(poi => {
            const marker = L.marker(poi.coordinates, {
                icon: L.divIcon({
                    html: `
                        <div style="
                            background: ${this.categoryColors[poi.category]}; 
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
                        ">
                            ${this.categoryIcons[poi.category]}
                            ${poi.isEssential ? '<div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #F59E0B; border: 2px solid white; border-radius: 50%;"></div>' : ''}
                        </div>
                    `,
                    className: 'poi-marker',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                })
            });
            
            marker.bindPopup(this.createPopupContent(poi));
            marker.on('click', () => this.selectPOI(poi));
            this.markers.addLayer(marker);
        });
    }
    
    createPopupContent(poi) {
        return `
            <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: #1f2937;">${poi.name}</h3>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${poi.description}</p>
                ${poi.hours ? `<p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Hours:</strong> ${poi.hours}</p>` : ''}
                ${poi.floor ? `<p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Floor:</strong> ${poi.floor}</p>` : ''}
                <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap;">
                    ${poi.isEssential ? '<span style="background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500;">Essential</span>' : ''}
                    ${poi.isAccessible ? '<span style="background: #D1FAE5; color: #065F46; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 500;">Accessible</span>' : ''}
                </div>
            </div>
        `;
    }
    
    selectPOI(poi) {
        this.selectedPOI = poi;
        this.showPOIDetails(poi);
        this.map.setView(poi.coordinates, 19);
    }
    
    showPOIDetails(poi) {
        const detailsPanel = document.getElementById('poiDetails');
        document.getElementById('poiName').textContent = poi.name;
        document.getElementById('poiDescription').textContent = poi.description;
        
        const metaDiv = document.getElementById('poiMeta');
        metaDiv.innerHTML = `
            ${poi.hours ? `<p><strong>Hours:</strong> ${poi.hours}</p>` : ''}
            ${poi.floor ? `<p><strong>Floor:</strong> ${poi.floor}</p>` : ''}
            <div class="poi-badges">
                ${poi.isEssential ? '<span class="badge essential">Essential</span>' : ''}
                ${poi.isAccessible ? '<span class="badge accessible">Accessible</span>' : ''}
                <span class="badge category" style="background-color: ${this.categoryColors[poi.category]}">${poi.category}</span>
            </div>
        `;
        
        detailsPanel.classList.remove('hidden');
    }
    
    hidePOIDetails() {
        document.getElementById('poiDetails').classList.add('hidden');
        this.selectedPOI = null;
    }
    
    filterPOIs(filters) {
        this.filteredPOIs = this.pois.filter(poi => {
            let matches = true;
            
            if (filters.search) {
                matches = matches && poi.name.toLowerCase().includes(filters.search.toLowerCase());
            }
            
            if (filters.category && filters.category !== 'all') {
                matches = matches && poi.category === filters.category;
            }
            
            if (filters.essentialsOnly) {
                matches = matches && poi.isEssential;
            }
            
            if (filters.accessibleOnly) {
                matches = matches && poi.isAccessible;
            }
            
            return matches;
        });
        
        this.updateMap();
        this.updatePOIList();
    }
    
    updatePOIList() {
        const listContainer = document.getElementById('poiList');
        const countElement = document.getElementById('locationCount');
        
        countElement.textContent = `(${this.filteredPOIs.length})`;
        
        listContainer.innerHTML = this.filteredPOIs.map(poi => `
            <div class="poi-item" data-poi-id="${poi.id}">
                <div class="poi-item-header">
                    <span class="poi-icon">${this.categoryIcons[poi.category]}</span>
                    <span class="poi-name">${poi.name}</span>
                </div>
                <p class="poi-item-description">${poi.description}</p>
                <div class="poi-item-badges">
                    ${poi.isEssential ? '<span class="badge essential">Essential</span>' : ''}
                    ${poi.isAccessible ? '<span class="badge accessible">Accessible</span>' : ''}
                </div>
                ${poi.hours ? `<p class="poi-hours">Hours: ${poi.hours}</p>` : ''}
            </div>
        `).join('');
        
        // Add click handlers
        listContainer.querySelectorAll('.poi-item').forEach(item => {
            item.addEventListener('click', () => {
                const poiId = item.dataset.poiId;
                const poi = this.filteredPOIs.find(p => p.id === poiId);
                if (poi) this.selectPOI(poi);
            });
        });
    }
    
    handleMapClick(e) {
        if (window.isAddingPOI) {
            window.tempPOICoords = [e.latlng.lat, e.latlng.lng];
            this.showAddPOIModal();
            window.isAddingPOI = false;
            document.body.style.cursor = '';
        }
    }
    
    showAddPOIModal() {
        document.getElementById('addPoiModal').classList.remove('hidden');
    }
    
    hideAddPOIModal() {
        document.getElementById('addPoiModal').classList.add('hidden');
        window.tempPOICoords = null;
    }
    
    async addPOI(poiData) {
        try {
            const newPOI = {
                id: Date.now().toString(),
                name: poiData.name,
                category: poiData.category,
                coordinates: window.tempPOICoords,
                description: poiData.description,
                isAccessible: false,
                isEssential: false
            };
            
            // Add to database
            await DatabaseManager.addPOI(newPOI);
            
            // Add to local array
            this.pois.push(newPOI);
            this.filteredPOIs = [...this.pois];
            
            // Update UI
            this.updateMap();
            this.updatePOIList();
            this.hideAddPOIModal();
            
            // Show success message
            this.showNotification('Location added successfully!', 'success');
        } catch (error) {
            console.error('Error adding POI:', error);
            this.showNotification('Failed to add location. Please try again.', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    goToMyLocation() {
        if (this.userLocation) {
            this.map.setView(this.userLocation, 18);
        } else {
            this.showNotification('Your location is not available.', 'warning');
        }
    }
}
```

### 4. Voice Navigation (scripts/voice-navigation.js)

```javascript
class VoiceNavigation {
    constructor() {
        this.isEnabled = true;
        this.currentInstructions = [];
        this.currentInstructionIndex = 0;
    }
    
    speak(text) {
        if (!this.isEnabled || !window.speechSynthesis) return;
        
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
    }
    
    processRouteInstructions(instructions, destinationName) {
        this.currentInstructions = instructions.map(instruction => {
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
        
        this.currentInstructionIndex = 0;
        
        // Speak the first instruction
        if (this.currentInstructions.length > 0) {
            this.speak(`Starting navigation to ${destinationName}. ${this.currentInstructions[0]}`);
        }
    }
    
    repeatCurrentInstruction() {
        if (this.currentInstructions.length > 0 && this.currentInstructionIndex < this.currentInstructions.length) {
            const instruction = this.currentInstructions[this.currentInstructionIndex];
            this.speak(instruction);
        }
    }
    
    nextInstruction() {
        if (this.currentInstructionIndex < this.currentInstructions.length - 1) {
            this.currentInstructionIndex++;
            this.repeatCurrentInstruction();
        }
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            window.speechSynthesis.cancel();
        }
        return this.isEnabled;
    }
    
    stop() {
        window.speechSynthesis.cancel();
        this.currentInstructions = [];
        this.currentInstructionIndex = 0;
    }
}
```

### 5. Directions Manager (scripts/directions.js)

```javascript
class DirectionsManager {
    constructor(map, voiceNavigation) {
        this.map = map;
        this.voiceNavigation = voiceNavigation;
        this.routingControl = null;
        this.isShowingDirections = false;
    }
    
    showDirections(destination, userLocation) {
        if (!userLocation) {
            campusMap.showNotification('Your location is not available', 'error');
            return;
        }
        
        this.clearPreviousRoute();
        this.isShowingDirections = true;
        
        // Show directions panel
        document.getElementById('directionsPanel').classList.remove('hidden');
        document.getElementById('sidebar').style.display = 'none';
        
        // Update directions info
        const directionsInfo = document.getElementById('directionsInfo');
        directionsInfo.innerHTML = `
            <h4>Directions to ${destination.name}</h4>
            <p>${destination.description}</p>
            <div class="route-status">Planning route...</div>
        `;
        
        try {
            this.routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(userLocation[0], userLocation[1]),
                    L.latLng(destination.coordinates[0], destination.coordinates[1])
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
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                })
            });
            
            this.routingControl.on('routesfound', (e) => {
                const routes = e.routes;
                const summary = routes[0].summary;
                const distance = (summary.totalDistance / 1000).toFixed(1);
                const time = Math.round(summary.totalTime / 60);
                
                // Update directions info
                directionsInfo.innerHTML = `
                    <h4>Directions to ${destination.name}</h4>
                    <p>${destination.description}</p>
                    <div class="route-summary">
                        <span class="route-distance">${distance} km</span>
                        <span class="route-time">${time} minutes</span>
                    </div>
                    <div class="route-status success">Route found!</div>
                `;
                
                // Process instructions for voice guidance
                if (routes[0].instructions) {
                    this.voiceNavigation.processRouteInstructions(routes[0].instructions, destination.name);
                }
                
                campusMap.showNotification(`Route found! ${distance}km, ${time} minutes`, 'success');
            });
            
            this.routingControl.on('routingerror', (e) => {
                console.error('Routing error:', e);
                
                // Show fallback route
                const polyline = L.polyline([userLocation, destination.coordinates], {
                    color: '#3B82F6',
                    opacity: 0.8,
                    weight: 8,
                    dashArray: '15, 10'
                }).addTo(this.map);
                
                this.map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
                
                directionsInfo.innerHTML = `
                    <h4>Directions to ${destination.name}</h4>
                    <p>${destination.description}</p>
                    <div class="route-status error">Could not find detailed route. Showing direct path.</div>
                `;
                
                // Provide basic voice instruction
                this.voiceNavigation.speak(`Heading directly to ${destination.name}. Follow the blue line on the map.`);
                
                campusMap.showNotification('Could not find route. Showing direct line instead.', 'warning');
            });
            
            this.routingControl.addTo(this.map);
            
        } catch (error) {
            console.error('Error creating route:', error);
            directionsInfo.innerHTML = `
                <h4>Directions to ${destination.name}</h4>
                <p>${destination.description}</p>
                <div class="route-status error">Unable to create route. Please try again.</div>
            `;
            campusMap.showNotification('Unable to create route. Please try again.', 'error');
        }
    }
    
    hideDirections() {
        this.clearPreviousRoute();
        this.isShowingDirections = false;
        
        // Hide directions panel and show sidebar
        document.getElementById('directionsPanel').classList.add('hidden');
        document.getElementById('sidebar').style.display = 'block';
        
        // Stop voice navigation
        this.voiceNavigation.stop();
    }
    
    clearPreviousRoute() {
        if (this.routingControl) {
            this.map.removeControl(this.routingControl);
            this.routingControl = null;
        }
    }
    
    repeatInstruction() {
        this.voiceNavigation.repeatCurrentInstruction();
    }
}
```

### 6. Initial POI Data (data/initial-pois.js)

```javascript
window.initialPOIs = [
    {
        id: '1',
        name: 'Main Library',
        category: 'academic',
        coordinates: [0.3476, 32.5825],
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
    }
];
```

### 7. Main Application Controller (scripts/main.js)

```javascript
// Global variables
let campusMap;
let voiceNavigation;
let directionsManager;
let currentFilters = {
    search: '',
    category: 'all',
    essentialsOnly: false,
    accessibleOnly: false
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Initialize core components
    voiceNavigation = new VoiceNavigation();
    campusMap = new CampusMap();
    directionsManager = new DirectionsManager(campusMap.map, voiceNavigation);
    
    console.log('Campus Map Application initialized');
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value;
        campusMap.filterPOIs(currentFilters);
    });
    
    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value;
        campusMap.filterPOIs(currentFilters);
    });
    
    // Filter buttons
    document.getElementById('essentialsBtn').addEventListener('click', (e) => {
        currentFilters.essentialsOnly = !currentFilters.essentialsOnly;
        e.target.classList.toggle('active', currentFilters.essentialsOnly);
        campusMap.filterPOIs(currentFilters);
    });
    
    document.getElementById('accessibleBtn').addEventListener('click', (e) => {
        currentFilters.accessibleOnly = !currentFilters.accessibleOnly;
        e.target.classList.toggle('active', currentFilters.accessibleOnly);
        campusMap.filterPOIs(currentFilters);
    });
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update filter
            currentFilters.category = e.target.dataset.category;
            campusMap.filterPOIs(currentFilters);
        });
    });
    
    // My Location button
    document.getElementById('myLocationBtn').addEventListener('click', () => {
        campusMap.goToMyLocation();
    });
    
    // Add POI functionality
    document.getElementById('addLocationBtn').addEventListener('click', () => {
        window.isAddingPOI = true;
        document.body.style.cursor = 'crosshair';
        campusMap.showNotification('Click on the map to add a new location', 'info');
    });
    
    // POI Details
    document.getElementById('closeDetails').addEventListener('click', () => {
        campusMap.hidePOIDetails();
    });
    
    document.getElementById('getDirectionsBtn').addEventListener('click', () => {
        if (campusMap.selectedPOI && campusMap.userLocation) {
            directionsManager.showDirections(campusMap.selectedPOI, campusMap.userLocation);
            campusMap.hidePOIDetails();
        }
    });
    
    // Directions
    document.getElementById('backToMap').addEventListener('click', () => {
        directionsManager.hideDirections();
    });
    
    document.getElementById('repeatInstruction').addEventListener('click', () => {
        directionsManager.repeatInstruction();
    });
    
    // Voice toggles
    document.getElementById('voiceToggle').addEventListener('click', (e) => {
        const isEnabled = voiceNavigation.toggle();
        e.target.textContent = isEnabled ? '🔊' : '🔇';
        e.target.classList.toggle('active', isEnabled);
        campusMap.showNotification(`Voice guidance ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
    });
    
    document.getElementById('voiceToggleDirections').addEventListener('click', (e) => {
        const isEnabled = voiceNavigation.toggle();
        e.target.textContent = isEnabled ? '🔊' : '🔇';
        e.target.classList.toggle('active', isEnabled);
    });
    
    // Add POI Modal
    document.getElementById('addPoiForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('poiNameInput').value,
            description: document.getElementById('poiDescInput').value,
            category: document.getElementById('poiCategorySelect').value
        };
        
        await campusMap.addPOI(formData);
        
        // Reset form
        e.target.reset();
    });
    
    document.getElementById('cancelAddPoi').addEventListener('click', () => {
        campusMap.hideAddPOIModal();
        document.getElementById('addPoiForm').reset();
    });
    
    // Close modal when clicking outside
    document.getElementById('addPoiModal').addEventListener('click', (e) => {
        if (e.target.id === 'addPoiModal') {
            campusMap.hideAddPOIModal();
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for global access
window.campusMap = campusMap;
window.voiceNavigation = voiceNavigation;
window.directionsManager = directionsManager;
```

## Styling and UI

### 1. Main Styles (styles/main.css)

```css
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f8fafc;
    color: #1f2937;
    overflow: hidden;
}

#app {
    display: flex;
    height: 100vh;
}

/* Sidebar */
.sidebar {
    width: 384px;
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    z-index: 1000;
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h2 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #6b7280;
    font-size: 0.875rem;
}

/* Search section */
.search-section {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
}

.search-container {
    display: flex;
    gap: 0.5rem;
}

.search-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
    padding: 0.75rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
}

.search-btn:hover {
    background: #2563eb;
}

/* Filter section */
.filter-section {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-btn {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
    transition: all 0.2s;
}

.filter-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.filter-btn.active,
.filter-btn.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.filter-btn.active:hover,
.filter-btn.primary:hover {
    background: #2563eb;
}

/* Categories section */
.categories-section {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
}

.categories-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
}

.categories-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
}

.category-btn {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.75rem;
    text-align: left;
    transition: all 0.2s;
}

.category-btn:hover {
    background: #f9fafb;
}

.category-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

/* POI List section */
.poi-list-section {
    padding: 1rem;
}

.poi-list-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #374151;
}

.poi-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Map container */
.map-container {
    flex: 1;
    position: relative;
    background: white;
    border-radius: 0.75rem;
    margin: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.map {
    width: 100%;
    height: 100%;
    border-radius: 0.75rem;
}

/* Map controls */
.map-controls {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
}

.voice-toggle {
    padding: 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.25rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
}

.voice-toggle:hover {
    background: #f9fafb;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.voice-toggle.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

/* POI Details */
.poi-details {
    position: absolute;
    bottom: 1.5rem;
    left: 1.5rem;
    right: 1.5rem;
    max-width: 400px;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    padding: 1.5rem;
    z-index: 1000;
}

.poi-details.hidden {
    display: none;
}

.poi-details .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.poi-details .close-btn:hover {
    color: #374151;
}

.poi-details h3 {
    font-size: 1.25rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 0.75rem;
    padding-right: 2rem;
}

.poi-details p {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
}

.poi-meta {
    margin-bottom: 1rem;
}

.poi-meta p {
    margin-bottom: 0.5rem;
    color: #374151;
    font-size: 0.875rem;
}

.poi-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
}

.directions-btn {
    width: 100%;
    padding: 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.directions-btn:hover {
    background: #2563eb;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Directions Panel */
.directions-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    z-index: 2000;
    display: flex;
    flex-direction: column;
}

.directions-panel.hidden {
    display: none;
}

.directions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;
}

.back-btn {
    padding: 0.5rem 1rem;
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #374151;
}

.back-btn:hover {
    background: #f9fafb;
}

.directions-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
}

.directions-info {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
}

.directions-info h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.directions-info p {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.route-summary {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
}

.route-distance,
.route-time {
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
}

.route-status {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 1rem 0;
}

.route-status.success {
    background: #d1fae5;
    color: #065f46;
}

.route-status.error {
    background: #fee2e2;
    color: #991b1b;
}

.repeat-btn {
    margin: 1rem 1.5rem;
    padding: 0.75rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
}

.repeat-btn:hover {
    background: #2563eb;
}

/* Responsive design */
@media (max-width: 768px) {
    #app {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        height: 40vh;
        order: 2;
    }
    
    .map-container {
        height: 60vh;
        order: 1;
        margin: 0;
        border-radius: 0;
    }
    
    .poi-details {
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        max-width: none;
    }
    
    .categories-grid {
        grid-template-columns: 1fr;
    }
}
```

### 2. Component Styles (styles/components.css)

```css
/* POI Item Component */
.poi-item {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
}

.poi-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.poi-item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.poi-icon {
    font-size: 1.125rem;
}

.poi-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
}

.poi-item-description {
    color: #6b7280;
    font-size: 0.75rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
}

.poi-item-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}

.poi-hours {
    color: #6b7280;
    font-size: 0.75rem;
    margin: 0;
}

/* Badge Component */
.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-block;
}

.badge.essential {
    background: #fef3c7;
    color: #92400e;
}

.badge.accessible {
    background: #d1fae5;
    color: #065f46;
}

.badge.category {
    color: white;
}

/* Modal Component */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 1.5rem;
}

.modal-content form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.modal-content input,
.modal-content textarea,
.modal-content select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
}

.modal-content input:focus,
.modal-content textarea:focus,
.modal-content select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-content textarea {
    resize: vertical;
    min-height: 80px;
}

.form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.form-actions button {
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.form-actions button[type="button"] {
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
}

.form-actions button[type="button"]:hover {
    background: #f9fafb;
}

.form-actions button[type="submit"] {
    background: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;
}

.form-actions button[type="submit"]:hover {
    background: #2563eb;
}

/* Notification Component */
.notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 4000;
    animation: slideIn 0.3s ease-out;
}

.notification.success {
    background: #10b981;
}

.notification.error {
    background: #ef4444;
}

.notification.warning {
    background: #f59e0b;
}

.notification.info {
    background: #3b82f6;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Loading states */
.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #6b7280;
}

.loading::after {
    content: '';
    width: 20px;
    height: 20px;
    margin-left: 0.5rem;
    border: 2px solid #d1d5db;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

### 3. Leaflet Custom Styles (styles/leaflet-custom.css)

```css
/* Enhanced Leaflet styling */
.leaflet-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f8fafc;
}

/* Custom marker styles */
.user-location-marker {
    background: none !important;
    border: none !important;
}

.poi-marker {
    background: none !important;
    border: none !important;
}

/* Enhanced popup styling */
.leaflet-popup-content-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
}

.leaflet-popup-content {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.leaflet-popup-tip {
    background: white;
    border: 1px solid #e5e7eb;
    box-shadow: none;
}

/* Enhanced controls styling */
.leaflet-control-zoom {
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #e5e7eb !important;
}

.leaflet-control-zoom a {
    border-radius: 0 !important;
    border: none !important;
    font-size: 18px !important;
    font-weight: bold !important;
    color: #374151 !important;
    background: white !important;
}

.leaflet-control-zoom a:first-child {
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
}

.leaflet-control-zoom a:last-child {
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
}

.leaflet-control-zoom a:hover {
    background: #f3f4f6 !important;
    color: #1f2937 !important;
}

/* Enhanced routing control styling */
.leaflet-routing-container {
    background: white !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #e5e7eb !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}

.leaflet-routing-container h2 {
    background: #f8fafc !important;
    border-radius: 12px 12px 0 0 !important;
    border-bottom: 1px solid #e5e7eb !important;
    font-weight: 600 !important;
    color: #1f2937 !important;
}

/* Pulse animation for essential POIs */
@keyframes pulse {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
}

/* Improved tile loading */
.leaflet-tile {
    filter: contrast(1.1) brightness(1.05);
}

/* Attribution styling */
.leaflet-control-attribution {
    background: rgba(255, 255, 255, 0.9) !important;
    border-radius: 4px !important;
    font-size: 0.75rem !important;
}
```

## Features Implementation

### Key Features Implemented:

1. **Interactive Map**: Leaflet.js with OpenStreetMap tiles
2. **POI Management**: Add, view, search, and filter points of interest
3. **Navigation**: Turn-by-turn directions with voice guidance
4. **Voice Navigation**: Text-to-speech for direction instructions
5. **User Location**: GPS-based location detection
6. **Responsive Design**: Works on desktop and mobile devices
7. **Database Integration**: Supabase for data persistence
8. **Real-time Updates**: Live synchronization of POI data

### Advanced Features:
- Category-based filtering
- Accessibility indicators
- Essential location highlighting
- Search functionality
- Custom POI creation
- Voice-controlled navigation
- Route optimization

## Deployment

### Local Development:
```bash
# Start development server
npx live-server
```

### Production Deployment:

1. **Static Hosting** (Netlify, Vercel, GitHub Pages):
   - Build the project
   - Deploy static files
   - Configure environment variables

2. **Supabase Configuration**:
   - Set up production database
   - Configure authentication
   - Set up edge functions if needed

3. **Environment Variables**:
   ```javascript
   const SUPABASE_URL = 'your-production-supabase-url';
   const SUPABASE_ANON_KEY = 'your-production-supabase-key';
   ```

## Credits

**Developer**: Mugerwa Simon Peter  
**Special Tribute**: SICA Developers

### Acknowledgments:
- **Leaflet.js** - Interactive mapping library
- **OpenStreetMap** - Map data and tiles
- **Supabase** - Backend infrastructure
- **OSRM** - Routing services
- **Web Speech API** - Voice synthesis

### License:
This project is developed for educational purposes and campus navigation enhancement.

---

*This documentation provides a complete guide for developing the campus map application using vanilla HTML, CSS, JavaScript, Leaflet, and Supabase. Follow the structure and implementation details to recreate the exact functionality of the original application.*
