# UI-Splitter
Split element functionally similar to jquery-splitter
### Peculiarities
- Uses its own styles
- Written in vanilla-js
- Shared items must be wrapped in a container
- [React-wrapper](wrap/react-ui-splitter)
- [Angular-wrapper](wrap/angular-ui-splitter)
### Connection and use
- As a script
```html
    <script type="application/javascript" src="<path>/index.js"></script>
    <body>
        <div class="container">
            <div id="one"></div>
            <div id="two"></div>
        </div>
    </body>
    <script>
         let splitter = split(["#one", "#two"], {...options});
    </script>
```

### Options
| Option name | Type | Default value | Accepted values | Description | Optional |
| ------ | :---: | :------: | :------:| :------: |:---:|
| orientation | string | horizontal | vertical \ horizontal | Arrangement of elements | Yes |
| initialSizes | Array | ["50%", "50%"] | string or number | Initial dimensions of each element | Yes |
| minimalSizes | Array | [0,0] | number | The minimum dimensions of each element | Yes |
| splitterSize | number | 7 | number | Splitter width/height | Yes |
| splitterClassName | string | "" | string | Splitter custom class name | Yes |
| onDragStart | Function | undefined | (event: MouseEvent) => void | Callback to start moving the splitter | Yes |
| onDrag | Function | undefined | (event: MouseEvent) => void | Callback for moving the splitter | Yes |
| onDragEnd | Function | undefined | (event: MouseEvent) => void | Callback to complete the splitter move | Yes |
| disableCollapse | boolean | false | boolean | Disable the ability to collapse the splitter | Yes |
| collapsedOnStart | boolean | false | boolean | Splitter will initially collapse | Yes |
| onSplitButtonClick | Function | undefined | (event: MouseEvent) => void | Own handling of pressing the button of the clap in the litter | Yes |
| collapseMode | string | collapse | collapse \ replace | Handling Grappling Behavior | Yes |
| -> | -> | collapse | - | Collapse the element to the specified minimum size (minimalSize) |
| -> | -> | replace | - | Collapse and replace with a plug |
| hideSplitterOnCollapse | boolean | false | boolean | Hide splitter when collapsed | Yes |
| collapsedCaption | string | "" | stirng | In collapseMode == "replace" caption on the stub | Yes |
| splitterDirection | string | direct | direct \ reverse | Which side splitter collapses | Yes |
| hideSplitButton | boolean | false | boolean | Hide the collapse button, the splitter cannot be collapsed | Yes

### API
| Function name | Type | Description |
| :------ | :---: | :------: |
| changeOrientation | () => Splitter | Reposition elements, new Splitter is returned |
| collapse | () => void | Collapse the splitter to the size specified in minimalSize |
| expand | () => void | Expand splitter |
| setSizes | ([firstSize: string \ number, secondSize: string \ number]) => void | to set specific sizes of elements | 