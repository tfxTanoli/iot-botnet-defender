import {
  ref,
  push,
  update,
  get,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database"
import { database } from "./firebase"

/**
 * Realtime Database data-access layer.
 *
 * Data is stored per-user under `users/{uid}/{collection}` so that the security
 * rules (see database.rules.json) can restrict every user to their own subtree.
 * Each record carries a numeric `created_at` (epoch ms) used for ordering.
 */

export type Collection =
  | "botnet_results"
  | "traffic_overview"
  | "activity_history"
  | "datasets"
  | "active_threats"

export type BotnetResult = {
  id: string
  ip: string
  prediction: string
  confidence: number
  created_at: number
}

export type TrafficOverview = {
  id: string
  name: string
  normal: number
  attacks: number
  created_at: number
}

export type ActivityHistory = {
  id: string
  action: string
  details: string
  device_type?: string
  ip_address?: string
  created_at: number
}

export type Dataset = {
  id: string
  filename: string
  size_bytes: number
  created_at: number
}

const userCollectionPath = (uid: string, collection: Collection) =>
  `users/${uid}/${collection}`

type RecordWithId = { id: string } & Record<string, unknown>

function snapshotToArray(value: Record<string, unknown> | null): RecordWithId[] {
  if (!value) return []
  return Object.entries(value).map(([id, record]) => ({
    id,
    ...(record as Record<string, unknown>),
  }))
}

/** Insert a single record. `created_at` is set automatically. */
export async function addRecord(
  uid: string,
  collection: Collection,
  data: Record<string, unknown>,
): Promise<void> {
  await push(ref(database, userCollectionPath(uid, collection)), {
    ...data,
    created_at: Date.now(),
  })
}

/**
 * Insert many records in a single atomic write.
 *
 * Push keys are generated client-side (no network call) and all rows are sent
 * in one `update()` request instead of one request per row — critical for
 * large result sets (e.g. thousands of detection rows).
 */
export async function addRecords(
  uid: string,
  collection: Collection,
  rows: Record<string, unknown>[],
): Promise<void> {
  if (rows.length === 0) return

  const collectionRef = ref(database, userCollectionPath(uid, collection))
  const now = Date.now()
  const updates: Record<string, unknown> = {}

  for (const row of rows) {
    // push() without a value only generates a unique key locally.
    const key = push(collectionRef).key as string
    updates[key] = { ...row, created_at: now }
  }

  await update(collectionRef, updates)
}

/** Fetch every record in a collection for the user. */
export async function getAll<T extends { id: string }>(
  uid: string,
  collection: Collection,
): Promise<T[]> {
  const snapshot = await get(ref(database, userCollectionPath(uid, collection)))
  return snapshotToArray(snapshot.val()) as T[]
}

/** Fetch the most recent `count` records ordered by `created_at`. */
export async function getLatest<T extends { id: string }>(
  uid: string,
  collection: Collection,
  count: number,
): Promise<T[]> {
  const recordsQuery = query(
    ref(database, userCollectionPath(uid, collection)),
    orderByChild("created_at"),
    limitToLast(count),
  )
  const snapshot = await get(recordsQuery)
  return snapshotToArray(snapshot.val()) as T[]
}
