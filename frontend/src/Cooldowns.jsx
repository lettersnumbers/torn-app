import PropTypes from 'prop-types';

const Cooldowns = ({ cooldowns }) => {
    if (!cooldowns) return null;

    // Helper to format seconds into HH:MM:SS
    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const CooldownItem = ({ label, value, icon, colorClass }) => (
        <div className="bg-[#333] border border-[#555] rounded p-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</span>
            </div>
            <span className={`font-mono font-bold ${value > 0 ? colorClass : 'text-gray-600'}`}>
                {formatTime(value)}
            </span>
        </div>
    );

    CooldownItem.propTypes = {
        label: PropTypes.string.isRequired,
        value: PropTypes.number,
        icon: PropTypes.string.isRequired,
        colorClass: PropTypes.string.isRequired
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-4">
            <CooldownItem
                label="Drug"
                value={cooldowns.drug}
                icon="💊"
                colorClass="text-blue-400"
            />
            <CooldownItem
                label="Medical"
                value={cooldowns.medical}
                icon="🏥"
                colorClass="text-green-400"
            />
            <CooldownItem
                label="Booster"
                value={cooldowns.booster}
                icon="⚡"
                colorClass="text-yellow-400"
            />
        </div>
    );
};

Cooldowns.propTypes = {
    cooldowns: PropTypes.shape({
        drug: PropTypes.number,
        medical: PropTypes.number,
        booster: PropTypes.number
    })
};

export default Cooldowns;
