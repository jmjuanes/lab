// Global colors
export const TRANSPARENT = "transparent";

const styled = styles => {
    return Object.keys(styles).map(k => `${k}:${styles[k]};`).join("");
};

const createCanvas = (rows, cols) => {
    const canvasStyles = styled({
        "aspect-ratio": `${rows} / ${cols}`,
        "grid-template-columns": `repeat(${cols}, minmax(0, 1fr))`,
        "grid-template-rows": `repeat(${rows}, minmax(0, 1fr))`,
    });
    const templateContent = [
        `<div class="pixlab" data-showgrid="false" style="${canvasStyles}">`,
        ...Array.from({length: rows * cols}, (x, index) => {
            const i = Math.floor(index / cols);
            const j = index % cols;
            return `<div data-row="${i}" data-col="${j}" class="pixlab-pixel"></div>`;
        }),
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
