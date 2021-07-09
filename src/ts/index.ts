export type tuple<T> = [T, T];
export type orientation = "vertical" | "horizontal";
export type collapseMode = "collapse" | "replace";
export type splitterDirectionMode = "direct" | "reverse";
export type strOrNum = string | number;

/**
 * @public
 * Public splitter options
 */
export interface SplitterOptions {
    /**
     * @default horizontal
     */
    orientation?: orientation;
    /**
     * @default ["50%", "50%"] <px | %>
     */
    initialSizes?: [strOrNum, strOrNum?];
    /**
     * @default [0,0] <px>
     */
    minimalSizes?: [number, number?];
    /**
     * @default 7
     */
    splitterSize?: number;
    /**
     * @default ""
     */
    splitterClassName?: string;
    /**
     * @default undefined
     */
    onDragStart?: (event: MouseEvent) => void;
    /**
     * @default undefined
     */
    onDrag?: (event: MouseEvent) => void;
    /**
     * @default undefined
     */
    onDragEnd?: (event: MouseEvent) => void;
    /**
     * @default false
     */
    disableCollapse?: boolean;
    /**
     * @default false
     */
    collapsedOnStart?: boolean;
    /**
     * @default undefined
     */
    onSplitButtonClick?: (event: MouseEvent) => void;
    /**
     * @default collapse
     */
    collapseMode?: collapseMode;
    /**
     * @default false
     */
    hideSplitterOnCollapse?: boolean;
    /**
     * @default ""
     */
    collapsedCaption?: string;
    /**
     * @default direct
     */
    splitterDirection?: splitterDirectionMode;
    /**
     * @default false
     */
    hideSplitButton?: boolean;
}

/**
 * @public
 * Public splitter api
 */
export interface SplitterApi {
    changeOrientation: () => void;
    collapse: () => void;
    expand: () => void;
    setSizes: ([firstElementSize, secondElementSize]: tuple<strOrNum>) => void;
}

interface Position {
    pageX: number;
    pageY: number;
    delta: number;
}

export class Splitter implements SplitterApi {
    private readonly orientation: string;
    private readonly parentElement: HTMLElement;
    private readonly collapsePlug!: HTMLElement;
    private readonly firstElement: HTMLElement;
    private readonly splitElement: HTMLElement;
    private readonly splitButton?: HTMLElement;
    private readonly splitElementClone: HTMLElement;
    private readonly secondElement: HTMLElement;
    private readonly splitterSize: number;
    private _firstElementSize!: string;
    private _secondElementSize!: string;
    private readonly firstElementMinSize!: number;
    private readonly secondElementMinSize!: number;
    private readonly splitterClassName: string;
    private readonly onDragStart?: (event: MouseEvent) => void;
    private readonly onDrag?: (event: MouseEvent) => void;
    private readonly onDragEnd?: (event: MouseEvent) => void;
    private readonly onSplitButtonClick?: (event: MouseEvent) => void;
    private readonly collapsedCaption: string;
    private readonly disableCollapse: boolean;
    private readonly collapseMode: collapseMode;
    private readonly hideSplitterOnCollapse: boolean;
    private readonly splitterDirection: splitterDirectionMode;
    private readonly collapsedOnStart: boolean;
    private startPosition!: Partial<Position>;
    private readonly hideSplitButton!: boolean;

    get firstElementSize() {
        return this._firstElementSize;
    }

    set firstElementSize(size: string | number) {
        const parsedSize = this.parseSize(size);
        this._firstElementSize = `calc(${parsedSize} - ${this.splitterSize}px)`;
    }

    private get secondElementSize() {
        return this._secondElementSize;
    }

    private set secondElementSize(size: string | number) {
        this._secondElementSize = this.parseSize(size);
    }

    private setElementSize = (firstSize?: string | number, secondSize?: string | number): string | number => {
        if (!firstSize) {
            const size = this.parseSize(secondSize || "50%");
            if (size.endsWith("px")) {
                const parentSize = this.isHorizontal()
                    ? this.parentElement.offsetWidth
                    : this.parentElement.offsetHeight;
                return parentSize - parseInt(size);
            }
            if (size.endsWith("%")) {
                return `${100 - parseInt(size)}%`;
            }
            return "100%";
        }
        return firstSize;
    };

