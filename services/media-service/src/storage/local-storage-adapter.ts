import fs from 'fs/promises'
import path from 'path'
import { StorageAdapter, StoredFile } from './adapter'

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private rootDir: string,
    private baseUrl: string
  ) {}

  async store(params: { key: string; buffer: Buffer; mimeType: string }): Promise<StoredFile> {
    const fullPath = path.join(this.rootDir, params.key)
    const dir = path.dirname(fullPath)
    
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(fullPath, params.buffer)
    
    const url = `${this.baseUrl}/${params.key}`
    
    return {
      storageKey: params.key,
      url
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.rootDir, key)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }
}
