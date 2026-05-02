import { useAuthStore } from '@/stores/authStore'
import * as signalR from '@microsoft/signalr'

/**
 * Service for managing the SignalR connection, including starting the connection,
 * handling reconnection, and providing methods to listen for events and send messages.
 */
class SignalRService {
  connection: signalR.HubConnection | null
  started: boolean

  constructor() {
    this.connection = null
    this.started = false
  }

  /**
   * Start the SignalR connection. This will attempt to connect to the server,
   * and will automatically reconnect if the connection is lost. The access token
   * from the auth store is used for authentication with the server.
   */
  async startAsync() {
    if (this.started) return
    const authStore = useAuthStore()

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/hub', {
        accessTokenFactory: () => authStore.token || '',
      })
      .withAutomaticReconnect()
      .build()

    try {
      await this.connection.start()
      this.started = true
      console.log('SignalR connected')
    } catch (err) {
      console.error('SignalR connection error:', err)
      setTimeout(() => this.startAsync(), 2000)
    }
  }

  /**
   * Listen for a SignalR event
   * @param event SignalR event name
   * @param callback Code to execute
   */
  on(event: string, callback: any) {
    this.connection?.on(event, callback)
  }

  async sendAsync(method: string, ...args: any) {
    try {
      await this.connection?.invoke(method, ...args)
    } catch (err) {
      console.error(`Error sending ${method}:`, err)
    }
  }
}

export const signalRService = new SignalRService()
