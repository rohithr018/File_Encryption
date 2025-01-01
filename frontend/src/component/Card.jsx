import React, { useState } from "react";
import EncryptionCard from "./EncryptionCard";
import DecryptionCard from "./DecryptionCard";

const Card = ({ content, footer }) => {
    const [isEncrypting, setIsEncrypting] = useState(true);

    const toggleAction = () => {
        setIsEncrypting(!isEncrypting);
    };

    return (
        <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                        {isEncrypting ? "Encrypt" : "Decrypt"}
                    </span>
                    <label htmlFor="toggle" className="relative inline-block w-12 h-6">
                        <input
                            type="checkbox"
                            id="toggle"
                            className="opacity-0 w-0 h-0"
                            checked={isEncrypting}
                            onChange={toggleAction}
                        />
                        <span className="slider round bg-gray-300 dark:bg-gray-700"></span>
                    </label>
                </div>

                {isEncrypting ? (
                    <EncryptionCard content={content} footer={footer} />
                ) : (
                    <DecryptionCard content={content} footer={footer} />
                )}
            </div>
        </div>
    );
};

export default Card;
