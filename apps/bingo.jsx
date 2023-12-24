import React from "react";
import {createRoot} from "react-dom/client";
import classNames from "classnames";
import {Button} from "@josemi-ui/components";
import {PartyHornIcon, PauseIcon, PlayIcon} from "@josemi-icons/react";

import {SoundProvider} from "../contexts/SoundContext.jsx";
import {useComplexState} from "../hooks/useComplexState.js";

const CARD_MAX_NUMBERS = 27;
const CARD_ROWS = 3;
const CARD_COLS = 9;
const EXTRACT_INTERVAL_SLOW = 7500;
const EXTRACT_INTERVAL_FAST = 5000;

// Generate an array with the privided number of items
const range = length => {
    return Array.from({length}, (x, index) => index + 1);
};

// Shuffle the provided array
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

const getCardNumbers = () => {
    const numbers = Array.from({length: CARD_COLS}, (x, i) => i).map(col => {
        const availableNumbers = Array.from({length: 10}, (x, i) => i)
            .map(x => x + (10 * col))
            .filter(x => x > 0);
        return shuffleArray(availableNumbers)
    });
    // We need to select only 15 numbers
    return shuffleArray([1, 1, 3, 2, 1, 2, 2, 2, 1])
        .map((total, index) => {
            const indexesToInclude = shuffleArray([0, 1, 2]).slice(0, total);
            return numbers[index].slice(0, 3)
                .sort()
                .map((n, i) => indexesToInclude.includes(i) ? n : 0);
        })
        .flat();
};

// Counter
const Counter = props => {
    const [count, setCount] = React.useState(props.initialSeconds);
    React.useEffect(() => {
        const reduceCount = () => {
            if (count > 0) {
                return setCount(prevCount => prevCount - 1);
            }
            // Call the count finished
            return props.onCounterEnd();
        };
        const timer = setTimeout(reduceCount, 1000);
        return () => clearTimeout(timer);
    }, [count]);
    const minutes = Math.floor(count / 60).toString().padStart(2, "0");
    const seconds = Math.floor(count % 60).toString().padStart(2, "0");
    return (
        <div className="w-full flex flex-col items-center">
            <div className="text-neutral-600 leading-none text-sm mb-1">
                <span>Game starts in</span>
            </div>
            <div className="w-full text-center text-neutral-900 text-6xl font-bold leading-none">
                <span>{minutes}:{seconds}</span>
            </div>
        </div>
    );
};

// Ball component
const Ball = ({number}) => (
    <div className="shadow-md bg-white border-neutral-900 border-8 rounded-full w-40 h-40 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-full w-32 h-32 flex flex-col items-center justify-center">
            <span className="text-white text-sm font-bold leading-none mb-1">Bingo</span>
            <span className="text-white text-7xl font-black leading-none">{number}</span>
        </div>
    </div>
);

// Board
const Board = props => {
    const numbers = React.useMemo(() => range(props.maxNumbers), [props.maxNumbers]);
    return (
        <div className="w-full h-64 grid grid-rows-5 grid-flow-col bg-neutral-900 p-3 gap-1 rounded-lg">
            {"BINGO".split("").map(char => (
                <div key={char} className="hidden sm:flex items-center justify-center p-2 bg-white rounded-md text-neutral-700">
                    <strong>{char}</strong>
                </div>
            ))}
            {numbers.map(n => {
                const index = props.calls.indexOf(n);
                const numberClass = classNames({
                    "flex items-center justify-center": true,
                    "text-neutral-700": index > props.currentCall,
                    "animation-pulse": index === props.currentCall,
                    "font-black text-white": index <= props.currentCall,
                });
                return (
                    <div key={n} className={numberClass}>{n}</div>
                );
            })}
        </div>
    );
};

