/**
 * YiSA-S Agent Sistemi — BaseAgent
 * Tum robotlarin temel sinifi
 * CELF, Veri, Guvenlik, YiSA-S agentlari bu sinifi extend eder
 */

export type AgentStatus = "aktif" | "pasif" | "beklemede" | "hata"

export interface AgentTask {
  id: string
  description: string
  status: "bekliyor" | "calisiyor" | "tamamlandi" | "hata"
  createdAt: Date
  completedAt?: Date
  result?: string
}

export interface AgentConfig {
  name: string
  description: string
  version: string
  maxConcurrentTasks: number
}

export abstract class BaseAgent {
  readonly name: string
  readonly description: string
  readonly version: string
  protected _status: AgentStatus
  protected _lastTask: string
  protected _tasks: AgentTask[]
  protected _maxConcurrentTasks: number

  constructor(config: AgentConfig) {
    this.name = config.name
    this.description = config.description
    this.version = config.version
    this._status = "pasif"
    this._lastTask = "Henuz gorev yok"
    this._tasks = []
    this._maxConcurrentTasks = config.maxConcurrentTasks
  }

  get status(): AgentStatus {
    return this._status
  }

  get lastTask(): string {
    return this._lastTask
  }

  get tasks(): AgentTask[] {
    return [...this._tasks]
  }

  get activeTasks(): AgentTask[] {
    return this._tasks.filter((t) => t.status === "calisiyor")
  }

  /** Agent'i aktif hale getir */
  activate(): void {
    this._status = "aktif"
  }

  /** Agent'i pasif hale getir */
  deactivate(): void {
    this._status = "pasif"
  }

  /** Gorev ekle ve calistir */
  async addTask(description: string): Promise<AgentTask> {
    const task: AgentTask = {
      id: `${this.name}-${Date.now()}`,
      description,
      status: "bekliyor",
      createdAt: new Date(),
    }

    this._tasks.push(task)

    if (this.activeTasks.length < this._maxConcurrentTasks) {
      task.status = "calisiyor"
      this._status = "aktif"

      try {
        const result = await this.execute(task)
        task.status = "tamamlandi"
        task.completedAt = new Date()
        task.result = result
        this._lastTask = `${description} — tamamlandi`
      } catch (error) {
        task.status = "hata"
        task.result = error instanceof Error ? error.message : "Bilinmeyen hata"
        this._lastTask = `${description} — hata`
        this._status = "hata"
      }
    }

    // Aktif gorev kalmadiysa beklemede yap
    if (this.activeTasks.length === 0 && this._status === "aktif") {
      this._status = "beklemede"
    }

    return task
  }

  /** Her agent kendi execute fonksiyonunu implement eder */
  abstract execute(task: AgentTask): Promise<string>

  /** Agent durumu ozeti */
  getSummary(): {
    name: string
    status: AgentStatus
    lastTask: string
    totalTasks: number
    completedTasks: number
    failedTasks: number
  } {
    return {
      name: this.name,
      status: this._status,
      lastTask: this._lastTask,
      totalTasks: this._tasks.length,
      completedTasks: this._tasks.filter((t) => t.status === "tamamlandi").length,
      failedTasks: this._tasks.filter((t) => t.status === "hata").length,
    }
  }
}
