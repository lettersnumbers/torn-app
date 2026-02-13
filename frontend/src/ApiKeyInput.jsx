import { useState } from 'react';

function ApiKeyInput({ onSave }) {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            setError('Please enter a valid API Key.');
            return;
        }
        // Basic validation (length check? Torn keys are usually 16 chars)
        if (trimmedKey.length < 10) {
            setError('Key seems too short. Please check.');
            return;
        }

        onSave(trimmedKey);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="torn-panel max-w-md w-full p-6 space-y-6 relative border border-[#444] shadow-2xl bg-[#222]">

                <h2 className="text-2xl font-bold text-white text-center tracking-widest uppercase border-b border-[#444] pb-4">
                    Authentication
                </h2>

                <div className="space-y-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        To access your Torn data, you need to provide your <strong>API Key</strong>.
                    </p>

                    <div className="bg-[#333] p-3 rounded border-l-4 border-yellow-500">
                        <p className="text-xs text-yellow-100 font-bold">
                            ⚠️ Requires <span className="underline">Limited Access</span> or higher.
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            (Scanning Bazaars requires 'Public' access, but User Stats need 'Limited'.)
                        </p>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">API Key</label>
                        <input
                            type="password"
                            className="w-full bg-black border border-[#444] text-white p-3 rounded focus:border-[#99b3cc] outline-none font-mono tracking-widest"
                            placeholder="Enter your 16-character key..."
                            value={key}
                            onChange={(e) => { setKey(e.target.value); setError(''); }}
                        />
                        {error && <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">{error}</p>}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-[#333] hover:bg-[#444] text-white font-bold uppercase tracking-wider border border-[#555] transition-all"
                    >
                        Connect to Torn
                    </button>
                </div>

                <div className="text-center pt-4 border-t border-[#333]">
                    <p className="text-[10px] text-gray-500">
                        Your key is stored <strong>locally in your browser</strong>.<br />
                        It is never sent to any third-party server, only direct to Torn.
                    </p>
                    <a
                        href="https://www.torn.com/preferences.php#tab=api"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#99b3cc] hover:underline mt-2 inline-block"
                    >
                        Find my API Key &rarr;
                    </a>
                </div>

            </div>
        </div>
    );
}

export default ApiKeyInput;
