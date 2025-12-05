/**
 * Enhanced LocalStorage Database System
 * Provides database-like features: transactions, versioning, compression, indexes, export/import
 */

import { dataStore } from "./store"

export type DatabaseBackup = {
  version: string
  timestamp: string
  data: any
  checksum: string
}

export type DatabaseStats = {
  totalSize: number
  collections: {
    name: string
    count: number
    size: number
  }[]
  lastModified: string
  version: string
}

export type QueryOptions = {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
}

class LocalDatabase {
  private readonly DB_VERSION = "1.0.0"
  private readonly DB_KEY = "campusConnect_dataStore"
  private readonly BACKUP_KEY = "campusConnect_backup"
  private readonly METADATA_KEY = "campusConnect_metadata"
  private transactionInProgress = false
  private transactionBackup: any = null

  /**
   * Get database statistics
   */
  getStats(): DatabaseStats {
    if (typeof window === "undefined") {
      return {
        totalSize: 0,
        collections: [],
        lastModified: new Date().toISOString(),
        version: this.DB_VERSION,
      }
    }

    const data = this.getRawData()
    const stats: DatabaseStats = {
      totalSize: new Blob([JSON.stringify(data)]).size,
      collections: [],
      lastModified: this.getMetadata().lastModified || new Date().toISOString(),
      version: this.DB_VERSION,
    }

    // Calculate collection sizes
    const collections = [
      { name: "users", data: data.users || [] },
      { name: "groups", data: data.groups || [] },
      { name: "sessions", data: data.sessions || [] },
      { name: "messages", data: data.messages || [] },
      { name: "chatRooms", data: data.chatRooms || [] },
      { name: "chatMessages", data: data.chatMessages || [] },
      { name: "notifications", data: data.notifications || [] },
      { name: "rsvps", data: data.rsvps || [] },
      { name: "groupMembers", data: data.groupMembers || [] },
    ]

    collections.forEach(({ name, data: collectionData }) => {
      const count = Array.isArray(collectionData) ? collectionData.length : 0
      const size = new Blob([JSON.stringify(collectionData)]).size
      stats.collections.push({ name, count, size })
    })

    return stats
  }