    constructor(
        sharedItems: tuple<HTMLElement | string>,
        {
            orientation = "horizontal",
            splitterSize = 7,
            initialSizes: [firstElementSize, secondElementSize] = ["50%", "50%"],
            minimalSizes: [leftElementMinSize, rightElementMinSize = 0] = [0, 0],
            splitterClassName = "",
            onDragStart,
            onDrag,
            onDragEnd,
            collapsedOnStart = false,
            disableCollapse = false,
            onSplitButtonClick,
            collapseMode = "collapse",
            hideSplitterOnCollapse = false,
            collapsedCaption = "",
            splitterDirection = "direct",
            hideSplitButton = false
        }: SplitterOptions = {}
    ) {
        if (!sharedItems || !sharedItems[0] || !sharedItems[1]) {
            throw new Error("Both or one selector was not passed");
        }
        {
            //set main container filling components into object fields
            this.firstElement = this.getElement(sharedItems[0]);
            this.secondElement = this.getElement(sharedItems[1]);
            this.parentElement = this.findParentNode();
        }

        {
            //set external options to component context
            this.orientation = orientation;
            this.splitterSize = splitterSize;
            this.firstElementSize = this.setElementSize(firstElementSize, secondElementSize);
            this.secondElementSize = this.setElementSize(secondElementSize, firstElementSize);
            this.firstElementMinSize = leftElementMinSize;
            this.secondElementMinSize = rightElementMinSize;
            this.splitterClassName = splitterClassName;
            this.onDragStart = onDragStart;
            this.onDrag = onDrag;
            this.onDragEnd = onDragEnd;
            this.disableCollapse = disableCollapse;
            this.onSplitButtonClick = onSplitButtonClick;
            this.collapseMode = collapseMode;
            this.collapsedOnStart = collapsedOnStart;
            this.hideSplitterOnCollapse = hideSplitterOnCollapse;
            this.collapsedCaption = collapsedCaption;
            this.splitterDirection = splitterDirection;
            this.hideSplitButton = hideSplitButton;
        }

        {
            //creating ui-splitter components
            this.splitElement = this.createSplitElement(this.splitterClassName);
            this.splitElementClone = this.cloneHtmlElement(this.splitElement, "clone");
            if (!this.hideSplitButton) {
                this.splitButton = this.createSplitButton();
            }
            if (!this.isCollapseModeToMinSize()) {
                this.collapsePlug = this.createCollapsePlug();
            }
        }
        this.split();
    }

    private findParentNode = (): HTMLElement => {
        if (!this.firstElement.parentNode) {
            throw "Parent element can't be found. Wrap your elements into container";
        }
        return <HTMLElement>this.firstElement.parentElement;
    };

    private parseSize = (size: string | number): string => {
        return typeof size === "number" ? `${size}px` : size;
    };

    private getElement = (element: HTMLElement | string): HTMLElement =>
        typeof element === "string" ? this.checkElementBySelector(element) : element;

    private checkElementBySelector = (selector: string): HTMLElement => {
        const element = document.querySelector(selector);
        if (!element) {
            throw "Invalid selector passed. Element can't be found";
        }
        return element as HTMLElement;
    };

    private createCollapsePlug = () => {
        const collapsePlug = document.createElement("div");
        collapsePlug.className = `collapse-plug ${this.orientation}`;
        if (this.isHorizontal()) {
            collapsePlug.style.width = "28px";
            collapsePlug.style.height = "100%";
        } else {
            collapsePlug.style.height = "28px";
            collapsePlug.style.width = "100%";
        }

        const button = document.createElement("div");
        button.className = `expand-button ${this.orientation}`;
        if (!this.isStraightDirection()) {
            button.classList.add("reverse");
        }
        button.onclick = this.expandElement;
        collapsePlug.appendChild(button);

        if (this.collapsedCaption) {
            const caption = document.createElement("div");
            caption.className = "caption";
            caption.innerText = this.collapsedCaption;
            collapsePlug.appendChild(caption);
        }

        return collapsePlug;
    };

    private createSplitElement = (splitterClassName: string): HTMLElement => {
        const splitElement = document.createElement("div");
        splitElement.className = `ui-splitter-split-element ${this.orientation}`;
        if (this.isHorizontal()) {
            splitElement.style.width = this.splitterSize + "px";
        } else {
            splitElement.style.height = this.splitterSize + "px";
        }
        if (splitterClassName) {
            splitElement.classList.add(splitterClassName);
        }
        return splitElement;
    };

