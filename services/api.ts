import { API_BASE_URL } from '../constants';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async sendOTP(phoneNumber: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  async registerUser(userData: {
    phoneNumber: string;
    name: string;
    avatar?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getChats() {
    return this.request('/chats');
  }

  async getChatMessages(chatId: string) {
    return this.request(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId: string, message: any) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async createChat(participants: string[], isGroup: boolean, name?: string) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify({ participants, isGroup, name }),
    });
  }

  async getContacts() {
    return this.request('/contacts');
  }

  async syncContacts(contacts: any[]) {
    return this.request('/contacts/sync', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  async uploadFile(blob: Blob, type: string) {
    const formData = new FormData();
    formData.append('file', {
      uri: '',
      name: 'encrypted.bin',
      type: 'application/octet-stream',
    } as any);

    formData.append('type', type);

    const uploadResponse = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload fallito');
    }

    return await uploadResponse.json();
  }
}

export const apiService = new ApiService(API_BASE_URL);