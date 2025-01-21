import { WebContainer, FileSystemTree } from '@webcontainer/api'
import { useState, useEffect, useRef } from 'react'

// Define proper type for server process
interface ServerProcess {
  kill: () => void
  output: ReadableStream<string>
  exit: Promise<number>
}

class WebContainerInstance {
  private static instance: WebContainer | null = null
  private static isBooting = false
  private static bootPromise: Promise<WebContainer> | null = null
  private static activeProcesses: ServerProcess[] = []

  static async getInstance(): Promise<WebContainer> {
    if (this.instance) return this.instance

    if (this.bootPromise) return this.bootPromise

    this.bootPromise = WebContainer.boot()
    try {
      this.instance = await this.bootPromise
      return this.instance
    } finally {
      this.bootPromise = null
    }
  }

  static teardown() {
    // Kill all active processes first
    this.activeProcesses.forEach((process) => {
      try {
        process.kill()
      } catch (e) {
        console.error('Error killing process:', e)
      }
    })
    this.activeProcesses = []

    // Then teardown the instance
    if (this.instance) {
      this.instance.teardown()
      this.instance = null
    }
  }

  static addProcess(process: ServerProcess) {
    this.activeProcesses.push(process)
  }

  static removeProcess(process: ServerProcess) {
    const index = this.activeProcesses.indexOf(process)
    if (index > -1) {
      this.activeProcesses.splice(index, 1)
    }
  }
}

function convertFilesToFileSystemTree(
  files: Record<string, string>
): FileSystemTree {
  const tree: FileSystemTree = {}

  for (const [path, content] of Object.entries(files)) {
    tree[path] = { file: { contents: content } }
  }

  return tree
}

export function useWebContainer() {
  const [iframeUrl, setIframeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const instanceRef = useRef<WebContainer | null>(null)
  const serverProcessRef = useRef<ServerProcess | null>(null)

  console.log('iframeUrl hook', iframeUrl)

  useEffect(() => {
    async function bootWebContainer() {
      try {
        const instance = await WebContainerInstance.getInstance()
        instanceRef.current = instance
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to boot WebContainer:', error)
        setIsLoading(false)
      }
    }

    bootWebContainer()

    return () => {
      if (serverProcessRef.current) {
        WebContainerInstance.removeProcess(serverProcessRef.current)
        serverProcessRef.current.kill()
        serverProcessRef.current = null
      }
      setIframeUrl('')
    }
  }, [])

  async function runCode(files: Record<string, string>) {
    if (!instanceRef.current) return

    // Kill previous server if running
    if (serverProcessRef.current) {
      WebContainerInstance.removeProcess(serverProcessRef.current)
      serverProcessRef.current.kill()
      serverProcessRef.current = null
    }

    try {
      await instanceRef.current.mount(convertFilesToFileSystemTree(files))

      const installProcess = await instanceRef.current.spawn('npm', ['install'])
      const installExitCode = await installProcess.exit

      if (installExitCode !== 0) {
        throw new Error('Installation failed')
      }

      // Listen for server-ready before starting the server
      instanceRef.current.on('server-ready', (port, url) => {
        console.log('Server ready on:', url)
        setIframeUrl(url)
      })

      const serverProcess = await instanceRef.current.spawn(
        'npm',
        ['run', 'dev'],
        {
          env: {
            VITE_ALLOW_ORIGIN: '*',
          },
        }
      )
      serverProcessRef.current = serverProcess
      WebContainerInstance.addProcess(serverProcess)

      // Just log output without waiting
      serverProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log('Server output:', chunk)
          },
        })
      )
    } catch (error) {
      console.error('Error running code:', error)
    }
  }

  return { runCode, iframeUrl, isLoading }
}

