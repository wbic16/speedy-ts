import { Component, For, onMount } from "solid-js"
import { createStore } from "solid-js/store";
import { BlockManager } from "../library/block-manager";
import { GridBlock, GridCellBlock } from "../library/grid-block";
import { TabBlock, TabRowBlock } from "../library/tabs-block";
import { IndentedListBlock } from "../library/indented-list-block";
import { StandoffEditorBlock } from "../library/standoff-editor-block";
import { BlockType, Caret, CARET, IBlock, IRange } from "../library/types";
import { Phext, Coordinate } from "libphext";

type Model = {
    command: string;
    file: string;
    template: string;
    coordinate: Coordinate;
}
type Resources = {
    files: string[];
    templates: string[];
}
type Props = {
    manager?: BlockManager;
}
export const ControlPanel : Component<Props> = (props) => {
    const phext = new Phext();
    const [model, setModel] = createStore<Model>({
        command: "",
        file: "",
        template: "",
        coordinate: phext.to_coordinate("1.1.1/1.1.1/1.1.1")
    });
    const [resources, setResources] = createStore<Resources>({
        files: [], templates: []
    });
    const onSubmit = (e:Event) => {
        e.preventDefault();
        runCommand();
    }
    const embedDocument = async (parameters: string[]) => {
        if (!props.manager) return;
        const filename = parameters && parameters[0] || model.file;
        const block = props.manager.getBlockInFocus() as IBlock;
        await props.manager.embedDocument(block, filename);
    }
    const loadMicroDocument = async (parameters: string[]) => {
        if (!props.manager) return;
        const filename = parameters && parameters[0] || model.file;
        const block = props.manager.getBlockInFocus() as StandoffEditorBlock;
        if (block?.type != BlockType.StandoffEditorBlock) return;
        const lastCaret = block.lastCaret;
        const prop = {
            type: "cell/micro-document",
            start: lastCaret.index,
            end: lastCaret.index,
            value: filename
        };
        block.addStandoffPropertiesDto([prop]);
        block.applyBlockPropertyStyling();
        block.setCaret(lastCaret.index, CARET.LEFT);
    }
    const load = async (parameters: string[]) => {
        if (!props.manager) return;
        const filename = parameters && parameters[0] || model.file;
        await props.manager.loadServerDocument(filename);
    }
    const loadTemplate = async (parameters: string[]) => {
        if (!props.manager) return;
        const filename = parameters && parameters[0] || model.file;
        const coordinate = parameters && phext.to_coordinate(parameters[1]) || model.coordinate;
        await props.manager.loadServerTemplate(filename, coordinate);
    }
    const save = async (parameters: string[]) => {
        if (!props.manager) return;
        const filename = parameters && parameters[0] || model.file;
        await props.manager.saveServerDocument(filename);
        await listDocuments();
    }
    const listDocuments = async () => {
        if (!props?.manager) return;
        const files = await props.manager.listDocuments();
        setResources("files", files);
    }
    const listTemplates = async () => {
        if (!props?.manager) return;
        const files = await props.manager.listTemplates();
        setResources("templates", files);
    }
    const loadSelectedFileClicked = async (e: Event) => {
        e.preventDefault();
        await load([model.file]);
    }
    const loadSelectedTemplateClicked = async (e: Event) => {
        e.preventDefault();
        await loadTemplate([model.template, model.coordinate]);
    }
    const createCodeMirrorBlock = () => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addCodeMirrorBlock(block);
    }
    const createNewDocumentClicked = (e: Event) => {
        e.preventDefault();
        createDocument();
    }
    const createDocument = () => {
        if (!props.manager) return;
        const doc = {
            type: BlockType.DocumentBlock,
            children: [
                {
                    type: BlockType.StandoffEditorBlock,
                    text: "",
                    standoffProperties: [],
                    blockProperties: [
                        { type: "block/alignment/left "}
                    ]
                }
            ]
        };
        props.manager.loadDocument(doc);
        const textBlock = props.manager.registeredBlocks.find(x=> x.type == BlockType.StandoffEditorBlock) as StandoffEditorBlock;
        if (!textBlock) return;
        textBlock.addEOL();
        textBlock.setCaret(0, CARET.LEFT);
        props.manager?.setBlockFocus(textBlock);
    }
    const setBackgroundColour = (colour: string) => {
        const prop = {
            type: "block/background/colour",
            value: colour
        };
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        block.addBlockProperties([prop]);
    }
    const setBackgroundImage = (url: string) => {
        const prop = {
            type: "block/background/image",
            value: url
        };
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        block.addBlockProperties([prop]);
        block.applyBlockPropertyStyling();
    }
    const setFontColour = (colour: string) => {
        const prop = {
            type: "block/font/colour",
            value: colour
        };
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        block.addBlockProperties([prop]);
    }
    const addImage = (url: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addImageBlock(block, url);
    }
    const addImageRight = (url: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addImageRight(block, url);
    }
    const addImageLeft = (url: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addImageLeft(block, url);
    }
    const addVideo = (url: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addVideoBlock(block, url);
    }
    const addIFrame = (url: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        props.manager?.addIFrameBlock(block, url);
    }
    const createGrid = (rows: number, cells: number) => {
        const manager = props.manager as BlockManager;
        const block = manager.getBlockInFocus();
        if (!block) return;
        const grid = manager.createGrid(rows, cells) as GridBlock;
        manager.addBlockAfter(grid, block);
        const textBlock = grid.blocks[0].blocks[0].blocks[0] as StandoffEditorBlock;
        manager.setBlockFocus(textBlock);
        textBlock.moveCaretStart();
    }
    const createTable = (rows: number, cells: number) => {
        const manager = props.manager as BlockManager;
        const block = manager.getBlockInFocus();
        if (!block) return;
        const table = manager.createTable(rows, cells) as GridBlock;
        manager.addBlockAfter(table, block);
        const textBlock = table.blocks[0].blocks[0].blocks[0] as StandoffEditorBlock;
        manager.setBlockFocus(textBlock);
        textBlock.moveCaretStart();
    }
    const setTabName = (name: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        const tab = props.manager?.getParent(block) as TabBlock;
        if (!tab || tab.type != BlockType.TabBlock) return;
        tab.setName(name);
        const row = tab.relation.parent as TabRowBlock;
        row.renderLabels();
    }
    const addTab = (name: string) => {
        const block = props.manager?.getBlockInFocus();
        if (!block) return;
        const tab = props.manager?.getParent(block) as TabBlock;
        if (!tab || tab.type != BlockType.TabBlock) return;
        props.manager?.addTab({ tabId: tab.id, name });
    }
    const collapse = (name: string) => {
        const block = props.manager?.getBlockInFocus() as IndentedListBlock;
        if (!block || block.type != BlockType.IndentedListBlock) return;
        block.collapse();
    }
    const expand = (name: string) => {
        const block = props.manager?.getBlockInFocus() as IndentedListBlock;
        if (!block || block.type != BlockType.IndentedListBlock) return;
        block.expand();
    }
    const mergeNext= () => {
        const block = props.manager?.getBlockInFocus() as StandoffEditorBlock;
        if (!block) return;
        const next = block.relation.next;
        if (!next) return;
        props.manager?.mergeBlocks(next.id, block.id);
    }
    const split = () => {
        const block = props.manager?.getBlockInFocus() as StandoffEditorBlock;
        if (!block) return;
        const caret = block.lastCaret;
        props.manager?.splitBlock(block.id, caret.index || 0);
    }
    const swapGridCells = () => {
        const block = props.manager?.getBlockInFocus() as IBlock;
        if (!block) return;
        const row = props.manager?.getParentOfType(block, BlockType.GridRowBlock);
        if (!row) return;
        const len = row.blocks.length;
        if (len < 2) return;
        const cell = props.manager?.getParentOfType(block, BlockType.GridCellBlock) as GridCellBlock;
        const ci = row.blocks.findIndex(x => x.id == cell.id);
        if (ci == len) return;
        const left = row.blocks[ci] as GridCellBlock;
        const right = row.blocks[ci + 1] as GridCellBlock;
        props.manager?.swapCells(left, right);
    }
    const setMultiColumns = (cols: string) => {
        const block = props.manager?.getBlockInFocus();
        props.manager?.setMultiColumns(block!.id, parseInt(cols));
    }
    const explodeTabs = () => {
        const block = props.manager?.getBlockInFocus();
        props.manager?.explodeTabs(block!.id);
    }
    const testLoadDocument =(rows: string) => {
        props.manager?.testLoadDocument(parseInt(rows));
    }
    const newTabRow = () => {
        const sibling = props.manager?.getBlockInFocus();
        props.manager?.addTabRowAfter(sibling!.id);
    }
    const moveBlockUp = () => {
        const block = props.manager?.getBlockInFocus() as IBlock;
        props.manager?.moveBlockUp(block);
    }
    const moveBlockDown = () => {
        const block = props.manager?.getBlockInFocus() as IBlock;
        props.manager?.moveBlockDown(block);
    }
    const toTab = () => {
        const block = props.manager?.getBlockInFocus();
        props.manager?.convertBlockToTab(block!.id);
    }
    const runCommand = async () => {
        if (!model.command) {
            return;
        }
        const [command, ...parameters] = model.command.split(" ");
        switch (command.toLowerCase())
        {
            case "load": await load(parameters); return;
            case "save": await save(parameters); return;
            case "move-up": await moveBlockUp(); return;
            case "move-down": await moveBlockDown(); return;
            case "list-docs": await listDocuments(); return;
            case "bgimage": setBackgroundImage(parameters[0]); return;
            case "add-image": addImage(parameters[0]); return;
            case "add-image-right": addImageRight(parameters[0]); return;
            case "add-image-left": addImageLeft(parameters[0]); return;
            case "add-video": addVideo(parameters[0]); return;
            case "add-url": addIFrame(parameters[0]); return;
            case "color": setFontColour(parameters[0]); return;
            case "bgcol": setBackgroundColour(parameters[0]); return;
            case "add-table": createTable(parseInt(parameters[0]), parseInt(parameters[1])); return;
            case "add-grid": createGrid(parseInt(parameters[0]), parseInt(parameters[1])); return;
            // case "collapse": collapse(); return;
            // case "expand": expand(); return;
            case "swap": swapGridCells(); return;
            case "new-doc": createDocument(); return;
            case "cm": createCodeMirrorBlock(); return;
            case "set-tab-name": setTabName(parameters[0]); return;
            case "add-tab": addTab(parameters[0]); return;
            case "new-tab-row": newTabRow(); return;
            case "to-tab": toTab(); return;
            case "explode-tabs": explodeTabs(); return;
            case "multicols": setMultiColumns(parameters[0]); return;
            case "test-load-doc": testLoadDocument(parameters[0]); return;
            case "load-micro-doc": await loadMicroDocument(parameters); return;
            case "embed-doc": await embedDocument(parameters); return;
            case "merge-next": mergeNext(); return;
            case "split": split(); return;
            default: break;
        }
    }
    onMount(async () => {
        console.log(`---------------------- on Mount ---------------------`);
        const files = await props.manager?.listDocuments() as string[];
        const templates = await props.manager?.listTemplates() as string[];
        console.log(`---------------------- ??? ---------------------`);
        console.log(`files: ${files.join(', ')}`);
        console.log(`templates: ${templates.join(', ')}`);
        setResources("files", files);
        setResources("templates", templates);
        setModel("file", files[0]);
    })
    return (
        <div style="text-align: left;">
            <div>
                <button type="button" onClick={createNewDocumentClicked}>Create new document</button>
            </div>
            <div>
                <form onSubmit={onSubmit}>
                    <input
                        type="text"
                        value={model.command}
                        class="form-control"
                        onInput={(e) => setModel("command", e.currentTarget.value)}
                    />
                    <button type="submit" class="btn btn-default">Run</button>
                </form>
            </div>
            <hr/>
            <div>
                <select value={model.file} onInput={(e) => setModel("file", e.currentTarget.value)}>
                    <For each={resources.files}>{(file) =>
                        <option value={file}>
                            {file}
                        </option>
                    }</For>
                </select>
                <button class="form-control" onClick={loadSelectedFileClicked}>Load</button>
            </div>
            <hr/>
            <div>
                <select value={model.template} onInput={(e) => setModel("template", e.currentTarget.value)}>
                    <For each={resources.templates}>{(template) =>
                        <option value={template}>
                            {template}
                        </option>
                    }</For>
                </select>
                <button class="form-control" onClick={loadSelectedTemplateClicked}>Load</button>
            </div>
        </div>
    )
}
