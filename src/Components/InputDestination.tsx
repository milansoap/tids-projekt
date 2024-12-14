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
            const result = {
                distance: route.distance.text,
                duration: route.duration.text,
            };
            setDistance(result.distance);
            setDuration(result.duration);

            // Get waypoints for gas station search
            const waypoints = directionsData.routes[0].overview_polyline.points;

            // Call Places API to find gas stations along waypoints
            const gasStations = await fetchGasStations(waypoints);

            // Pass all data to parent
            onResponse({ ...result, gasStations });
        } else {
            alert('No route found. Check the inputs.');
        }
    };

    const fetchGasStations = async (waypoints) => {
        const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY; // Load from .env
        const radius = 5000; // Search within 5km of each waypoint
        const gasStations = [];

        for (const point of waypoints) {
            const { lat, lng } = point;
            const placesResponse = await fetch(
                `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gas_station&key=${API_KEY}`
            );

            const placesData = await placesResponse.json();
            if (placesData.results.length > 0) {
                gasStations.push(
                    ...placesData.results.map((station) => ({
                        name: station.name,
                        address: station.vicinity,
                        location: station.geometry.location,
                    }))
                );
            }
        }

        // Remove duplicates by station name and location
        const uniqueGasStations = gasStations.filter(
            (station, index, self) =>
                index ===
                self.findIndex(
                    (s) =>
                        s.name === station.name &&
                        s.location.lat === station.location.lat &&
                        s.location.lng === station.location.lng
                )
        );

        return uniqueGasStations;
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