    private createSplitButton = (): HTMLElement => {
        const splitButtonElement = document.createElement("div");
        splitButtonElement.className = "split-button";
        splitButtonElement.onclick = this.onSplitterButtonClick;
        splitButtonElement.onmouseover = (event: any) => {
            if (event.currentTarget) {
                if (this.isHorizontal()) {
                    event.currentTarget.style.width = `${this.splitterSize * 3}px`;
                } else {
                    event.currentTarget.style.height = `${this.splitterSize * 3}px`;
                }
            }
        };
        splitButtonElement.onmouseout = (event: any) => {
            if (event.currentTarget) {
                if (this.isHorizontal()) {
                    event.currentTarget.style.width = `${this.splitterSize}px`;
                } else {
                    event.currentTarget.style.height = `${this.splitterSize}px`;
                }
            }
        };
        if (this.isHorizontal()) {
            splitButtonElement.style.width = `${this.splitterSize}px`;
            splitButtonElement.style.height = "60px";
        } else {
            splitButtonElement.style.height = `${this.splitterSize}px`;
            splitButtonElement.style.width = "60px";
        }

        const arrow = document.createElement("div");
        arrow.className = "arrow";

        const arrowSize = this.splitterSize - 2;
        arrow.style.border = `${arrowSize}px solid transparent`;
        if (this.isHorizontal()) {
            arrow.style.top = `calc(50% - ${arrowSize}px)`;
            if (this.isStraightDirection()) {
                arrow.style.borderRight = `${arrowSize}px solid white`;
                arrow.style.left = `-${arrowSize - 1}px`;
            } else {
                arrow.style.borderLeft = `${arrowSize}px solid white`;
                arrow.style.right = `-${arrowSize - 1}px`;
            }
        } else {
            arrow.style.left = `calc(50% - ${arrowSize}px)`;
            if (this.isStraightDirection()) {
                arrow.style.borderBottom = `${arrowSize}px solid white`;
                arrow.style.top = `-${arrowSize - 1}px`;
            } else {
                arrow.style.borderTop = `${arrowSize}px solid white`;
                arrow.style.bottom = `-${arrowSize - 1}px`;
            }
        }

        splitButtonElement.appendChild(arrow);

        return splitButtonElement;
    };

    private cloneHtmlElement = (element: HTMLElement, className?: string): HTMLElement => {
        const cloneNode = <HTMLElement>element.cloneNode(true);
        if (className) {
            cloneNode.classList.add("clone");
        }
        return cloneNode;
    };

    private startDragging = () => {
        this.parentElement.style.userSelect = "none";
        this.splitElementClone.style.display = "flex";
    };

    private stopDragging = () => {
        this.parentElement.style.userSelect = "auto";
        this.splitElementClone.style.display = "none";
    };

    private setCloneElementOffset = (offset: number) => {
        if (this.isHorizontal()) {
            this.splitElementClone.style.left = offset + "px";
        } else {
            this.splitElementClone.style.top = offset + "px";
        }
    };

    private onSplitterMouseDown = (event: MouseEvent) => {
        if (this.onDragStart) {
            this.onDragStart(event);
        }
        this.startDragging();
        if (this.isHorizontal()) {
            this.setCloneElementOffset(this.splitElement.offsetLeft);
        } else {
            this.setCloneElementOffset(this.splitElement.offsetTop);
        }
        this.startPosition = {
            pageX: event.pageX,
            pageY: event.pageY
        };
        document.onmousemove = this.onSplitterMouseMove;
        document.onmouseup = this.onSplitterMouseUp;
    };

    private onSplitterMouseMove = (event: MouseEvent) => {
        if (this.onDrag) {
            this.onDrag(event);
        }
        const startPosition = <Position>this.startPosition;
        const parentElement = this.parentElement;
        const splitElement = this.splitElement;
        const secondElement = this.secondElement;
        const diffPosition: Omit<Position, "delta"> = {
            pageX: event.pageX - startPosition.pageX,
            pageY: event.pageY - startPosition.pageY
        };
        if (this.isHorizontal()) {
            this.calculateElementsSize(
                diffPosition.pageX,
                splitElement.offsetLeft,
                secondElement.offsetWidth,
                parentElement.offsetWidth
            );
        } else {
            this.calculateElementsSize(
                diffPosition.pageY,
                splitElement.offsetTop,
                secondElement.offsetHeight,
                parentElement.offsetHeight
            );
        }
    };

