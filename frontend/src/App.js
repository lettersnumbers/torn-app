import React, { useState, useEffect } from 'react';

function App() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load items from our Python backend on startup
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error("Error connecting to backend:", err));
  }, []);

  // Filter items for the dropdown
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Item Selection
  const handleSelect = (item) => {
    setSearchTerm(item.name);
    setSelectedItem(item);
    setShowDropdown(false);
    fetchPrices(item.id);
  };

  // Fetch Live Prices
  const fetchPrices = (id) => {
    setLoading(true);
    setListings([]); // Clear old results
    
    fetch(`http://127.0.0.1:5000/api/scan/${id}`)
      .then(res => res.json())
      .then(data => {
        setListings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#ccc] flex flex-col items-center pt-10 font-sans">
      
      {/* --- MAIN CONTAINER --- */}
      <div className="w-[600px] bg-white border border-gray-500 shadow-xl">
        
        {/* HEADER */}
        <div className="bg-gradient-to-b from-[#666] to-[#333] text-white p-3 font-bold border-b border-black flex justify-between items-center">
          <span>MARKET SCANNER</span>
          <span className="text-xs text-gray-300">API STATUS: ONLINE</span>
        </div>

        {/* CONTENT AREA */}
        <div className="p-5 bg-[#F2F2F2]">
          
          {/* SEARCH BAR */}
          <div className="relative mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-1">SEARCH ITEM</label>
            <input 
              type="text"
              className="w-full p-2 border border-gray-400 rounded shadow-inner focus:outline-none focus:border-blue-500"
              placeholder="e.g. Xanax"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {/* DROPDOWN MENU */}
            {showDropdown && searchTerm && (
              <ul className="absolute z-10 w-full bg-white border border-gray-400 max-h-48 overflow-y-auto shadow-lg mt-1">
                {filteredItems.slice(0, 50).map(item => (
                  <li 
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="p-2 text-sm cursor-pointer hover:bg-blue-100 border-b border-gray-100 text-gray-800"
                  >
                    {item.name}
                  </li>
                ))}
                {filteredItems.length === 0 && (
                  <li className="p-2 text-sm text-gray-500">No items found.</li>
                )}
              </ul>
            )}
          </div>

          {/* RESULTS TABLE */}
          {selectedItem && (
            <div className="border border-gray-400 bg-white">
              <div className="bg-[#ddd] p-2 font-bold text-sm border-b border-gray-400 text-gray-700">
                LOWEST PRICES: {selectedItem.name}
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500 italic">Scanning Bazaar & Item Market...</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left text-gray-600">
                      <th className="p-2 border-b">Source</th>
                      <th className="p-2 border-b">Price</th>
                      <th className="p-2 border-b text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((deal, idx) => (
                      <tr key={idx} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="p-2 font-medium text-gray-700">{deal.source}</td>
                        <td className="p-2 font-bold text-green-700">${deal.price.toLocaleString()}</td>
                        <td className="p-2 text-right text-gray-600">{deal.qty.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;