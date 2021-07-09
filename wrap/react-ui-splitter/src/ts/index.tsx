import React from "react";
import {SplitterOptions, split, Splitter, SplitterApi} from "ui-splitter";

export interface SplitWrapperProps extends SplitterOptions {
    getSplitterApi?: (api: ReactSplitterApi) => void;
}

export interface ReactSplitterApi extends Omit<SplitterApi, "changeOrientation"> {
    changeOrientation: () => void;
}

export default class SplitWrapper extends React.Component<SplitWrapperProps> {

    parentRef: React.RefObject<HTMLDivElement>;
    splitter: Splitter | null;

    constructor(props: SplitterOptions) {
        super(props);
        this.parentRef = React.createRef();
        this.splitter = null;
    }


    componentDidMount() {
        const parent = this.parentRef.current;
        if (parent) {
            this.splitter = split([(parent.children[0] as HTMLElement), (parent.children[1] as HTMLElement)], this.props);
            this.sendReactSplitterApi(this.splitter);
        } else {
            throw new Error("Unable to create parent element");
        }
    }

    onChangeOrientationWrapper = (splitter: Splitter) => {
        this.splitter = splitter.changeOrientation();
        this.sendReactSplitterApi(this.splitter);
    }

    getReactSplitterApi = (splitter: Splitter): ReactSplitterApi => {
        return {
            changeOrientation: () => this.onChangeOrientationWrapper(splitter),
            collapse: splitter!.collapse,
            expand: splitter!.expand,
            setSizes: splitter!.setSizes
        }
    }

    sendReactSplitterApi = (splitter: Splitter) => {
        if (this.props.getSplitterApi) {
            this.props.getSplitterApi(this.getReactSplitterApi(splitter));
        }
    }

    render() {
        return (
            <div ref={this.parentRef}>
                {this.props.children}
            </div>
        )
    }
}