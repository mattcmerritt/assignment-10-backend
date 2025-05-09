import { promises as fs } from 'fs'

export async function loadJsonFromFile<T>(filePath: string): Promise<T> {
    const jsonData = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(jsonData) as T
}

export async function writeFile(filePath: string, data: string) {
    await fs.writeFile(filePath, data)
}