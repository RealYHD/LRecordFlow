import { Client, type ConnectConfig } from 'ssh2'
import { SshConnectionDetails } from '../../common/types/models'
import { readFile } from 'fs/promises'

export interface ShellOutput {
  stdout: string[]
  stderr: string[]
  code: number
  signal: number
}

export interface ShellExecutor {
  execute(command: string): Promise<ShellOutput>
}

export class SshShellExecutor implements ShellExecutor {
  sshConnectionDetails: SshConnectionDetails
  /**
   *
   */
  constructor(connectionDetails: SshConnectionDetails) {
    this.sshConnectionDetails = connectionDetails
  }
  async execute(command: string): Promise<ShellOutput> {
    const client: Client = new Client()
    const connectionConfig: ConnectConfig = {
      host: this.sshConnectionDetails.host,
      port: this.sshConnectionDetails.port,
      username: this.sshConnectionDetails.username
    }
    if (this.sshConnectionDetails.privateKeyPath) {
      connectionConfig.privateKey = await readFile(this.sshConnectionDetails.privateKeyPath)
    } else if (this.sshConnectionDetails.password) {
      connectionConfig.password = this.sshConnectionDetails.password
    } else {
      throw new Error('Neither private key nor password provided.')
    }
    return new Promise((resolve, reject) => {
      const stdout: string[] = []
      const stderr: string[] = []
      client.once('ready', () => {
        client.exec(command, (err, stream) => {
          if (err) {
            reject(err)
          }
          stream.on('close', (code, signal) => {
            resolve({
              stdout,
              stderr,
              code,
              signal
            })
          })
          stream.on('data', (data) => {
            stdout.push(data)
          })
          stream.stderr.on('data', (data) => {
            stderr.push(data)
          })
        })
      })
      client.connect(connectionConfig)
    })
  }
}