// Single card
const Card = props => {
    const cardNumbers = React.useMemo(() => getCardNumbers(), [true]);
    const markedCount = cardNumbers.filter(n => props.extractedNumbers.has(n)).length;
    const totalCount = cardNumbers.filter(n => n > 0).length;
    return (
        <div className="w-full p-4 rounded-lg bg-neutral-800">
            <div className="w-full flex justify-between items-center text-white pb-4">
                <div>Card <b>#{props.index}</b></div>
                <div className="text-neutral-400 text-sm">{markedCount}/{totalCount}</div>
            </div>
            <div className="grid w-full grid-cols-9 grid-rows-3 grid-flow-col gap-2">
                {cardNumbers.map((number, index) => {
                    const isExtracted = props.extractedNumbers.has(number);
                    const numberClass = classNames({
                        "py-2 w-full text-sm text-center rounded-md": true,
                        "bg-white font-bold": number > 0 && isExtracted,
                        "bg-neutral-600 text-white": number > 0 && !isExtracted,
                        "bg-neutral-700": number === 0,
                    });
                    return (
                        <div key={`${index}-${number}`} className={numberClass}>
                            {number > 0 ? number : ""}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Toggle components
const Toggle = props => (
    <div className="w-full flex items-center p-1 bg-neutral-100 rounded-lg">
        {props.items.map(item => {
            const itemClass = classNames({
                "flex justify-center p-2 w-full text-center text-sm rounded-md": true,
                "bg-neutral-900 text-white font-bold": props.value === item.value,
            });
            const handleChange = () => props.onChange(item.value);
            return (
                <div key={item.value} className={itemClass} onClick={handleChange}>
                    <span>{item.title}</span>
                </div>
            );
        })}
    </div>
);

// Bingo game screen
const BingoGameScreen = props => {
    const [state, setState] = useComplexState({
        key: Date.now(),
        gameStarted: false,
        gameFinished: false,
        gamePaused: false,
        delay: props.delay,
        calls: [],
        currentCall: -1,
        extractInterval: EXTRACT_INTERVAL_SLOW,
        cards: 2,
    });
    const extractedNumbers = new Set(state.calls.slice(0, state.currentCall + 1));
    React.useEffect(() => {
        if (state.gameStarted && !state.gamePaused && !state.gameFinished) {
            const extractNextBall = () => {
                const hasFinishedGame = !(state.currentCall + 1 < props.maxNumbers);
                const callIncrement = hasFinishedGame ? 0 : 1;
                return setState({
                    gameStarted: !hasFinishedGame,
                    currentCall: state.currentCall + callIncrement,
                })
            };
            const timer = setTimeout(extractNextBall, state.extractInterval);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [state.gameStarted, state.gamePaused, state.currentCall, state.extractInterval]);
    // Handle toggle game pause
    const handleTogglePause = () => {
        if (state.gameStarted && !state.gameFinished) {
            return setState({gamePaused: !state.gamePaused});
        }
    };
    const actionsClass = classNames({
        "flex flex-col gap-2 mt-4": true,
        "pointer-events-none o-50": !state.gameStarted,
    });
    return (
        <div className="w-full sm:flex gap-4 mb-4">
            <div className="w-full sm:w-72">
                <div className="h-64 flex justify-center items-center rounded-lg bg-neutral-100 mb-4">
                    {!state.gameStarted && (
                        <Counter
                            initialSeconds={10}
                            onCounterEnd={() => {
                                return setState({
                                    key: Date.now(),
                                    gameStarted: true,
                                    gamePaused: false,
                                    gameFinished: false,
                                    calls: shuffleArray(range(props.maxNumbers)),
                                    currentCall: 0,
                                });
                            }}
                        />
                    )}
                    {state.gameStarted && state.currentCall > -1 && (
                        <div>
                            <div className="flex items-center justify-center h-40">
                                <Ball number={state.calls[state.currentCall]} />
                            </div>
                            <div className="text-sm text-neutral-800 font-medium text-center mt-3">
                                <span>Ball {state.currentCall + 1} / {props.maxNumbers}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <div className="text-xs text-neutral-500 text-center mb-2 leading-none">
                        <span>Extract speed:</span>
                    </div>
                    <Toggle
                        value={state.extractInterval}
                        items={[
                            {value: EXTRACT_INTERVAL_SLOW, title: "Slow"},
                            {value: EXTRACT_INTERVAL_FAST, title: "Fast"},
                        ]}
                        onChange={newInterval => {
                            setState({extractInterval: newInterval});
                        }}
                    />
                    <div className={actionsClass}>
                        <Button className="w-full" onClick={handleTogglePause}>
                            <div className="flex items-center text-2xl">
                                <PartyHornIcon />
                            </div>
                            <strong className="flex items-center text-xl">
                                <span>Bingo!</span>
                            </strong>
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={handleTogglePause}>
                            <div className="flex items-center text-lg">
                                {state.gamePaused ? <PlayIcon /> : <PauseIcon />}
                            </div>
                            <strong className="flex items-center">
                                {state.gamePaused ? "Resume Game" : "Pause Game"}
                            </strong>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="w-full">
                <div className="hidden sm:block w-full">
                    <Board
                        key={state.key}
                        maxNumbers={props.maxNumbers}
                        calls={state.calls}
                        currentCall={state.currentCall}
                    />
                </div>
                <div className="w-full mt-4">
                    <div className="text-neutral-900 text-2xl font-black mb-2">Your tickets</div>
                    <div className="grid grid-cols-2 gap-4">
                        {range(state.cards).map(cardIndex => (
                            <Card
                                key={"card:" + cardIndex}
                                index={cardIndex}
                                extractedNumbers={extractedNumbers}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

BingoGameScreen.defaultProps = {
    delay: 5000,
    maxNumbers: 90,
};

const BingoApp = () => {
    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-4">
            <BingoGameScreen />
        </div>
    );
};

// Mount bingo app
createRoot(document.getElementById("root")).render(
    <SoundProvider>
        <BingoApp />
    </SoundProvider>
);
