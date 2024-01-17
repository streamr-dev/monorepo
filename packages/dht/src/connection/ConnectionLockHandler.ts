// Connection locks are independent of the existence of connections
// that is why this class is needed

import { DhtAddress } from '../identifiers'

export type LockID = string

export class ConnectionLockHandler {

    private localLocks: Map<DhtAddress, Set<LockID>> = new Map()
    private remoteLocks: Map<DhtAddress, Set<LockID>> = new Map()
    // TODO: remove weakLocks use localLocks instead. When opening weakLocks from the ConnectioManager,
    // simply do not send lock requests.
    private weakLocks: Set<DhtAddress> = new Set()

    public getLocalLockedConnectionCount(): number {
        return this.localLocks.size
    }

    public getRemoteLockedConnectionCount(): number {
        return this.remoteLocks.size
    }

    public getWeakLockedConnectionCount(): number {
        return this.weakLocks.size
    }

    public isLocalLocked(id: DhtAddress, lockId?: LockID): boolean {
        if (lockId === undefined) {
            return this.localLocks.has(id)
        } else {
            return this.localLocks.has(id) && this.localLocks.get(id)!.has(lockId)
        }
    }

    public isRemoteLocked(id: DhtAddress, lockId?: LockID): boolean {
        if (lockId === undefined) {
            return this.remoteLocks.has(id)
        } else {
            if (this.remoteLocks.has(id) && this.remoteLocks.get(id)!.has(lockId)) {
                return true
            } else {
                return false
            }
        }
    }

    private isWeakLocked(id: DhtAddress): boolean {
        return this.weakLocks.has(id)
    }

    public isLocked(id: DhtAddress): boolean {
        return (this.isLocalLocked(id) || this.isRemoteLocked(id) || this.isWeakLocked(id))
    }

    public addLocalLocked(id: DhtAddress, lockId: LockID): void {
        if (!this.localLocks.has(id)) {
            this.localLocks.set(id, new Set())
        }
        this.localLocks.get(id)!.add(lockId)
    }

    public addRemoteLocked(id: DhtAddress, lockId: LockID): void {
        if (!this.remoteLocks.has(id)) {
            this.remoteLocks.set(id, new Set())
        }
        this.remoteLocks.get(id)!.add(lockId)
    }

    public addWeakLocked(id: DhtAddress): void {
        this.weakLocks.add(id)
    }

    public removeLocalLocked(id: DhtAddress, lockId: LockID): void {
        if (this.localLocks.has(id)) {
            this.localLocks.get(id)?.delete(lockId)
            if (this.localLocks.get(id)?.size === 0) {
                this.localLocks.delete(id)
            }
        }
    }

    public removeRemoteLocked(id: DhtAddress, lockId: LockID): void {
        if (this.remoteLocks.has(id)) {
            this.remoteLocks.get(id)?.delete(lockId)
            if (this.remoteLocks.get(id)?.size === 0) {
                this.remoteLocks.delete(id)
            }
        }
    }

    public removeWeakLocked(id: DhtAddress): void {
        this.weakLocks.delete(id)
    }

    public clearAllLocks(id: DhtAddress): void {
        this.localLocks.delete(id)
        this.remoteLocks.delete(id)
        this.weakLocks.delete(id)
    }

    public clear(): void {
        this.localLocks.clear()
        this.remoteLocks.clear()
        this.weakLocks.clear()
    }
}