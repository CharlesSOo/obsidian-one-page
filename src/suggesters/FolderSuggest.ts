import { AbstractInputSuggest, App, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
    }

    getSuggestions(inputStr: string): TFolder[] {
        const folders: TFolder[] = [];
        const lowerInput = inputStr.toLowerCase();

        this.app.vault.getAllLoadedFiles().forEach((file: TAbstractFile) => {
            if (
                file instanceof TFolder &&
                file.path.toLowerCase().includes(lowerInput)
            ) {
                folders.push(file);
            }
        });

        return folders.slice(0, 1000);
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder): void {
        this.inputEl.value = folder.path;
        this.inputEl.trigger("input");
        this.close();
    }
}
