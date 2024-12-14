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
                    <h2>Data Received</h2>
                    <p><strong>Distance:</strong> {responseData.distance}</p>
                    <p><strong>Duration:</strong> {responseData.duration}</p>
                </div>
            )}
        </div>
    );
}
export default App;
