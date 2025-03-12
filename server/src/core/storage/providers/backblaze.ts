export class BackblazeStorage {
  static async uploadAudio(file: any): Promise<{ url: string, key: string }> {
    return { 
      url: 'https://example.com/placeholder-url', 
      key: 'placeholder-key' 
    };
  }

  static async getStorageUsage(): Promise<{ used: number, total: number }> {
    return { 
      used: 0, 
      total: 1000 
    };
  }
}
