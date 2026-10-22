import { EventEmitter } from 'node:events'

export const TASK_CREATED_EVENT = 'task:created'
export const taskEventEmitter = new EventEmitter()
export const taskEventMetrics = {
  emitted: 0,
  processed: 0,
  pending: 0,
  failed: 0,
}

export function emitTaskCreated(activity) {
  taskEventMetrics.emitted += 1
  taskEventEmitter.emit(TASK_CREATED_EVENT, activity)
}
