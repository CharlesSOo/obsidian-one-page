<script lang="ts">
    import type DailyNoteViewPlugin from "../dailyNoteViewIndex";
    import { MarkdownView, TAbstractFile, TFile, WorkspaceLeaf, moment } from "obsidian";
    import { spawnLeafView } from "../leafView";
    import { onDestroy, onMount } from "svelte";

    export let file: TAbstractFile;
    export let plugin: DailyNoteViewPlugin;
    export let leaf: WorkspaceLeaf;
    export let shouldRender: boolean = true;

    let editorEl: HTMLElement;
    let containerEl: HTMLElement;
    let title: string;

    let rendered: boolean = false;

    let createdLeaf: WorkspaceLeaf;
    let unloadTimeout: number | null = null;
    let editorHeight: number = 100; // Default minimum height
    
    // Track if this component is being destroyed
    let isDestroying = false;

    onMount(() => {
        if (file instanceof TFile) {
            title = file.basename;
        }
    });

    $: if (editorEl && shouldRender && !rendered) {
        showEditor();
    } else if (editorEl && !shouldRender && rendered) {
        scheduleUnload();
    }

    onDestroy(() => {
        isDestroying = true;
        if (unloadTimeout) {
            window.clearTimeout(unloadTimeout);
        }
        if (rendered && createdLeaf) {
            unloadEditor();
        }
    });

    function showEditor() {
        if (!(file instanceof TFile)) return;
        if (rendered) return;
        if (isDestroying) return;
        
        // Clear any pending unload
        if (unloadTimeout) {
            window.clearTimeout(unloadTimeout);
            unloadTimeout = null;
        }

        try {
            [createdLeaf] = spawnLeafView(plugin, editorEl, leaf);
            createdLeaf.setPinned(true);

            createdLeaf.setViewState({
                type: "markdown",
                state: {
                    file: file.path,
                    mode: "source",
                    source: false,
                    backlinks: !plugin.settings.hideBacklinks,
                    backlinkOpts: {
                        collapseAll: false,
                        extraContext: false,
                        sortOrder: "alphabetical",
                        showSearch: false,
                        searchQuery: "",
                        backlinkCollapsed: false,
                        unlinkedCollapsed: true
                    }
                }
            });
            createdLeaf.parentLeaf = leaf;

            rendered = true;

            // Add click handler to native inline-title for opening in new pane
            const inlineTitle = editorEl.querySelector(".inline-title");
            if (inlineTitle) {
                inlineTitle.style.cursor = "pointer";
                inlineTitle.addEventListener("click", handleFileIconClick);
            }

            // Set a small timeout to allow the editor to render completely
            const timeout = window.setTimeout(() => {
                if (createdLeaf && containerEl) {
                    // Get the actual height of the editor content
                    if(!(createdLeaf.view instanceof MarkdownView)) return;
                    // @ts-ignore
                    const actualHeight = createdLeaf.view.editMode?.editor?.cm?.dom.innerHeight;
                    if (actualHeight > 0) {
                        editorHeight = actualHeight;
                        // Apply the height to the container
                        containerEl.style.minHeight = `${editorHeight}px`;

                        window.clearTimeout(timeout);
                    }

                    // Format the title as "Mon, January 26th, 2026" if it's a date
                    const inlineTitleEl = editorEl.querySelector(".inline-title");
                    if (inlineTitleEl) {
                        const dateMatch = title?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                        if (dateMatch) {
                            const formattedDate = moment(title).format("ddd, MMMM Do, YYYY");
                            inlineTitleEl.textContent = formattedDate;
                        }
                    }
                }
            }, 400);
        } catch (error) {
            console.error("Error creating leaf view:", error);
        }
    }
    
    // Schedule unloading the editor with a delay to prevent flickering
    function scheduleUnload() {
        if (unloadTimeout) {
            window.clearTimeout(unloadTimeout);
        }
        
        // Use a longer timeout to prevent frequent load/unload cycles
        unloadTimeout = window.setTimeout(() => {
            if (!shouldRender && rendered) {
                unloadEditor();
            }
        }, 1000);
    }
    
    // Unload the editor to free up resources
    function unloadEditor() {
        if (!rendered || !createdLeaf) return;
        
        try {
            // Detach the leaf - wrap in try-catch to handle CodeMirror state errors
            try {
                if (createdLeaf.detach) {
                    createdLeaf.detach();
                }
            } catch (e) {
                // Safe to ignore - editor state may already be cleaned up
            }
            
            // Clear the editor element
            if (editorEl) {
                editorEl.empty();
            }
            
            rendered = false;
            
            // Keep the container height to prevent scroll jumps
            // The height will be maintained by the min-height we set earlier
        } catch (error) {
            console.error("Error unloading editor:", error);
        }
    }

    function handleFileIconClick() {
        if (!(file instanceof TFile)) return;
        if (leaf && !(leaf as any)?.pinned) {
            leaf.openFile(file);
        } else plugin.app.workspace.getLeaf(false).openFile(file);
    }

    function handleEditorClick() {
        // @ts-ignore
        const editor = createdLeaf?.view?.editMode?.editor;
        if (editor && !editor.hasFocus()) {
            editor.focus();
        }
    }
</script>

<div class="daily-note-container" data-id='dn-editor-{file.path}' bind:this={containerEl} style="min-height: {editorHeight}px;">
    <div class="daily-note">
        <div class="daily-note-editor" bind:this={editorEl} data-title={title} on:click={handleEditorClick}>
            {#if !rendered && shouldRender}
                <div class="editor-placeholder">Loading...</div>
            {/if}
            {#if !shouldRender && !rendered}
                <div class="editor-placeholder">Scroll to view content</div>
            {/if}
        </div>
    </div>
</div>

<style>
    .daily-note {
        margin-bottom: var(--size-4-5);
        padding-bottom: var(--size-4-8);
    }

    .daily-note-editor {
        min-height: 100px;
    }

    .editor-placeholder {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
        color: var(--text-muted);
        font-style: italic;
    }
</style>
