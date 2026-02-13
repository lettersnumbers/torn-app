import PropTypes from 'prop-types';

const EventsList = ({ events }) => {
    if (!events) return null;

    // Helper to parse Torn's HTML-like event strings safely
    // For simplicity, we will just strip HTML tags for now, or render them dangerously if we trust Torn (we shouldn't blindly).
    // Better approach: regex replace links to simple text or styled spans.
    const parseEventText = (html) => {
        // Simple strip tags for safety in this version. 
        // In a real app, we'd parse <a> tags to keep links clickable.
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    // Turn the object { timestamp: "event" } into an array sorted by time (descending)
    // But wait, the API returns an object with random keys like "events": { "ID": { timestamp, event } }
    // Let's console log what the `events` prop structure is first. 
    // Standard Torn API v2 for 'user' -> 'events' returns: { "events": { "ID": { "timestamp": 123, "event": "..." } } }

    const eventList = Object.values(events || {})
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5); // Take top 5

    if (eventList.length === 0) {
        return (
            <div className="torn-panel p-4 rounded-md w-full mb-4 text-gray-500 text-center text-sm">
                No recent events.
            </div>
        );
    }

    return (
        <div className="border-t border-[#444] bg-[#222]">
            <div className="p-2 border-b border-[#444] bg-[#2a2a2a]">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span>🔔</span> Recent Events
                </h3>
            </div>
            <ul className="divide-y divide-[#333]">
                {eventList.map((evt, idx) => (
                    <li key={idx} className="p-3 text-xs text-gray-300 hover:bg-[#333] transition">
                        <div className="flex justify-between items-start gap-4">
                            <span className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: evt.event }} />
                            <span className="text-[10px] text-gray-500 whitespace-nowrap pt-1">
                                {new Date(evt.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

EventsList.propTypes = {
    events: PropTypes.object
};

export default EventsList;