    private onSplitterMouseUp = (event: MouseEvent) => {
        if (this.onDragEnd) {
            this.onDragEnd(event);
        }
        this.stopDragging();
        const position = <Position>this.startPosition;
        const parentRect = this.parentElement.getBoundingClientRect();
        const firstRect = this.firstElement.getBoundingClientRect();
        if (this.isHorizontal()) {
            const firstSize = firstRect.width + position.delta;
            const secondSize = parentRect.width - firstSize - this.splitterSize;
            this.firstElement.style.width = `${firstSize}px`;
            this.secondElement.style.width = `${secondSize}px`;
        } else {
            const firstSize = firstRect.height + position.delta;
            const secondSize = parentRect.height - firstSize - this.splitterSize;
            this.firstElement.style.height = `${firstSize}px`;
            this.secondElement.style.height = `${secondSize}px`;
        }
        this.splitElement.style.left = "auto";

        document.onmousemove = null;
        document.onmouseup = null;
    };

    private calculateElementsSize = (
        diff: number,
        offset: number,
        secondOffset: number,
        parentOffset: number
    ): void => {
        const delta = Math.min(Math.max(diff, -offset), secondOffset);
        const result = offset + delta;
        if (result >= this.firstElementMinSize && result <= parentOffset - this.secondElementMinSize) {
            (this.startPosition as Position).delta = delta;
            this.setCloneElementOffset(result);
        }
    };

    private isHorizontal = () => this.orientation === "horizontal";

    private isCollapseModeToMinSize = () => this.collapseMode === "collapse";

    private isStraightDirection = () => this.splitterDirection === "direct";

    private onSplitterButtonClick = (event: MouseEvent) => {
        if (this.disableCollapse) {
            return false;
        }
        if (this.onSplitButtonClick) {
            this.onSplitButtonClick(event);
        } else {
            if (this.isCollapsed()) {
                this.expandElement();
            } else {
                this.collapseElement();
            }
        }
        event.stopPropagation();
    };

    private isCollapsed = () => {
        if (this.isHorizontal()) {
            if (this.isStraightDirection()) {
                return this.firstElement.offsetWidth <= this.firstElementMinSize;
            } else {
                return this.secondElement.offsetWidth <= this.secondElementMinSize;
            }
        } else {
            if (this.isStraightDirection()) {
                return this.firstElement.offsetHeight <= this.firstElementMinSize;
            } else {
                return this.secondElement.offsetHeight <= this.secondElementMinSize;
            }
        }
    };

    private setSplitterElementSizes = (firstSize: string, secondSize: string) => {
        const property = this.isHorizontal() ? "width" : "height";
        this.firstElement.style[property] = firstSize;
        this.secondElement.style[property] = secondSize;
    };

    private expandElement = () => {
        this.setSplitterElementSizes(<string>this.firstElementSize, <string>this.secondElementSize);
        if (this.isCollapseModeToMinSize()) {
            if (this.hideSplitterOnCollapse) {
                this.splitElement.style.display = "flex";
            }
            this.splitElementClone.style.top = "auto";
        } else {
            if (this.isStraightDirection()) {
                this.firstElement.classList.remove("hidden");
            } else {
                this.secondElement.classList.remove("hidden");
            }
            if (this.hideSplitterOnCollapse) {
                this.splitElement.style.display = "flex";
            }
            this.collapsePlug.style.display = "none";
        }
    };

    private collapseElement = () => {
        if (this.isCollapseModeToMinSize()) {
            if (this.isStraightDirection()) {
                this.setSplitterElementSizes(`${this.firstElementMinSize}px`, "100%");
            } else {
                this.setSplitterElementSizes("100%", `${this.secondElementMinSize}px`);
            }
            if (this.hideSplitterOnCollapse) {
                this.splitElement.style.display = "none";
            }
            this.splitElementClone.style.top = "auto";
        } else {
            if (this.isStraightDirection()) {
                this.setSplitterElementSizes("0px", "100%");
                this.firstElement.classList.add("hidden");
            } else {
                this.setSplitterElementSizes("100%", "0px");
                this.secondElement.classList.add("hidden");
            }
            if (this.hideSplitterOnCollapse) {
                this.splitElement.style.display = "none";
            }
            this.collapsePlug.style.display = "flex";
        }
    };

