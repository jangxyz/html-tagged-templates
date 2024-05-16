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

## Others

In case you feed tagged template literals is too limited, use the functions underneath directly.

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

To access elements inside nested the outermost element, see [htmlWithQueryFn](#user-content-htmlwithqueryfn).


Multiple string arguments result into a single element. You can pass in attributes values, including event callbacks.

```javascript
const button = htmlSingleFn([
  '<button type="button" aria-pressed="', false, '" onclick="',
    (event) => console.log("click"),
  '">Click me</button>',
])
```

### `htmlMultipleFn`

```javascript
const [divEl, pEl] = htmlMultipleFn(["<div>Hi there,</div>", "<p>I am here</p>"])
```

### `htmlWithQueryFn`

Query option returns a object where you can access the queries results.

```javascript
const result = htmlWithQueryFn(`<ul><li>first item</li><li>second item</li><ul>`, {
  query: { firstItem: 'li:first-of-type' }
  queryAll: { items: 'li' }
})

const ulEl = result.element

const {
  query: { firstItem },
  queryAll: { items },
} = result

console.log(firstItem.textContent) // 'first item'
console.log(items.length) // 2
```
