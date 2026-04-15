export type StorageConfig = {
  endpoint: string
  accessKey: string
  secretKey: string
  bucket: string
  region: string
  publicUrl: string
}

export type StorageClient = {
  uploadFile(params: {
    key: string
    body: Uint8Array
    contentType: string
    contentLength?: number
  }): Promise<{ url: string }>
}
