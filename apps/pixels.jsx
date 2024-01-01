import React from "react";
import {createRoot} from "react-dom/client";
import classNames from "classnames";
import {Button} from "@josemi-ui/components";
import {renderIcon} from "@josemi-icons/react";

const TOOLS = {
    BRUSH: "brush",
    ERASER: "eraser",
};

const createCanvas = (rows, cols) => {
    const templateElement = document.createElement("template");
    templateElement.innerHTML = templateContent.flat().join("").trim();
    return templateElement.content.firstChild;
};

export const create = (parent, options = {}) => {
    const listeners = {};
    const rows = options?.height ?? 32;
    const cols = options?.width ?? 32;
    let color = options?.color ?? TRANSPARENT;
    let changeThrottle = -1;
    // Create editor canvas
    const canvas = createCanvas(rows, cols);
    if (parent) {
        parent.appendChild(canvas);
    }
    const callOnChange = () => {
        if (typeof listeners.onChange === "function") {
            clearTimeout(changeThrottle);
            changeThrottle = setTimeout(listeners.onChange, 500);
        }
    };
    const getPixel = (row, col) => {
        return canvas.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    };
    const setPixelColor = (row, col) => {
        const el = getPixel(row, col);
        if (el && color === TRANSPARENT) {
            delete el.dataset.color;
            el.style.backgroundColor = TRANSPARENT;
        }
        else if (el) {
            el.dataset.color = color;
            el.style.backgroundColor = color;
        }
    };
    canvas.addEventListener("pointerdown", event => {
        const size = canvas.getBoundingClientRect();
        const handlePointerMove = e => {
            e.preventDefault();
            const row = Math.floor(rows * (e.clientY - size.top) / size.height);
            const col = Math.floor(cols * (e.clientX - size.left) / size.width);
            setPixelColor(row, col);
        };
        const handlePointerUp = () => {
            canvas.removeEventListener("pointermove", handlePointerMove);
            canvas.removeEventListener("pointerup", handlePointerUp);
            callOnChange();
        };
        canvas.addEventListener("pointermove", handlePointerMove);
        canvas.addEventListener("pointerup", handlePointerUp);
        // Set current pixel color
        handlePointerMove(event);
    });
    // Restore pixels
    // TODO
    // Initialize grid
    if (options?.grid) {
        canvas.dataset.showgrid = "true";
    }
    // Return public api
    return {
        target: canvas,
        rows: rows,
        cols: cols,
        setColor: newColor => color = newColor,
        getColor: () => color,
        toggleGrid: () => {
            canvas.dataset.showgrid = canvas.dataset.showgrid === "true" ? "false" : "true";
        },
        isGridVisible: () => canvas.dataset.showgrid === "true",
        onChange: listener => listeners["change"] = listener,
    };
};


// Canvas component
const Canvas = props => {

    const canvasStyle = {
        aspectRatio: `${props.rows} / ${props.cols}`,
        gridTemplateColumns: `repeat(${props.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${props.rows}, minmax(0, 1fr))`,
    };
    return (
        <div className="pixlab" style={{canvasStyle}}>
            {Array.from({length: props.rows * props.cols}, (x, index) => {
                const i = Math.floor(index / props.cols);
                const j = index % props.cols;
                return (
                    <div data-row={i} data-col={j} className="pixlab-pixel" />
                );
            })}
        </div>
    );
};

// Tool button
const ToolButton = props => {
    const buttonClass = classNames({
        "flex items-center p-2 rounded-md border-0": true,
        "": props.active,
        "cursor-pointer": !props.active,
    });
    return (
        <button className={buttonClass} onClick={props.onClick}>
            {renderIcon(props.icon)}
        </button>
    );
};

// Pixels editor
const PixelsEditor = props => {
    const canvas = React.useRef(null);
    const [activeTool, setActiveTool] = React.useState(TOOLS.BRUSH);
    return (
        <div className="fixed w-full h-screen z-10 top-0 left-0 bg-neutral-950">
            <div className="flex flex-col flex-nowrap h-full">
                <div className="h-20 flex items-center justify-center">
                    <div className="rounded-lg border border-neutral-700 flex items-center gap-1 p-1">
                        <ToolButton
                            icon="pen"
                            active={activeTool === TOOLS.BRUSH}
                            onClick={() => setActiveTool(TOOLS.BRUSH)}
                        />
                        <ToolButton
                            icon="erase"
                            active={activeTool === TOOLS.ERASER}
                            onClick={() => setActiveTool(TOOLS.ERASER)}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center w-full">
                    <div
                        ref={canvas}
                        className="bg-white text-neutral-700 max-w-lg w-full"
                    />
                </div>
            </div>
        </div>
    );
};

// Pixels app
const PixelsApp = () => {
    return (
        <div></div>
    );
};

// Mount pixels app
createRoot(document.getElementById("root")).render(
    <div className="w-full max-w-6xl mx-auto px-6 py-4">
        <PixelsApp />
    </div>
);
