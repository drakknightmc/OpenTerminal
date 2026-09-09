# GridStack 11.3.0 Integration Gotchas

This document covers non-obvious behaviors and bugs in GridStack integration, discovered and fixed during 2026-09-09 session.

## Widget Layout Structure

### Correct Nesting

```html
<div class="grid-stack-item">           <!-- Added by GridStack -->
  <div class="grid-stack-item-content"> <!-- Added by GridStack -->
    <div class="terminal-panel">        <!-- Our wrapper -->
      <div class="panel-title">
        <span class="drag-handle">Title</span>  <!-- ✓ Draggable -->
        <button class="close-btn">✕</button>   <!-- ✓ Click works -->
      </div>
      <div class="widget-body">
        <!-- Component renders here -->
      </div>
      <div class="resize-handle"></div>
    </div>
  </div>
</div>
```

**Critical**: 
- Drag handle (`.drag-handle`) MUST be a direct child of `.panel-title`
- If nested deeper (e.g., `<div class="drag-handle"><span>...</span></div>`), GridStack won't recognize it as draggable
- Close button and other interactive elements MUST be siblings of drag-handle, not children

### Why This Matters

GridStack looks for `handle: ".drag-handle"` selector to enable dragging. If the selector doesn't match directly, the entire panel becomes non-draggable, trapping widgets.

**Real bug we fixed**: Close button was nested one level deep, which prevented drag-start events from firing. Flattening the structure fixed it.

---

## Event Propagation Traps

### The Click-Through Problem

```typescript
// ❌ WRONG: Click on close button triggers drag
close.addEventListener("click", () => widgets.removeWidget(id));

// ✓ CORRECT: Stop all mouse/pointer events from bubbling to drag layer
close.addEventListener("mousedown", (e) => e.stopPropagation());
close.addEventListener("pointerdown", (e) => e.stopPropagation());
close.addEventListener("touchstart", (e) => e.stopPropagation());
close.addEventListener("click", () => widgets.removeWidget(id));
```

**Why**: GridStack listens for `mousedown`/`pointerdown` on the drag handle to start dragging. If your close button doesn't stop propagation during these events, GridStack thinks the user is trying to drag, not click delete.

**Result**: Delete button clicks get interpreted as drag starts, widget doesn't close, user gets confused.

**Fix**: Stop propagation on all input phases, not just `click`. The `mousedown`/`pointerdown` phase is where GridStack makes its decision.

---

## Reactive Binding Issues

### When syncWidgets() Fires

```typescript
$: if (grid && $widgets.widgets) syncWidgets();
```

This reactive statement runs when:
1. `grid` becomes non-null (component mounted)
2. `$widgets.widgets` changes (user adds/removes/moves widget)

**Gotcha**: Even a shallow change to the array (e.g., reordering) triggers re-sync. This is fine, but:
- Avoid setting `$widgets.widgets` to the same array reference if nothing changed
- Use immutable patterns (`[...array, newItem]`) so Svelte notices the change

**Performance**: syncWidgets() is fast (~10ms for 10 widgets), but if you're dispatching store updates in tight loops, you could de-optimize.

---

## GridStack API Gotchas

### `getGridElement()` Doesn't Exist

```typescript
// ❌ WRONG: Crashes with "getGridElement is not a function"
const element = grid.getGridElement();

// ✓ CORRECT: Access via gridstackNode property
const element = entry.element;  // HTMLElement added by GridStack
const node = element.gridstackNode;  // GridStackNode metadata
```

GridStack v11.3 doesn't expose `getGridElement()`. If you need to manipulate a widget's element, you must:
1. Store reference when you create it: `const item = grid.addWidget(layout)`
2. Access its gridstackNode: `item.gridstackNode`
3. Or store the element directly and query it from the DOM

**Real bug we hit**: `unmountWidget()` called `grid.getGridElement()` which doesn't exist. Fix was to use `entry.element.isConnected` instead (check if DOM node is still in the document).

### `removeWidget()` with Flags

```typescript
grid.removeWidget(element, true, false);
//                         ↑    ↑
//                   removeDOM  triggerEvent
```

