import React, {useEffect, useState} from "react";

export default function InputDestination() {

    const [start, setStart] = useState('Madrid');
    const [end, setEnd] = useState('Rome');
    const [consumption, setConsumption] = useState(7);
    const [isLoading, setIsLoading] = useState(false); // Spinner state
    const [routeData, setRouteData] = useState(null); // Data to display
    const [destinationCity ,setDestinationCity] = useState("");
    const [tollCost, setTollCost] = useState(0);
    const [totalTripCost, setTotalTripCost] = useState(0);
    const [fuelExpense ,setFuelExpense] = useState(0)
    const [showPopup, setShowPopup] = useState(false); // New state for popup visibility

    const [loadingTollCost, setLoadingTollCost] = useState(false);
    const [loadingTotalTripCost, setLoadingTotalTripCost] = useState(false);

    const popupStyles: React.CSSProperties = {
        position: "fixed", // Fixed position with valid literal
        bottom: "20px",
        fontSize: "24px",
        right: "20px",
        padding: "5px 30px",
        backgroundColor: "#4CAF50",
        color: "white",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
        zIndex: 1000,
    };

    const [weatherOnArrival, setWeatherOnArrival] = useState("Unknown (Press button to fetch weather)")
    // UseEffect to handle changes in routeData
    useEffect(() => {
        console.log('ALOO')
        console.log(routeData)
        if (routeData) {
            console.log("Route data has been updated:", routeData);
            // Perform additional logic here, e.g., analytics or animations
        }
    }, [routeData]);

    useEffect(() => {
       setTotalTripCost(tollCost + fuelExpense)
    }, [tollCost, fuelExpense]);


    const formatAddress = (address) => {
        return address.split(',')[0].toLowerCase();
    };

    const fetchRoute = async () => {
        const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY; // Load from .env
        const directionsResponse = await fetch(
            `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${end}&key=${API_KEY}&computeToll=true`
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
            const countries: string[] = await extractCountriesFromSteps(directionsData.routes[0].legs);
            const countriesString: string = countries.join(' '); // Join countries with spaces
            const startingCountry: string = countries[0];

            const totalFuelCost = await calculateFuelForTrip(startingCountry, consumption, route.distance.value / 1000);
// const tollCost = calculateTollForTrip(startingCountry, );
            calculateTollForTrip(formatAddress(result.startAddress), formatAddress(result.endAddress));
            setDestinationCity(formatAddress(result.endAddress))

            return { ...result, countries: countriesString, totalFuelCost };


        } else {
            alert('No route found. Check the inputs.');
        }
    };

    interface Step {
        end_location: {
            lat: number;
            lng: number;
        };
    }

    interface Leg {
        steps: Step[];
    }

    // Extract countries from the detailed steps
    const extractCountriesFromSteps = async (legs: Leg[]): Promise<string[]> => {
        const countries = new Set<string>();

        for (const leg of legs) {
            for (let i = 0; i < leg.steps.length; i += 60) { // Process every 25th step
                const { lat, lng } = leg.steps[i].end_location;
                const country = await reverseGeocodeCountry(lat, lng);
                if (country) countries.add(country);
            }
        }

        return Array.from(countries); // Convert Set to Array
    };

    const calculateFuelForTrip  = async (country: string, consumption: number, totalKilometres:number) => {
        console.log(country, consumption, totalKilometres);
        let getCountryPrice = await getFuelPriceFromStartingCountry(country);
        let expense = parseFloat((((totalKilometres / 100) * consumption) * getCountryPrice).toFixed(2))
        setFuelExpense(expense)
        return expense;
    }


    useEffect(() => {
        console.log('promenio se')
    }, [weatherOnArrival]);


    const calculateTollForTrip = async (from: string, to: string) => {
        setLoadingTollCost(true);
        let tollPrice: number = 0;

        try {

            const response = await fetch(`http://localhost:8081/api/get-toll-price/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);

            // setTollCost(response)
            if (!response.ok) {
                throw new Error(`Failed to fetch toll prices`);
            }
            const data = await response.json();
            setTollCost(Number(data))
            setLoadingTollCost(false)
            // return data.fuelPrice || 1.50; // Default fallback value if fuelPrice is missing

        } catch (err) {
            console.log(err)
        }

        return tollPrice;
    }

    // TODO - implement web scraping here
    const getFuelPriceFromStartingCountry  = async (country: string) => {
        try {
            const response = await fetch(`http://localhost:8081/api/get-fuel-price-for-country/${encodeURIComponent(country)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch fuel price for ${country}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.fuelPrice || 1.50; // Default fallback value if fuelPrice is missing
        } catch (error) {
            console.error("Error fetching fuel price:", error);
            return 1.50; // Return a default fallback value if an error occurs
        }
    }

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


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Show loading spinner
        try {
            const data = await fetchRoute();
            setRouteData(data); // Set the fetched data
            // onResponse(data); // Pass data to parent (if needed)
        } catch (error) {
            console.error("Error fetching route:", error);
        } finally {
            setIsLoading(false); // Hide loading spinner
        }
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
                                marginBottom: '2px',
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
                                marginBottom: '2px',
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

                    <div style={{width: '100%', maxWidth: '400px'}}>

                        <label
                            style={{
                                display: 'block',
                                marginBottom: '2px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                            }}
                        >
                            Fuel consuption
                        </label>
                        <input
                            type="number"
                            value={consumption}
                            onChange={(e) => setConsumption(Number(e.target.value))}
                            placeholder="Enter number"
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

                {isLoading && (
                    <div style={{marginTop: "20px", fontSize: "18px"}}>
                        <p>Loading...</p>
                    </div>
                )}

                {routeData && (
                    <div
                        style={{
                            marginTop: "20px",
                            textAlign: "center",
                            fontSize: "16px",
                            padding: "20px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                            backgroundColor: "#f9f9f9",
                            maxWidth: "600px",
                            margin: "20px auto",
                            color: 'black'
                        }}
                    >
                        <h2 style={{color: "#4CAF50", marginBottom: "20px"}}>Route Details</h2>
                        <p>
                            <strong>Distance:</strong> {routeData.distance}
                        </p>
                        <p>
                            <strong>Duration:</strong> {routeData.duration}
                        </p>
                        <p>
                            <strong>Start Address:</strong> {routeData.startAddress}
                        </p>
                        <p>
                            <strong>End Address:</strong> {routeData.endAddress}
                        </p>
                        <p>
                            <strong>Total fuel cost:</strong> {routeData.totalFuelCost}
                        </p>


                        <p>
                            <strong>Toll Cost:</strong> {loadingTollCost ? "Calculating..." : tollCost}
                        </p>

                        <p>
                            <strong>Countries:</strong> {routeData.countries}
                        </p>
                        <p>
                            <strong>Weather upon Arrival:</strong> {weatherOnArrival}
                        </p>

                        <p>
                            <strong>Total price:</strong> {loadingTotalTripCost ? "Loading..." : totalTripCost + "e"}
                        </p>
                        <button
                            type="submit"
                            style={{
                                padding: "10px 20px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                fontSize: "16px",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                transition: "transform 0.2s, background-color 0.3s",
                            }}
                            onClick={() => {
                                const url = `http://localhost:8084/get-weather-notifications/${encodeURIComponent(destinationCity)}`;
                                const eventSource = new EventSource(url);

                                eventSource.addEventListener("keep-alive", (event) => {
                                    console.log("Keep-Alive Event:", event.data);

                                });

                                eventSource.addEventListener("data", (event) => {
                                    try {
                                        const parsedData = JSON.parse(event.data); // Parse the JSON string

                                        console.log("Parsed Data:", parsedData);
                                        console.log("Weather State Before:", weatherOnArrival);

                                        const weatherInfo = `Temperature: ${parsedData.main?.temp}°C, 
                                        Feels like: ${parsedData.main?.feels_like}°C
                                         Description: ${parsedData.weather?.[0]?.description || "N/A"},
                                         Humidity: ${parsedData.main?.humidity}%`;

                                        console.log("Weather Info:", weatherInfo);

                                        setWeatherOnArrival(weatherInfo);
                                        setShowPopup(true);
                                        setTimeout(() => setShowPopup(false), 2000); // Hide after 2 seconds

                                        console.log("Weather State After:", weatherOnArrival);


                                    } catch (error) {
                                        console.error("Error parsing JSON:", error);
                                    }
                                });

                                // Function to fetch weather
                                const fetchWeather = async () => {
                                    try {
                                        const response = await fetch(`http://localhost:8083/fetch-city-weather/${encodeURIComponent(destinationCity)}`);
                                        if (!response.ok) throw new Error(`Failed to fetch weather: ${response.statusText}`);

                                        const weatherData = await response.json();
                                        console.log("Weather Data Fetched:", weatherData);

                                        const updatedWeatherInfo = `Temperature: ${weatherData.main?.temp}°C, 
                                        Feels like: ${weatherData.main?.feels_like}°C,
                                        Description: ${weatherData.weather?.[0]?.description || "N/A"},
                                        Humidity: ${weatherData.main?.humidity}%`;

                                        setWeatherOnArrival(updatedWeatherInfo);
                                    } catch (error) {
                                        console.error("Error fetching weather:", error);
                                    }
                                };

                                // Call fetchWeather immediately
                                fetchWeather();

                                // Start the interval for repeated fetching
                                const fetchWeatherInterval = setInterval(fetchWeather, 10000); // 10 seconds interval

                                // Clean up on unmount
                                return () => {
                                    clearInterval(fetchWeatherInterval);
                                    eventSource.close();
                                };


                            }}

                            onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = "#45a049")
                            }
                            onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = "#4CAF50")
                            }
                            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            Subscribe to Weather News
                        </button>
                    </div>

                )}


                {/* Popup Component */}
                {showPopup && (
                    <div style={popupStyles}>
                        <p>Weather Updated</p>
                    </div>
                )}


            </header>
        </div>
    )



}

