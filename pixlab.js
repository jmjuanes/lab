// Globals
export const TOOLS = {
    BRUSH: "brush",
    ERASER: "eraser",
};

// Global colors
const TRANSPARENT = "transparent";

const range = size => {
    return Array.from({length: size}, (x, i) => i);
};

const styled = styles => {
    return Object.keys(styles).map(k => `${k}:${styles[k]};`).join("");
};

const getTemplate = (rows, cols) => {
    const canvasStyles = styled({
        "aspect-ratio": `${rows} / ${cols}`,
        "grid-template-columns": `repeat(${cols}, minmax(0, 1fr))`,
        "grid-template-rows": `repeat(${rows}, minmax(0, 1fr))`,
    });
    const templateContent = [
        `<div class="pixlab">`,
        `<div class="pixlab-canvas pixlab-grid" style="${canvasStyles}">`,
        ...range(rows * cols).map(index => {
            const i = Math.floor(index / cols);
            const j = index % cols;
            return `<div data-row="${i}" data-col="${j}" class="pixlab-pixel"></div>`;
        }),
        `</div>`,
        `</div>`,
    ];
    const templateElement = document.createElement("template");
    templateElement.innerHTML = templateContent.flat().join("").trim();
    return templateElement.content.firstChild;
};

export const create = (parent, options = {}) => {
    const listeners = {};
    const rows = options?.height ?? 32;
    const cols = options?.width ?? 32;
    const state = {
        showGrid: options?.showGrid ?? false,
        color: options?.initialColor ?? "red",
        tool: TOOLS.BRUSH,
    };
    parent.appendChild(getTemplate(rows, cols));
    const canvas = parent.querySelector(`.pixlab-canvas`);
    const getPixel = (row, col) => {
        return canvas.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    };
    const setPixelColor = (row, col, color) => {
        const el = getPixel(row, col);
        if (el) {
            if (color === TRANSPARENT || state.tool === TOOLS.ERASER) {
                delete el.dataset.color;
                el.style.backgroundColor = TRANSPARENT;
            }
            else {
                el.dataset.color = color;
                el.style.backgroundColor = color;
            }
        }
    };
    const showHideGrid = () => {
        state.showGrid ? canvas.classList.add("pixlab-grid") : canvas.classList.remove("pixlab-grid");
    };
    canvas.addEventListener("pointerdown", event => {
        const size = canvas.getBoundingClientRect();
        const handlePointerMove = e => {
            e.preventDefault();
            const row = Math.floor(rows * (e.clientY - size.top) / size.height);
            const col = Math.floor(cols * (e.clientX - size.left) / size.width);
            setPixelColor(row, col, state.color);
        };
        const handlePointerUp = () => {
            canvas.removeEventListener("pointermove", handlePointerMove);
            canvas.removeEventListener("pointerup", handlePointerUp);
            if (typeof listeners["change"] === "function") {
                listeners["change"]();
            }
        };
        canvas.addEventListener("pointermove", handlePointerMove);
        canvas.addEventListener("pointerup", handlePointerUp);
        // Set current pixel color
        handlePointerMove(event);
    });
    // Restore pixels
    // TODO
    showHideGrid();
    // Return public api
    return {
        setTool: newTool => state.tool = newTool,
        setColor: newColor => state.color = newColor,
        showGrid: () => {
            state.showGrid = true;
            showHideGrid();
        },
        hideGrid: () => {
            state.showGrid = false;
            showHideGrid();
        },
        onChange: listener => listeners["change"] = listener,
    };
};