- First `true`: Remove from DOM (don't just update GridStack state)
- Second `false`: Don't fire `removed` event (prevents double-cleanup in our cascade)

If you pass `removeWidget(element, false, true)`, the widget stays in the DOM, leading to zombie elements and memory leaks.

---

## Layout Persistence

### Default Behavior

```typescript
const grid = GridStack.init({ ... }, element);

grid.on("dragstop", (_event, el) => {
  const node = el.gridstackNode;
  // Save node.x, node.y, node.w, node.h to your store
});
```

GridStack does NOT automatically persist layout. You must:
1. Listen to `dragstop` and `resizestop` events
2. Extract the new position/size from `element.gridstackNode`
3. Save to your store/database/localStorage

**Our approach**: `persistFromNode()` callback in `WorkspaceGrid.svelte` (line 168). This converts GridStackNode to WidgetInstance and updates the store, which persists to localStorage.

---

## Responsive Breakpoints

```typescript
const grid = GridStack.init({
  column: 12,  // Desktop: 12 columns
  columnOpts: {
    breakpointForWindow: true,  // Use window.innerWidth, not container width
    breakpoints: [
      { w: 1200, c: 12 },        // 1200px+: 12 columns
      { w: 860, c: 6 },          // 860-1199px: 6 columns
      { w: 520, c: 4 },          // 520-859px: 4 columns
    ],
  },
});
```

**Gotcha**: Breakpoints use `window.innerWidth`, not container width. This means:
- Full-screen dashboard: breakpoints work as expected
- Embedded widget: breakpoints don't adapt to container size
- Iframe: breaks completely (window size ≠ iframe size)

For desktop app use (like we have), this is fine. If you're embedding this in another app, you'll need to set up custom breakpoint detection.

---

## Known Limitations

1. **No collision detection**: If two widgets overlap (can happen with custom layout edits), GridStack won't auto-resolve. Drag one away manually.

2. **No keyboard nav**: Can't tab through widgets or use arrow keys to reorder. Add this yourself if needed.

3. **No touch-friendly resize**: Resize handle is 16px, hard to hit on mobile. We don't optimize for mobile currently.

4. **Float mode off**: `float: false` means widgets stack vertically by default, gaps require manual adjustment. This is intentional (cleaner layouts).

---

## Testing Changes to This Component

If you modify `WorkspaceGrid.svelte`:

1. **Test widget add/remove**: Sidebar → add widget, close button removes it
2. **Test drag/drop**: Grab title bar, drag to new position, release
3. **Test resize**: Grab corner, resize, confirm number updates in store
4. **Test persistence**: Refresh page, layout should restore (check localStorage)
5. **Test breakpoints** (optional): Resize browser window, confirm column count adjusts
6. **Test linked widgets**: Add Chart + Quote linked to same symbol, symbol change in one should update both

---

## Debugging GridStack Issues

### Enable Verbose Logging

```typescript
grid.on("added", (event, items) => {
  console.log("GridStack: added", items);
});
grid.on("removed", (event, items) => {
  console.log("GridStack: removed", items);
});
grid.on("dragstop", (event, el) => {
  console.log("GridStack: dragstop", el.gridstackNode);
});
```

### Inspect GridStack State

```javascript
// In browser console
grid.engine.nodes  // Array of all widget nodes
grid.opts          // Current options
grid.container     // DOM element
```

### Check CSS Conflicts

GridStack injects styles. If widgets don't appear or don't move:
1. Inspect the `.grid-stack-item` element
2. Check computed styles: position, transform, left, top
3. Look for `!important` rules overriding GridStack's layout CSS

Common conflict: `position: relative; left: 0; top: 0;` set globally will break absolute positioning.

---

## References

- GridStack GitHub: https://github.com/gridstack/gridstack.js
- API Docs: https://gridstackjs.com/docs/
- Our integration: `lite/web/src/widgets/WorkspaceGrid.svelte`
- CSS: Global styles in WorkspaceGrid (lines 210–295)

---

**Last updated**: 2026-09-09  
**GridStack version**: 11.3.0
