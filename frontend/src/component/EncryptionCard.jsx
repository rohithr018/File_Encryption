import React, { useState } from "react";

const EncryptionCard = () => {
    const [file, setFile] = useState(null);
    const [selectedTechnique, setSelectedTechnique] = useState("");
    const [fileContent, setFileContent] = useState(null);
    const [apiResponse, setApiResponse] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadableFiles, setDownloadableFiles] = useState([]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            if (selectedFile.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = () => setFileContent(reader.result);
                reader.onerror = () => setError("Failed to read file content.");
                reader.readAsText(selectedFile);
            } else {
                setError("Only .txt files are supported.");
            }
        }
    };

    const addDownloadableFile = (content, filename) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        setDownloadableFiles((prevFiles) => [...prevFiles, { filename, url }]);
    };

    const handleEncryption = async () => {
        if (!file || !selectedTechnique) {
            setError("Please upload a file and select an encryption technique.");
            return;
        }

        setLoading(true);
        setError(null);
        setApiResponse(null);
        setDownloadableFiles([]);

        try {
            const requestBody = {
                content: fileContent,
                selected_technique: selectedTechnique
            };

            let apiUrl = "http://127.0.0.1:5000/encrypt";
            // let apiUrl = '';
            // if (selectedTechnique === 'AES') {
            // } else if (selectedTechnique === 'RSA') {
            //     apiUrl = "http://127.0.0.1:5000/encrypt-rsa";
            // }

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to encrypt.");

            setApiResponse(data);

            // Add downloadable files based on technique
            if (selectedTechnique === "RSA") {
                addDownloadableFile(data.private_key, "private_key.pem");
                addDownloadableFile(data.public_key, "public_key.pem");
            } else if (selectedTechnique === "AES") {
                const keyFileContent = `
encryption_key: ${data.key}
nonce: ${data.nonce}
tag: ${data.tag}
            `.trim();
                addDownloadableFile(keyFileContent, "keys.txt"); // AES key file
            }

            // Add encrypted content file
            addDownloadableFile(data.encrypted_content, "encrypted_content.enc");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-300">
            <div className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Encryption</p>

                <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="file:bg-blue-500 file:text-white file:rounded-md file:px-4 file:py-2 file:mr-4"
                />

                {fileContent && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-48">
                        <h3 className="text-lg font-semibold">File Content:</h3>
                        <pre className="text-sm whitespace-pre-wrap">{fileContent}</pre>
                    </div>
                )}

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                        Choose Encryption Technique
                    </label>
                    <select
                        value={selectedTechnique}
                        onChange={(e) => setSelectedTechnique(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md"
                    >
                        <option value="">Select a technique</option>
                        <option value="AES">AES</option>
                        <option value="RSA">RSA</option>
                    </select>
                </div>

                <button
                    onClick={handleEncryption}
                    disabled={!file || !selectedTechnique || loading}
                    className="w-full bg-blue-500 text-white py-2 rounded-md disabled:opacity-50"
                >
                    {loading ? "Encrypting..." : "Encrypt"}
                </button>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4">
                        {error}
                    </div>
                )}

                {apiResponse && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-4">
                        Encryption successful! Download your files below:
                        <ul className="mt-2">
                            {downloadableFiles.map((file, index) => (
                                <li key={index}>
                                    <a
                                        href={file.url}
                                        download={file.filename}
                                        className="text-blue-500 underline"
                                    >
                                        {file.filename}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EncryptionCard;
