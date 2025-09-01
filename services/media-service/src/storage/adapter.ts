export interface StoredFile {
  storageKey: string
  url: string
}

export interface StorageAdapter {
  store(params: { key: string; buffer: Buffer; mimeType: string }): Promise<StoredFile>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}