    private putElementBeforeSecondElement = (splitElement: HTMLElement) => {
        this.parentElement.insertBefore(splitElement, this.secondElement);
    };

    private setOptions = ({
        element,
        className,
        elementSize,
        minElementSize,
        addOrientationClass
    }: {
        element: HTMLElement;
        className: string;
        elementSize?: string;
        minElementSize?: number;
        addOrientationClass?: boolean;
    }) => {
        element.classList.add(className);
        if (addOrientationClass) {
            element.classList.add(this.orientation);
        }
        if (this.isHorizontal()) {
            if (elementSize) {
                element.style.width = elementSize;
            }
            if (minElementSize) {
                element.style.minWidth = minElementSize + "px";
            }
        } else {
            if (elementSize) {
                element.style.height = elementSize;
            }
            if (minElementSize) {
                element.style.minHeight = minElementSize + "px";
            }
        }
    };

    private addHandlerToSplitElement = () => {
        if (!this.hideSplitButton) {
            this.splitElement.appendChild(this.splitButton!);
        }
        this.splitElement.onmousedown = this.onSplitterMouseDown;
    };

    private split = () => {
        this.setOptions({
            element: this.firstElement,
            className: "ui-splitter-first-element",
            elementSize: <string>this.firstElementSize,
            minElementSize: this.firstElementMinSize
        });
        this.setOptions({
            element: this.secondElement,
            className: "ui-splitter-second-element",
            elementSize: <string>this.secondElementSize,
            minElementSize: this.secondElementMinSize
        });
        this.setOptions({
            element: this.parentElement,
            className: "ui-splitter-container",
            addOrientationClass: true
        });
        this.addHandlerToSplitElement();
        if (!this.isCollapseModeToMinSize()) {
            this.putElementBeforeSecondElement(this.collapsePlug);
        }
        this.putElementBeforeSecondElement(this.splitElement);
        this.putElementBeforeSecondElement(this.splitElementClone);
        if (this.collapsedOnStart) {
            this.collapseElement();
        }
    };

    private returnComponentsToInitialState = () => {
        const orientation = this.orientation;
        this.parentElement.classList.remove(orientation);
        this.parentElement.removeChild(this.splitElement);
        this.parentElement.removeChild(this.splitElementClone);
        if (!this.isCollapseModeToMinSize()) {
            this.parentElement.removeChild(this.collapsePlug);
        }
        this.firstElement.removeAttribute("style");
        this.secondElement.removeAttribute("style");

        if (!this.firstElement.classList.contains("ui-splitter-container")) {
            this.firstElement.classList.remove(orientation);
        }
        if (!this.secondElement.classList.contains("ui-splitter-container")) {
            this.secondElement.classList.remove(orientation);
        }
    };

    public changeOrientation = () => {
        this.returnComponentsToInitialState();
        return new Splitter([this.firstElement, this.secondElement], {
            orientation: this.isHorizontal() ? "vertical" : "horizontal",
            initialSizes: ["50%", "50%"],
            minimalSizes: [this.firstElementMinSize, this.secondElementMinSize],
            splitterClassName: this.splitterClassName,
            splitterSize: this.splitterSize,
            onDragStart: this.onDragStart,
            onDrag: this.onDrag,
            onDragEnd: this.onDragEnd,
            collapsedOnStart: false,
            disableCollapse: this.disableCollapse,
            onSplitButtonClick: this.onSplitButtonClick,
            collapseMode: this.collapseMode,
            hideSplitterOnCollapse: this.hideSplitterOnCollapse,
            collapsedCaption: this.collapsedCaption,
            splitterDirection: this.splitterDirection
        });
    };

    public collapse = () => {
        if (!this.isCollapsed()) {
            this.collapseElement();
        }
    };

    public expand = () => {
        if (this.isCollapsed()) {
            this.expandElement();
        }
    };

    public setSizes = ([firstElementSize, secondElementSize]: tuple<strOrNum> = ["50%", "50%"]) => {
        this.firstElementSize = this.setElementSize(firstElementSize, secondElementSize);
        this.secondElementSize = this.setElementSize(secondElementSize, firstElementSize);
        this.setSplitterElementSizes(<string>this.firstElementSize, <string>this.secondElementSize);
    };
}

export const split = (sharedItems: tuple<HTMLElement | string>, options: SplitterOptions) =>
    new Splitter(sharedItems, options);
