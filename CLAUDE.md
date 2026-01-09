# Claude Code Guidelines for Daily Notes Editor

## Obsidian Plugin Development Standards

### Use Obsidian's Built-in APIs

Always prefer Obsidian's built-in APIs over custom implementations:

- **Suggestions/Autocomplete**: Use `AbstractInputSuggest<T>`, `FuzzySuggestModal`, or `SuggestModal` instead of custom dropdown implementations
- **Modals**: Extend `Modal` class properly, use `Setting` components
- **File Operations**: Use `app.vault` methods, not direct file system access
- **Events**: Use Obsidian's event system (`app.workspace.on`, `app.vault.on`)

### Example: Folder Suggestions

```typescript
// GOOD: Using Obsidian's AbstractInputSuggest
import { AbstractInputSuggest, TFolder } from "obsidian";

class FolderSuggest extends AbstractInputSuggest<TFolder> {
    getSuggestions(query: string): TFolder[] { ... }
    renderSuggestion(folder: TFolder, el: HTMLElement): void { ... }
    selectSuggestion(folder: TFolder): void { ... }
}

// BAD: Custom dropdown with manual event handling
// - Manual keyboard navigation
// - Custom CSS positioning
// - Custom blur/focus handling
```

### Resources

- [Obsidian Developer Docs](https://docs.obsidian.md/)
- [AbstractInputSuggest API](https://docs.obsidian.md/Reference/TypeScript+API/AbstractInputSuggest)
- [Templater's FolderSuggester](https://github.com/SilentVoid13/Templater/blob/master/src/settings/suggesters/FolderSuggester.ts) - Reference implementation

### Code Patterns to Follow

1. **Extend, don't reinvent**: If Obsidian has a component, use it
2. **Use TypeScript properly**: Leverage Obsidian's type definitions
3. **Follow existing patterns**: Check how other mature plugins solve similar problems
4. **Keep it simple**: Avoid over-engineering; use framework features

### Build Commands

```bash
npm install --legacy-peer-deps
npx vite build --mode production
```

### Deploy to Vault

```bash
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/daily-notes-editor/
```
