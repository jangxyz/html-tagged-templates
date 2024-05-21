# HTML tagged templates

Build DOM HTML elements with <code>html\`\`</code> tagged templates, plus more. No dependencies.

```javascript
import { html } from '@jangxyz/html-tagged-templates'

const element = html`<div>Let's go JavaScript</div>`

console.log(element intanceof HTMLElement) // true
console.log(element.textContent) // "Let's go JavaScript"
```

## Install

```bash
npm install @jangxyz/html-tagged-templates
```

NOTE Before it reaches v1.0, it is considered unstable, meaning the APIs are not fixed and may due to change. If you are thinking of trying out, please verify the version you are using and the corresponding documentation.

## Usage

You can nest elements.

```javascript
html`<div>
  I am an element, and this is a 
  ${html`<button>button</button>`}
</div>`
```

Pass in attributes, including event callbacks.

```javascript
const checkbox = html`<input 
  type="checkbox" 
  checked="${true}" 
  onchange="${(event) => {
    console.log("change:", event.target.checked);
  }}"
/>`
```

Note all attributes should be surrounded with quotes -- both single and double quotes are allowed.

### Types

By default the <code>html\`\`</code> tagged template returns an HTMLElement.  
If you want it to return the exact element, like if you want <code>html\`<input type="checkbox" />\`</code> to return an object of type `HTMLInputElement`, you can use the raw `htmlSingleFn` function below.
We would like to support this to <code>html\`\`</code> too, but currently there is a limit in TypeScript that prevents from doing this.  
Meanwhile you can pass the type or the name of the tag as a generic:


```typescript
const checkbox0 = html`<input type="checkbox" />`                      // HTMLElement by default
//    ^? const checkbox0: HTMLElement

const checkbox1 = html<HTMLInputElement>`<input type="checkbox" />`    // pass generic type, or
//    ^? const checkbox1: HTMLInputElement

const checkbox2 = html<'input'>`<input type="checkbox"  />`            // pass the name of the tag
//    ^? const checkbox2: HTMLInputElement

const checkbox3 = html`<input type="checkbox" />` as HTMLInputElement  // use type assertion
//    ^? const checkbox3: HTMLInputElement
```


## Others

In case you feel tagged template literals is too limited, you can use the functions underneath directly, as it providers more features.

### `htmlSingleFn`

```javascript
const tdEl = htmlSingleFn("<td>Hi there</td>")
```

```javascript
const trEl = htmlSingleFn(`<tr>
  <td>cell 1</td>
  <td>cell 2</td>
</tr>`)
```

To access elements inside nested the outermost element, see [htmlTuplefn](#user-content-htmltuplefn).

Multiple string arguments result into a single element. You can pass in attributes values, including event callbacks.

```javascript
const button = htmlSingleFn([
  '<button type="button" aria-pressed="', false, '" onclick="',
    (event) => console.log("click"),
  '">Click me</button>' 
])
```

### `htmlTupleFn`

`htmlTupleFn` recieves a query option which returns an object with the queried results. The result is a tuple, where the first item is the outermost element and the second item is composed of each query options' results.

```javascript
const result = htmlTuplefn('<ul><li>first item</li><li>second item</li><ul>', {
  query   : { firstItem: 'li:first-of-type' },  // invokes .querySelector()
  queryAll: { items: 'li' }                     // invokes .queyrSelectorAll()
})

const [ulEl, { firstItem, items }] = result

console.log(firstItem.textContent) // 'first item'
console.log(items.length) // 2
```

In case both `query` and `queryAll` option uses the same name, only the result from `query` remains.

```javascript
const [ulEl, { item }] = htmlTuplefn('<ul><li>first item</li><li>second item</li><ul>', {
  query   : { item: 'li' },
  queryAll: { item: 'li' },
})

console.log(item instanceof HTMLLIElement)
```


### `htmlMultipleFn`

In case you want to return multiple elements at once.

```javascript
const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
```
