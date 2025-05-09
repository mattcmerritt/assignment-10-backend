import { loadJsonFromFile, writeFile } from "./utils";

export interface Entry {
    id: number
    userId: number
    completed: boolean
    content: string 
}

export async function getEntriesByUserId(id: number): Promise<Entry[]> {
    const entries = await loadJsonFromFile<Entry[]>('./data-store/items.json');
    entries.sort((a, b) => a.id - b.id);
    const entriesByUser = entries.filter(entry => entry.userId === id);
    return entriesByUser;
}

export async function addEntryToList(userId: number, content: string): Promise<void> {
    const entries = await loadJsonFromFile<Entry[]>('./data-store/items.json');
    entries.sort((a, b) => a.id - b.id);
    const highestId : number = entries.reduce((maximumId, currentEntry) => Math.max(maximumId, currentEntry['id']), 0);
    const newEntry = {
        id: highestId + 1,
        userId: userId,
        completed: false,
        content: content
    };
    entries.push(newEntry);
    entries.sort((a, b) => a.id - b.id);
    await writeFile('./data-store/items.json', JSON.stringify(entries, null, '\t'));
    return;
}

export async function updateEntryCompletion(id: number, completed: boolean): Promise<void> {
    const entries = await loadJsonFromFile<Entry[]>('./data-store/items.json');
    entries.sort((a, b) => a.id - b.id);
    const entry = entries.find((e) => e.id === id);
    entry!.completed = completed;
    await writeFile('./data-store/items.json', JSON.stringify(entries, null, '\t'));
    return;
}