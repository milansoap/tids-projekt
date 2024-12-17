import React, { useEffect, useState } from 'react';

const WeatherComponent = () => {
    const [weatherOnArrival, setWeatherOnArrival] = useState("Loading...");
    const destinationCity = "Rome"; // Ensure this is defined

    useEffect(() => {
        const eventSource = new EventSource(`http://localhost:8084/get-weather-notifications/${encodeURIComponent(destinationCity)}`);

        // Listen for 'keep-alive' events
        eventSource.addEventListener('keep-alive', (event) => {
            console.log('Keep alive event received:', event.data);
        });

        // Listen for 'data' events
        eventSource.addEventListener('data', (event) => {
            console.log('Data event received:', event.data);
            setWeatherOnArrival(JSON.parse(event.data));
        });

        // Connection opened
        eventSource.onopen = () => {
            console.log('SSE connection opened');
        };

        // Error handling
        eventSource.onerror = (error) => {
            console.error('Error with SSE connection:', error);
            eventSource.close();
        };

        // Cleanup the EventSource connection on component unmount
        return () => {
            eventSource.close();
        };
    }, [destinationCity]); // Include destinationCity in dependencies if it's a variable

    return (
        <div>
            <p>Weather on Arrival: {JSON.stringify(weatherOnArrival)}</p>
        </div>
    );
};

export default WeatherComponent;