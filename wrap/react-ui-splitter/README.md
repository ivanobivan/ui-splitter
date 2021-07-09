# React-UI-Splitter
React обертка для ui-splitter
### Подключение и использование
- React-Component
```jsx
    import SplitWrapper from "react-ui-splitter";
    <SplitWrapper>
        <div id="one"></div>
        <div id="two"></div>
    </SplitWrapper> 
```
### Опции
Для использования доступны те же опции, что и у ui-splitter
### API
Для использования доступны те же функции, что и у ui-splitter, api возвращается в коллбеке
| Имя функции | Тип | Описание |
| ------ | :---: | :------: |
|getSplitterApi| () => SplitterApi | Получить splitter-api после рендера элемента|