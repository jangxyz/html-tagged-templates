# HTML tagged templates

Build DOM HTML elements with html`` tagged templates, plus more. No dependencies.

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

## Usage

Nested elements work.

```javascript
html`<div>
  I am an element, and this is a 
  <button>button</button>
</div>`
```

Pass in attributes, including event callbacks.

```javascript
const checkbox = html`<input 
  type="checkbox" 
  checked="${true}" 
  onchange="${(event) => console.log("change:", event.target.checked)}"
/>`
```

Note all attributes should be surrounded with quotes -- both single and double quotes are allowed.

### Types

By default the `html\`\`` tagged template returns an HTMLElement.
If you want it to return the exact element, like if you want `html\`<input type="checkbox" />\`` to return an object of type `HTMLInputElement`, you can use the raw `htmlSingleFn` function below.
We would like to suppor this to `html\`\`` too, but currently there is a limit in TypeScript that prevents from doing this.
Meanwhile you can pass the type or the name of the tag as a generic:

```typescript
const checkbox1 = html<HTMLInputElement>`<input type="checkbox" />`    // pass generic type, or
const checkbox2 = html<'input'>`<input type="checkbox"  />`            // pass the name of the tag
const checkbox3 = html`<input type="checkbox"  />` as HTMLInputElement // or use type assertion
```


## Others

In case you feed tagged template literals is too limited, you can use the functions underneath directly.

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
  '">Click me</button>',
])
```

### `htmlTupleFn`

Query option returns a object where you can access the queries results.

```javascript
const result = htmlTuplefn(`<ul><li>first item</li><li>second item</li><ul>`, {
  query: { firstItem: 'li:first-of-type' } // invokes `.querySelector()`
  queryAll: { items: 'li' }                // invokes `.queyrSelectorAll()`
})

const [ulEl, { firstItem, items }] = result

console.log(firstItem.textContent) // 'first item'
console.log(items.length) // 2
```

The first item is the outermost element, and each query options' results are applied to the second item.


### `htmlMultipleFn`

```javascript
const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
```
