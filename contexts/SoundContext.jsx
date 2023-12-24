import React from "react";
import {VolumeSlashIcon, VolumeUpIcon} from "@josemi-icons/react";

// Sound context to save is sound is enabled
const SoundContext = React.createContext(false);

// Use sound hook
export const useSound = () => {
    const soundEnabled = React.useContext(SoundContext);
    return {
        enabled: soundEnabled,
    }
};

// Sound provider
export const SoundProvider = props => {
    const [soundEnabled, setSoundEnabled] = React.useState(false);
    const handleToggle = () => {
        return setSoundEnabled(s => !s);
    };
    return (
        <SoundContext.Provider value={soundEnabled}>
            {props.children}
            <div className="flex fixed bottom-0 right-0 mb-4 mr-4" onClick={handleToggle}>
                <div className="border border-neutral-200 shadow-sm flex items-center rounded-full p-3 bg-white text-neutral-900 text-2xl">
                    {soundEnabled ? <VolumeUpIcon /> : <VolumeSlashIcon />}
                </div>
            </div>
        </SoundContext.Provider>
    );
};
