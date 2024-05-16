
# HTML tagged templates

Build DOM HTML elements with html`` tagged templates.

```javascript
import { html } from '@jangxyz/html-tagged-templates'
const element = html`<div>element</div>`
```

## Install

```bash
npm install @jangxyz/html-tagged-templates
```

## Usage


## Others

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

To access elements inside nested the outermost element, see [`htmlWithQueryFn`].


Multiple string arguments result into a single element. You can pass in attributes values, including event callbacks.
Note all attributes should be surrounded with quotes -- both single and double quotes are allowed.

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
