import React, {useState} from "react";

export default function InputDestination({ onResponse }) {

    const [start, setStart] = useState('Maribor');
    const [end, setEnd] = useState('Ljubljana');
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');

    const fetchRoute = async () => {
        const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY; // Load from .env
        const directionsResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${end}&key=${API_KEY}`
        );

        const directionsData = await directionsResponse.json();

        if (directionsData.routes.length > 0) {
            const route = directionsData.routes[0].legs[0];

            // Extract overall travel details
            const result = {
                distance: route.distance.text,
                duration: route.duration.text,
                startAddress: route.start_address,
                endAddress: route.end_address,
            };

            // Extract countries traversed along the entire route
            const countries = await extractCountriesFromSteps(directionsData.routes[0].legs);

            // Pass all data to parent
            onResponse({ ...result, countries });
        } else {
            alert('No route found. Check the inputs.');
        }
    };

// Extract countries from the detailed steps
    const extractCountriesFromSteps = async (legs) => {
        const countries = new Set();

        for (const leg of legs) {
            for (const step of leg.steps) {
                // Use the step's location to reverse geocode the country
                const { lat, lng } = step.end_location;
                const country = await reverseGeocodeCountry(lat, lng);
                if (country) countries.add(country);
            }
        }

        return Array.from(countries); // Convert Set to Array
    };

// Use Google's Geocoding API to get the country for a given lat/lng
    const reverseGeocodeCountry = async (lat, lng) => {
        const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
        const geocodeResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
        );

        const geocodeData = await geocodeResponse.json();

        // Extract the country from the geocoding result
        const countryComponent = geocodeData.results.find((result) =>
            result.types.includes("country")
        );

        return countryComponent ? countryComponent.formatted_address : null;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetchRoute();
    };

    return (

        <div className="App">
            <header className="App-header">
                <h2 style={{marginBottom: '20px', fontSize: '40px'}}>Travel Cost Calculator</h2>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '15px',
                    }}
                >
                    <div style={{width: '100%', maxWidth: '400px'}}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}
                        >
                            From:
                        </label>
                        <input
                            type="text"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            placeholder="Enter starting point"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #ccc',
                                fontSize: '16px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </div>
                    <div style={{width: '100%', maxWidth: '400px'}}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}
                        >
                            To:
                        </label>
                        <input
                            type="text"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            placeholder="Enter finishing point"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #ccc',
                                fontSize: '16px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'background-color 0.3s',
                        }}
                        onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = '#45a049')
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor = '#4CAF50')
                        }
                    >
                        Submit
                    </button>
                </form>

                {distance && duration && (
                    <div style={{marginTop: '20px', textAlign: 'center'}}>
                        <p>
                            <strong>Distance:</strong> {distance}
                        </p>
                        <p>
                            <strong>Duration:</strong> {duration}
                        </p>
                    </div>
                )}
            </header>
        </div>
    )

}