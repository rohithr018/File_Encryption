import React from "react";
import Card from "./component/Card";

function App() {
    let title = "File Encryption Techniques";
    return (
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
            <header className="text-center">
                <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-6">
                    {title}
                </h2>
                <Card
                    content="This is a simple card component in React using Tailwind CSS."
                    footer="Card Footer Content"
                />
            </header>
        </div>
    );
}

export default App;
