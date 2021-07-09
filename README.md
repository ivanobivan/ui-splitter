# UI-Splitter
Split-элемент функционально похожий на jquery-splitter
### Особенности
- Использует собственные стили
- Написан на vanila.js
- Может использоваться как в react-компонентах, так и подключаться явно как скрипт
- Разделяемые элементы должны быть обернуты в контейнер
- Присутствует react-обертка
### Подключение и использование
- Как скрипт
```html
    <script type="application/javascript" src="<path>/index.js"></script>
    <body>
        <div class="container">
            <div id="one"></div>
            <div id="two"></div>
        </div>
    </body>
    <script>
         let splitter = split(["#one", "#two"]);
    </script>
```
### Опции
| Имя опции | Тип | Дефолтное значение | Принимаемые значения | Описание | Опционально|
| ------ | :---: | :------: | :------:| :------: |:---:|
|orientation| string | horizontal | vertical \ horizontal | Расположение элементов | Да|
|initialSizes| Array | ["50%", "50%"] |  string or number | Изначальные размеры каждого элемента| Да|
|minimalSizes| Array | [0,0] | number | Минимальные размеры каждого элемента| Да|
|splitterSize| number | 7 | number | Размер сплиттера | Да|
|splitterClassName| string | "" | string | Кастомное имя класса сплиттера | Да|
|onDragStart| Function | undefined | (event: MouseEvent) => void | Коллбек на начало перемещения сплиттера | Да|
|onDrag| Function | undefined | (event: MouseEvent) => void | Коллбек на перемещение сплиттера | Да|
|onDragEnd| Function| undefined | (event: MouseEvent) => void | Коллбек на завершение перемещения сплиттера | Да|
|disableCollapse| boolean| false | boolean | Отключить возможность схлопнуть сплиттер | Да|
|collapsedOnStart| boolean | false | boolean | Изначально сплиттер схлопнут | Да |
|onSplitButtonClick| Function | undefined | (event: MouseEvent) => void | Своя обработка нажатия на кнопку схлапывания вплиттера | Да |
|collapseMode| string | collapse | collapse \ replace | Обработка поведения при схлапывании| Да |
|->|->|collapse|-|Схлопнуть элемент до указанного минимального размера (minimalSize)|
|->|->|replace|-| Схлопнуть и заменить на заклушку|
|hideSplitterOnCollapse| boolean| false | boolean| Скрывать сплиттер в схлопнутом состоянии| Да|
|collapsedCaption| string| "" | stirng| В collapseMode=="replace" надпись на заглушке| Да|
|splitterDirection| string | direct| direct \ reverse| В какую сторону схлапывается сплиттер| Да|
|hideSplitButton| boolean| false | boolean| Скрыть кнопку схлапывания, сплиттер нельзя схлопнуть| Да

### API
| Имя функции | Тип | Описание |
| :------ | :---: | :------: |
|changeOrientation| () => Splitter | Изменить расположение элементов, возвращается новый экземпляр Splitter|
|collapse| () => void | Схлопнуть сплиттер до размера, указанного в minimalSize|
|expand| ()=> void| Развернуть сплиттер|
|setSizes| ([firstSize: string\number, secondSize: string\number])=>void | задать конкретные размеры элементов|