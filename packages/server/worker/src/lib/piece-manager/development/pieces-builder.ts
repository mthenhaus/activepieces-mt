import { spawn } from 'child_process'
import { Server } from 'http'
import path, { resolve } from 'path'
import { ApLock, filePiecesUtils, memoryLock, PiecesSource } from '@activepieces/server-shared'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { cacheHandler } from '../../utils/cache-handler'

export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

const globalCachePath = path.resolve('cache')

enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}

async function handleFileChange(packages: string[], pieceProjectName: string, piecePackageName: string, io: Server, log: FastifyBaseLogger): Promise<void> {
    log.info(
        chalk.blueBright.bold(
            '👀 Detected changes in pieces. Waiting... 👀 ' + pieceProjectName,
        ),
    )
    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        log.info(chalk.blue.bold('🤌 Building pieces... 🤌'))
        if (!/^[A-Za-z0-9-]+$/.test(pieceProjectName)) {
            throw new Error(`Piece package name contains invalid character: ${pieceProjectName}`)
        }
        const cmd = `npx nx run-many -t build --projects=${pieceProjectName}`
        await runCommandWithLiveOutput(cmd)
        await filePiecesUtils(packages, log).clearPieceCache(piecePackageName)
        
        const cache = cacheHandler(globalCachePath)
        await cache.setCache('@activepieces/pieces-framework', CacheState.PENDING)
        await cache.setCache('@activepieces/pieces-common', CacheState.PENDING)
        await cache.setCache('@activepieces/shared', CacheState.PENDING)
        await cache.setCache(piecePackageName, CacheState.PENDING)

        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        log.info(error, chalk.red.bold('Failed to run build process...'))
    }
    finally {
        if (lock) {
            await lock.release()
        }
        log.info(
            chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨',
            ),
        )
    }
}

async function runCommandWithLiveOutput(cmd: string): Promise<void> {
    const [command, ...args] = cmd.split(' ')

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', shell: true })

        child.on('error', reject)
        child.on('close', code => {
            if (code === 0) {
                resolve()
            }
            else {
                reject(new Error(`Process exited with code ${code}`))
            }
        })
    })
}

export async function piecesBuilder(app: FastifyInstance, io: Server, packages: string[], piecesSource: PiecesSource): Promise<void> {
    // DISABLED - MET
    return
}