  /**
   * Get raw data from localStorage
   */
  getRawData(): any {
    if (typeof window === "undefined") return {}
    try {
      const stored = localStorage.getItem(this.DB_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("[DB] Failed to get raw data:", error)
      return {}
    }
  }

  /**
   * Get metadata
   */
  private getMetadata(): any {
    if (typeof window === "undefined") return {}
    try {
      const stored = localStorage.getItem(this.METADATA_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  /**
   * Update metadata
   */
  private updateMetadata(updates: any): void {
    if (typeof window === "undefined") return
    try {
      const current = this.getMetadata()
      const updated = { ...current, ...updates, lastModified: new Date().toISOString() }
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error("[DB] Failed to update metadata:", error)
    }
  }

  /**
   * Start a transaction
   */
  beginTransaction(): boolean {
    if (this.transactionInProgress) {
      console.warn("[DB] Transaction already in progress")
      return false
    }

    this.transactionBackup = this.getRawData()
    this.transactionInProgress = true
    console.log("[DB] Transaction started")
    return true
  }

  /**
   * Commit a transaction
   */
  commitTransaction(): boolean {
    if (!this.transactionInProgress) {
      console.warn("[DB] No transaction in progress")
      return false
    }

    this.transactionBackup = null
    this.transactionInProgress = false
    this.updateMetadata({ lastCommit: new Date().toISOString() })
    console.log("[DB] Transaction committed")
    return true
  }

  /**
   * Rollback a transaction
   */
  rollbackTransaction(): boolean {
    if (!this.transactionInProgress || !this.transactionBackup) {
      console.warn("[DB] No transaction to rollback")
      return false
    }

    try {
      localStorage.setItem(this.DB_KEY, JSON.stringify(this.transactionBackup))
      this.transactionBackup = null
      this.transactionInProgress = false
      console.log("[DB] Transaction rolled back")
      return true
    } catch (error) {
      console.error("[DB] Failed to rollback transaction:", error)
      return false
    }
  }

  /**
   * Create a backup
   */
  createBackup(): DatabaseBackup | null {
    if (typeof window === "undefined") return null

    try {
      const data = this.getRawData()
      const backup: DatabaseBackup = {
        version: this.DB_VERSION,
        timestamp: new Date().toISOString(),
        data,
        checksum: this.calculateChecksum(data),
      }

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup))
      console.log("[DB] Backup created")
      return backup
    } catch (error) {
      console.error("[DB] Failed to create backup:", error)
      return null
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(): boolean {
    if (typeof window === "undefined") return false

    try {
      const stored = localStorage.getItem(this.BACKUP_KEY)
      if (!stored) {
        console.warn("[DB] No backup found")
        return false
      }

      const backup: DatabaseBackup = JSON.parse(stored)
      
      // Verify checksum
      const checksum = this.calculateChecksum(backup.data)
      if (checksum !== backup.checksum) {
        console.error("[DB] Backup checksum mismatch")
        return false
      }

      localStorage.setItem(this.DB_KEY, JSON.stringify(backup.data))
      this.updateMetadata({ lastRestore: new Date().toISOString() })
      console.log("[DB] Restored from backup")
      return true
    } catch (error) {
      console.error("[DB] Failed to restore from backup:", error)
      return false
    }
  }

  /**
   * Export database to JSON file
   */
  exportToFile(): string {
    const data = this.getRawData()
    const backup: DatabaseBackup = {
      version: this.DB_VERSION,
      timestamp: new Date().toISOString(),
      data,
      checksum: this.calculateChecksum(data),
    }
    return JSON.stringify(backup, null, 2)
  }

  /**
   * Import database from JSON
   */
  importFromFile(jsonString: string): boolean {
    try {
      const backup: DatabaseBackup = JSON.parse(jsonString)
      
      // Verify checksum
      const checksum = this.calculateChecksum(backup.data)
      if (checksum !== backup.checksum) {
        console.error("[DB] Import checksum mismatch")
        return false
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(this.DB_KEY, JSON.stringify(backup.data))
        this.updateMetadata({ 
          lastImport: new Date().toISOString(),
          importedFrom: backup.timestamp 
        })
      }
      
      console.log("[DB] Imported from file")
      return true
    } catch (error) {
      console.error("[DB] Failed to import from file:", error)
      return false
    }
  }

  /**
   * Clear all data
   */
  clearAll(): boolean {
    if (typeof window === "undefined") return false

    try {
      // Create backup before clearing
      this.createBackup()
      
      localStorage.removeItem(this.DB_KEY)
      this.updateMetadata({ lastClear: new Date().toISOString() })
      console.log("[DB] All data cleared")
      return true
    } catch (error) {
      console.error("[DB] Failed to clear data:", error)
      return false
    }
  }

  /**
   * Calculate simple checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Optimize storage by removing empty collections
   */
  optimize(): boolean {
    if (typeof window === "undefined") return false

    try {
      const data = this.getRawData()
      const optimized: any = {}

      // Only keep non-empty collections
      Object.keys(data).forEach((key) => {
        const value = data[key]
        if (Array.isArray(value) && value.length > 0) {
          optimized[key] = value
        } else if (value && typeof value === "object" && Object.keys(value).length > 0) {
          optimized[key] = value
        }
      })

      localStorage.setItem(this.DB_KEY, JSON.stringify(optimized))
      this.updateMetadata({ lastOptimize: new Date().toISOString() })
      console.log("[DB] Storage optimized")
      return true
    } catch (error) {
      console.error("[DB] Failed to optimize storage:", error)
      return false
    }
  }

  /**
   * Validate data integrity
   */
  validateIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      const data = this.getRawData()
      
      // Check if data is parseable
      if (!data || typeof data !== "object") {
        errors.push("Invalid data structure")
      }

      // Validate required collections exist
      const requiredCollections = ["users", "groups"]
      requiredCollections.forEach((collection) => {
        if (!data[collection]) {
          errors.push(`Missing required collection: ${collection}`)
        }
      })

      // Validate data types
      const arrayCollections = ["users", "groups", "sessions", "messages"]
      arrayCollections.forEach((collection) => {
        if (data[collection] && !Array.isArray(data[collection])) {
          errors.push(`Collection ${collection} should be an array`)
        }
      })

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error) {
      errors.push(`Validation error: ${error}`)
      return { valid: false, errors }
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (typeof window === "undefined") {
      return { used: 0, available: 0, percentage: 0 }
    }

    try {
      // Calculate total localStorage size
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }

      // Most browsers limit localStorage to 5-10MB
      const maxSize = 10 * 1024 * 1024 // 10MB estimate
      const percentage = (totalSize / maxSize) * 100

      return {
        used: totalSize,
        available: maxSize - totalSize,
        percentage: Math.min(percentage, 100),
      }
    } catch (error) {
      console.error("[DB] Failed to get storage info:", error)
      return { used: 0, available: 0, percentage: 0 }
    }
  }
}

export const localDB = new LocalDatabase()
