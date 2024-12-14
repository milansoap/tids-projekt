import React, { useState } from 'react';
import './App.css';
import InputDestination from "./Components/InputDestination";

function App() {
    const [responseData, setResponseData] = useState(null);

    const handleResponse = (data) => {
        setResponseData(data);
    };

    {console.log(responseData)}

    return (

        <div>
            {!responseData ? (
                <InputDestination onResponse={handleResponse} />
            ) : (
                <div>
                    <h2>Travel Details</h2>
                    <p><strong>Distance:</strong> {responseData.distance}</p>
                    <p><strong>Duration:</strong> {responseData.duration}</p>
                    <h3>Countries Traversed:</h3>
                    <ul>
                        {responseData.countries.map((country, index) => (
                            <li key={index}>{country}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
