import { loadJsonFromFile, writeFile } from './utils'
export interface User {
  id: number
  username: string
  passwordHash: string
}

export async function getUserByCredentials(username: string, passwordHash: string): Promise<User | null> {
    const users = await loadJsonFromFile<User[]>('./data-store/users.json')
    const user = users.find(user => user.username === username && user.passwordHash === passwordHash)
    if (!user) {
      return null
    }
    return user
}

export async function getUserById(id: number): Promise<User | null> {
    const users = await loadJsonFromFile<User[]>('./data-store/users.json')
    const user = users.find(user => user.id === id)
    if (!user) {
      return null
    }
    return user
}