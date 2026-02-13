import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchItems, scanLowest, scanShops } from './api';

// Accept userMoney as a prop
export default function ItemScanner({ userMoney }) {
  const [items, setItems] = useState([]);           // Full list of items
  const [searchTerm, setSearchTerm] = useState(''); // What you type
  const [filteredItems, setFilteredItems] = useState([]); // Matching items
  const [selectedItem, setSelectedItem] = useState(null); // The item you clicked
  const [marketListings, setMarketListings] = useState(null); // Results from scan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Item Database
  useEffect(() => {
    fetchItems()
      .then(data => {
        setItems(data);
        setFilteredItems([]);
      })
      .catch(err => console.error("Failed to load item DB", err));
  }, []);

  // 2. Filter list on typing
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredItems([]);
    } else {
      const results = items.filter(item =>
        item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(results.slice(0, 10));
    }
  }, [searchTerm, items]);

  // 3. Handle Scan
  const handleScan = (mode) => {
    if (!selectedItem) return;

    setLoading(true);
    setMarketListings(null);

    const scanPromise = mode === 'lowest'
      ? scanLowest(selectedItem.id)
      : scanShops(selectedItem.id);

    scanPromise
      .then(data => {
        setMarketListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Scan failed:", err);
        setMarketListings([]);
        setLoading(false);
        setError("Scan failed. Please check backend connection and try again.");
      });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 w-full max-w-4xl mt-8">

      {/* HEADER: Title, Wallet, Icon */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-blue-400">Market Scanner</h2>

        <div className="flex items-center gap-4">
          {/* Wallet Balance */}
          <div className="text-right mr-4">
            <p className="text-xs text-gray-500 uppercase font-bold">Your Wallet</p>
            <p className="text-green-400 font-mono font-bold text-lg">
              ${userMoney ? userMoney.toLocaleString() : '0'}
            </p>
          </div>

          {/* ITEM ICON (Only shows if selected) */}
          {selectedItem && selectedItem.id && (
            <div className="flex items-center gap-3 bg-gray-900 p-2 rounded border border-gray-600">
              <span className="text-gray-300 font-bold text-sm">{selectedItem.name}</span>
              <img
                src={`https://www.torn.com/images/items/${selectedItem.id}/medium.png`}
                alt={selectedItem.name}
                className="w-10 h-10 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-6 flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-sm font-bold underline hover:text-white">Dismiss</button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <label className="block text-sm text-gray-400 mb-1">Search for an Item</label>

        <div className="flex gap-2">
          <input
            type="text"
            className="w-full p-3 rounded bg-gray-900 border border-gray-600 focus:border-blue-500 outline-none text-white"
            placeholder="e.g. Xanax, Donator Pack..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value) setSelectedItem(null);
            }}
          />

          <button
            onClick={() => handleScan('lowest')}
            disabled={!selectedItem || loading}
            className={`px-4 py-2 rounded font-bold transition whitespace-nowrap ${!selectedItem ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
              }`}
          >
            {loading ? '...' : 'SCAN'}
          </button>

          <button
            onClick={() => handleScan('shops')}
            disabled={!selectedItem || loading}
            className={`px-4 py-2 rounded font-bold transition whitespace-nowrap ${!selectedItem ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'
              }`}
          >
            {loading ? '...' : 'BAZAARS'}
          </button>
        </div>

        {/* AUTOCOMPLETE DROPDOWN */}
        {filteredItems.length > 0 && !selectedItem && (
          <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded mt-1 shadow-xl max-h-60 overflow-auto">
            {filteredItems.map(item => (
              <li
                key={item.id}
                className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-0"
                onClick={() => {
                  setSelectedItem(item);
                  setSearchTerm(item.name);
                  setFilteredItems([]);
                }}
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* RESULTS TABLE */}
      {Array.isArray(marketListings) && marketListings.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-600 mt-4">
          <table className="w-full text-left bg-gray-900">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-3">Source</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right text-gray-500">Avg Price</th>
                <th className="p-3 text-right">Profit</th>
                <th className="p-3 text-right">Afford</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {marketListings.map((listing, idx) => {

                // CALCULATIONS
                const profit = listing.market_value > 0 ? (listing.market_value - listing.price) : 0;
                const affordQty = userMoney ? Math.floor(userMoney / listing.price) : 0;
                const isProfit = profit > 0;

                return (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800 transition">

                    {/* Source */}
                    <td className="p-3 text-blue-300 font-medium">
                      {listing.source}
                      <div className="text-xs text-gray-500">Qty: {listing.qty.toLocaleString()}</div>
                    </td>

                    {/* Price */}
                    <td className="p-3 text-right font-mono text-white font-bold">
                      ${listing.price.toLocaleString()}
                    </td>

                    {/* Avg Price */}
                    <td className="p-3 text-right font-mono text-gray-500">
                      {listing.market_value > 0 ? `$${listing.market_value.toLocaleString()}` : '-'}
                    </td>

                    {/* Profit */}
                    <td className={`p-3 text-right font-mono font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                      {profit !== 0 ? (isProfit ? '+' : '') + profit.toLocaleString() : '-'}
                    </td>

                    {/* Afford */}
                    <td className="p-3 text-right font-mono text-yellow-500">
                      {affordQty > 0 ? affordQty.toLocaleString() : '0'}
                    </td>

                    {/* Button */}
                    <td className="p-2 text-center">
                      {listing.link ? (
                        <a
                          href={listing.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1 rounded text-white text-xs font-bold tracking-wider shadow-sm transition transform hover:scale-105"
                          style={{
                            background: 'linear-gradient(to bottom, #86c05d 0%, #6da642 100%)',
                            border: '1px solid #4a8222',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}
                        >
                          BUY
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : marketListings && (
        <p className="text-gray-400 mt-4 italic text-center">No listings found for this item.</p>
      )}
    </div>
  );
}

ItemScanner.propTypes = {
  userMoney: PropTypes.number
};