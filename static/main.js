window.onload = function() {
    // Initialize Leaflet Map
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    const voiceStatus = document.getElementById('voice-status');
    let userLocation = null;
    let userMarker = null;
    
    // Get user's current location
    function updateUserLocation() {
        voiceStatus.innerText = "Getting your location...";
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    voiceStatus.innerText = `Location found: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`;
                    
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }
                    
                    userMarker = L.marker(userLocation).addTo(map)
                        .bindPopup('You are here')
                        .openPopup();
                        
                    map.setView(userLocation, 12);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    let errorMsg = "Unable to fetch location. ";
                    voiceStatus.innerText = errorMsg;
                }
            );
        } else {
            voiceStatus.innerText = "Geolocation not supported in your browser";
        }
    }
    
    // Show user's location on map
    function showMyLocation() {
        if (userLocation) {
            map.setView(userLocation, 15);
            voiceStatus.innerText = `Your location: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`;
        } else {
            voiceStatus.innerText = "Your location is not available yet";
            updateUserLocation(); // Try to get location if not available
        }
    }
    
    // Map zoom functions
    function zoomIn() {
        map.zoomIn();
        voiceStatus.innerText = "Zooming in...";
    }
    
    function zoomOut() {
        map.zoomOut();
        voiceStatus.innerText = "Zooming out...";
    }
    
    // Function to find a location
    function findLocation(query) {
        voiceStatus.innerText = `Searching for ${query}...`;
        $.getJSON(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, function(data) {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                map.setView([lat, lon], 12);
                L.marker([lat, lon]).addTo(map).bindPopup(query).openPopup();
                voiceStatus.innerText = `Showing location: ${query}`;
            } else {
                voiceStatus.innerText = `No results found for "${query}".`;
            }
        });
    }
    
    // Function to find nearby places (like restaurants, hospitals)
    function findNearbyPlaces(type) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                map.setView([lat, lon], 14);
                
                // Displaying a marker for user's location
                L.marker([lat, lon]).addTo(map).bindPopup("Your location").openPopup();
                voiceStatus.innerText = `Searching for nearby ${type}...`;
                
                // Simulating a search for nearby places
                $.getJSON(`https://nominatim.openstreetmap.org/search?format=json&q=${type}&viewbox=${lon-0.05},${lat+0.05},${lon+0.05},${lat-0.05}`, function(data) {
                    if (data.length > 0) {
                        data.forEach(place => {
                            L.marker([place.lat, place.lon]).addTo(map).bindPopup(`${place.display_name}`);
                        });
                        voiceStatus.innerText = `Found nearby ${type}.`;
                    } else {
                        voiceStatus.innerText = `No ${type} found nearby.`;
                    }
                });
            });
        } else {
            voiceStatus.innerText = "Geolocation is not supported by this browser.";
        }
    }
    
    // Function to find route between two locations
    function findRoute(source, destination) {
        voiceStatus.innerText = `Finding route from ${source} to ${destination}...`;
        // Currently, no routing service is integrated; placeholder function
        alert(`Routing feature is under development.`);
    }
    
    // Test command function
    function testCommand() {
        voiceStatus.innerText = "Voice recognition test successful!";
        alert("Voice system is working!");
    }
    
    // Get initial location when page loads
    updateUserLocation();
    
    // Setting up voice commands using annyang
    if (annyang) {
        // Remove any previous commands
        annyang.removeCommands();
        
        // Define commands with multiple variations
        const commands = {
            // Original commands
            "show *place": findLocation,
            "find *type near me": findNearbyPlaces,
            "route from *source to *destination": findRoute,
            
            // Added commands for problematic voice recognition
            "zoom in": zoomIn,
            "make bigger": zoomIn,
            "plus": zoomIn,
            
            "zoom out": zoomOut,
            "make smaller": zoomOut,
            "minus": zoomOut,
            
            // Problem commands with variations
            "update location": updateUserLocation,
            "update": updateUserLocation,
            "location": updateUserLocation,
            "refresh location": updateUserLocation,
            "get location": updateUserLocation,
            "find me": updateUserLocation,
            
            "where am I": showMyLocation,
            "where I am": showMyLocation,
            "my location": showMyLocation,
            "show me": showMyLocation,
            "find my location": showMyLocation,
            
            // Test command
            "test command": testCommand,
            "test": testCommand
        };
        
        // Add debug listeners for better troubleshooting
        annyang.addCallback('resultNoMatch', function(phrases) {
            console.log("No match found for:", phrases);
            
            // Manual parsing for problematic commands
            for (const phrase of phrases) {
                const lowerPhrase = phrase.toLowerCase();
                
                // Manual handling for update location
                if (lowerPhrase.includes("update") || 
                    lowerPhrase.includes("location") || 
                    lowerPhrase.includes("refresh")) {
                    console.log("Manual match: update location");
                    updateUserLocation();
                    return;
                }
                
                // Manual handling for where am I
                if (lowerPhrase.includes("where") || 
                    (lowerPhrase.includes("my") && lowerPhrase.includes("location"))) {
                    console.log("Manual match: where am I");
                    showMyLocation();
                    return;
                }
            }
        });
        
        // Add feedback for heard phrases
        annyang.addCallback('result', function(phrases) {
            console.log("Heard phrases:", phrases);
            voiceStatus.innerText = "I heard: " + phrases[0];
        });
        
        // Add commands to annyang
        annyang.addCommands(commands);
        
        // Set language explicitly for better recognition
        annyang.setLanguage('en-US');
        
        // Start with more permissive options
        annyang.start({ 
            autoRestart: true, 
            continuous: true
        });
        
        voiceStatus.innerText = "Voice recognition active. Try speaking a command.";
    } else {
        voiceStatus.innerText = "Voice recognition is not supported.";
    }
};