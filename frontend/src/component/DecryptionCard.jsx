import React, { useState } from "react";

const DecryptionCard = () => {
    const [encryptedFile, setEncryptedFile] = useState(null);
    const [selectedTechnique, setSelectedTechnique] = useState("");
    const [encryptedContent, setEncryptedContent] = useState(null);
    const [aesKey, setAesKey] = useState("");  // For AES Key
    const [privateKey, setPrivateKey] = useState("");  // For RSA Private Key
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nonce, setNonce] = useState("");
    const [tag, setTag] = useState("");

    // Handle Encrypted File Upload
    const handleEncryptedFileUpload = (e) => {
        const file = e.target.files[0];
        setEncryptedFile(file);

        if (file && file.name.endsWith('.enc')) {
            const reader = new FileReader();
            reader.onload = () => setEncryptedContent(reader.result);
            reader.onerror = () => setError("Failed to read the file.");
            reader.readAsText(file);
        } else {
            setError("Please upload a .enc file");
        }
    };

    // Handle AES Key Upload
    const handleAesKeyUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const keyPairs = {};
                content.split('\n').forEach((line) => {
                    const [key, value] = line.split(':');
                    if (key && value) {
                        keyPairs[key.trim()] = value.trim();
                    }
                });

                const aesKey = keyPairs['encryption_key'];
                const nonce = keyPairs['nonce'];
                const tag = keyPairs['tag'];

                if (aesKey && nonce && tag) {
                    setAesKey(aesKey);
                    setNonce(nonce);
                    setTag(tag)
                    setError(null);
                } else {
                    setError("The AES key, nonce, or tag was not found in the provided file.");
                }
            };
            reader.onerror = () => setError("Failed to read the AES key file.");
            reader.readAsText(file);
        } else {
            setError("Please upload a valid .txt file for the AES key.");
        }
    };

    // Handle Private Key Upload for RSA
    const handlePrivateKeyUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !file.name.endsWith('.pem')) {
            setError("Please upload a valid .pem file for the private key.");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const content = event.target.result;

            // Split the content by newlines and find the key part
            const lines = content.split('\n');

            // Check for proper headers and footers
            const beginMarker = "-----BEGIN RSA PRIVATE KEY-----";
            const endMarker = "-----END RSA PRIVATE KEY-----";

            if (lines[0] === beginMarker && lines[lines.length - 1] === endMarker) {
                // Extract the base64 key part (ignoring the first and last lines)
                const base64Key = lines.slice(1, lines.length - 1).join('');

                // Validate that the key seems like a base64 string
                if (/^[A-Za-z0-9+/=]+$/.test(base64Key)) {
                    setPrivateKey(base64Key);  // Store the base64 key
                    setError(null);  // Clear any previous errors
                } else {
                    setError("The uploaded file does not appear to be a valid private key.");
                }
            } else {
                setError("The uploaded file does not appear to be a valid private key.");
            }
        };

        reader.onerror = () => {
            setError("Failed to read the private key file.");
        };

        reader.readAsText(file);
    };

    // Handle Decryption
    const handleDecryption = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate input fields
            if (!encryptedContent) {
                setError("Please upload an encrypted file.");
                return;
            }

            if (!selectedTechnique) {
                setError("Please select a decryption technique.");
                return;
            }

            if (selectedTechnique === "AES" && (!aesKey || !nonce || !tag)) {
                setError("Please upload a valid AES key file with encryption_key, nonce, and tag.");
                return;
            }

            if (selectedTechnique === "RSA" && !privateKey) {
                setError("Please upload a valid RSA private key.");
                return;
            }

            // Prepare the payload
            const payload = {
                encrypted_content: encryptedContent,
                selected_technique: selectedTechnique,
                encryption_key: selectedTechnique === "AES" ? aesKey : undefined,
                private_key: selectedTechnique === "RSA" ? privateKey : undefined,
                nonce: selectedTechnique === "AES" ? nonce : undefined,
                tag: selectedTechnique === "AES" ? tag : undefined,
            };

            // Make the API request for decryption
            const response = await fetch('http://127.0.0.1:5000/decrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            // Handle errors from the API response
            if (!response.ok) throw new Error(data.error || "Failed to decrypt the content.");

            // Set the decrypted content
            setDecryptedContent(data.decrypted_content);

            // Clear form inputs after decryption
            setEncryptedFile(null);
            setEncryptedContent(null);
            setSelectedTechnique("");
            setAesKey("");
            setPrivateKey("");
            setNonce("");
            setTag("");
        } catch (err) {
            setError(err.message || "An error occurred during decryption.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-300">
            <div className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Decryption</p>

                {/* File Upload */}
                <input
                    type="file"
                    accept=".enc"
                    onChange={handleEncryptedFileUpload}
                    className="file:bg-green-500 file:text-white file:rounded-md file:px-4 file:py-2 file:mr-4"
                />

                {encryptedContent && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-48">
                        <h3 className="text-lg font-semibold">Encrypted Content:</h3>
                        <pre className="text-sm whitespace-pre-wrap">{encryptedContent}</pre>
                    </div>
                )}

                {/* Choose Decryption Technique */}
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Choose Decryption Technique</label>
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

                {/* AES Key Upload */}
                {selectedTechnique === 'AES' && (
                    <div className="mt-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Upload AES Key</label>
                        <input
                            type="file"
                            accept=".txt"
                            onChange={handleAesKeyUpload}
                            className="file:bg-blue-500 file:text-white file:rounded-md file:px-4 file:py-2 file:mr-4"
                        />
                    </div>
                )}

                {/* Private Key Upload for RSA */}
                {selectedTechnique === 'RSA' && (
                    <div className="mt-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">Upload RSA Private Key</label>
                        <input
                            type="file"
                            accept=".pem"
                            onChange={handlePrivateKeyUpload}
                            className="file:bg-blue-500 file:text-white file:rounded-md file:px-4 file:py-2 file:mr-4"
                        />
                    </div>
                )}

                <button
                    onClick={handleDecryption}
                    disabled={!encryptedContent || (!aesKey && selectedTechnique === "AES") || (!privateKey && selectedTechnique === "RSA") || !selectedTechnique || loading}
                    className="w-full bg-green-500 text-white py-2 rounded-md disabled:opacity-50"
                >
                    {loading ? "Decrypting..." : "Decrypt"}
                </button>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4">
                        {error}
                    </div>
                )}

                {decryptedContent && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mt-4">
                        <p>Decryption successful!</p>
                        <textarea
                            value={decryptedContent}
                            readOnly
                            className="w-full h-48 mt-4 p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                        ></textarea>
                        <a
                            href={`data:text/plain;charset=utf-8,${encodeURIComponent(decryptedContent)}`}
                            download="decrypted_content.txt"
                            className="text-blue-500 underline mt-2 block"
                        >
                            Download Decrypted Content
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DecryptionCard;
