import { useState, useEffect } from 'react';
import ItemScanner from './ItemScanner';
import Cooldowns from './Cooldowns';
import EventsList from './EventsList';
import { fetchUser, fetchFaction } from './api';
import './index.css';

function App() {
  const [userData, setUserData] = useState(null);
  const [factionData, setFactionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser()
      .then(data => {
        setUserData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetchFaction()
      .then(setFactionData)
      .catch(console.error);

  }, []);

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';
    if (status.state === 'Okay') return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    if (status.state === 'Idle') return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center w-full"> {/* Ensure full width center */}

      {/* HEADER BANNER */}
      <h1 className="text-4xl font-extrabold mb-8 text-white tracking-widest uppercase border-b-2 border-[#444] pb-4 w-full max-w-5xl text-center">
        Torn <span className="text-[#99b3cc]">Terminal</span>
      </h1>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: User Stats & Info */}
        <div className="lg:col-span-1 space-y-6">

          {/* USER PANEL */}
          <div className="torn-panel rounded-md overflow-hidden">
            {loading && <p className="text-gray-400 p-4 text-center">Loading User Profile...</p>}

            {userData && (
              <>
                {/* NAME & STATUS */}
                <div className="bg-[#222] p-4 border-b border-[#444] flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(userData.status)}`} title={userData.status?.description}></div>
                      <h2 className="text-lg font-bold text-white tracking-wide">
                        <a href={`https://www.torn.com/profiles.php?XID=${userData.player_id}`} target="_blank" rel="noreferrer" className="hover:underline torn-text-blue">
                          {userData.name}
                        </a>
                      </h2>
                    </div>
                    <span className="text-gray-500 text-xs font-mono">[{userData.player_id}]</span>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <span className="bg-[#333] px-2 py-0.5 rounded border border-[#444]">Lvl {userData.level}</span>
                    <span className="bg-[#333] px-2 py-0.5 rounded border border-[#444] text-[#99b3cc]">{userData.rank}</span>
                  </div>
                </div>

                {/* BARS COMPACT */}
                <div className="p-4 space-y-3 bg-[#2a2a2a]">
                  {[
                    { label: "Life", cur: userData.life?.current, max: userData.life?.maximum, type: "bar-life" },
                    { label: "Energy", cur: userData.energy?.current, max: userData.energy?.maximum, type: "bar-energy" },
                    { label: "Nerve", cur: userData.nerve?.current, max: userData.nerve?.maximum, type: "bar-nerve" },
                    { label: "Happy", cur: userData.happy?.current, max: userData.happy?.maximum, type: "bar-happy" }
                  ].map((stat, idx) => (
                    <div key={idx} className="w-full">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">
                        <span>{stat.label}</span>
                        <span className="text-white">{stat.cur}/{stat.max}</span>
                      </div>
                      <div className="bar-container h-3">
                        <div
                          className={`bar-fill ${stat.type}`}
                          style={{ width: `${Math.min((stat.cur / stat.max) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COOLDOWNS */}
                {userData.cooldowns && (
                  <div className="p-4 border-t border-[#444] bg-[#222]">
                    <h3 className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-widest">Active Cooldowns</h3>
                    <Cooldowns cooldowns={userData.cooldowns} />
                  </div>
                )}

                {/* EVENTS LIST (Embedded) */}
                {userData?.events && (
                  <EventsList events={userData.events} />
                )}
              </>
            )}
          </div>

          {/* FACTION PANEL */}
          {factionData && factionData.name && (
            <div className="torn-panel p-4 rounded-md bg-[#2a2a2a] border border-[#444]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Faction</p>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="bg-black text-white text-[10px] px-1 border border-gray-600">{factionData.tag}</span>
                    <span className="torn-text-blue">{factionData.name}</span>
                  </h3>
                </div>
                {factionData.chain && factionData.chain.current > 0 && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#e3d868]">⛓ {factionData.chain.current}</div>
                    <p className="text-[10px] text-gray-400">{factionData.chain.timeout}s</p>
                  </div>
                )}
              </div>
            </div>
          )}



        </div>

        {/* RIGHT COLUMN: Tool Area */}
        <div className="lg:col-span-2">
          <ItemScanner userMoney={userData ? userData.money_onhand : 0} />
        </div>

      </div>
    </div>
  );
}

export default App;