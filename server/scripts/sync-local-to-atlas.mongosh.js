/* global Mongo, db, process, print, quit */

const localUri = String(process.env.MONGODB_URI_LOCAL || '').trim()
const mode = String(process.env.EDW_SYNC_MODE || 'dry-run').trim().toLowerCase()
const confirmation = String(process.env.EDW_SYNC_CONFIRM || '')

if (!/^mongodb:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//i.test(localUri)) {
  throw new Error('MONGODB_URI_LOCAL must point to a named local MongoDB database')
}
if (!['dry-run', 'apply'].includes(mode)) throw new Error('EDW_SYNC_MODE must be dry-run or apply')
if (mode === 'apply' && confirmation !== 'SYNC_LOCAL_TO_ATLAS') {
  throw new Error('Set EDW_SYNC_CONFIRM=SYNC_LOCAL_TO_ATLAS before applying the migration')
}

const collections = [
  'users',
  'categories',
  'products',
  'sitesettings',
  'banners',
  'orders',
  'customorders',
  'reviews',
  'notifications',
  'userdeletionlogs',
  'carts',
  'wishlists',
  'counters',
]

const localConnection = new Mongo(localUri)
const localDatabaseName = localUri.split('?')[0].split('/').at(-1)
const localDatabase = localConnection.getDB(localDatabaseName)
const atlasDatabase = db
const localUsers = new Set(localDatabase.users.find({}, { projection: { _id: 1 } }).toArray().map((item) => String(item._id)))

const sourceDocuments = new Map()
for (const collectionName of collections) {
  const documents = localDatabase.getCollection(collectionName).find({}).toArray()
  const eligible = ['carts', 'wishlists'].includes(collectionName)
    ? documents.filter((document) => document.user && localUsers.has(String(document.user)))
    : documents
  sourceDocuments.set(collectionName, eligible)
  print(`${collectionName}: local=${documents.length}, eligible=${eligible.length}, atlas=${atlasDatabase.getCollection(collectionName).countDocuments({})}`)
}

const nestedValue = (document, dottedPath) => dottedPath.split('.').reduce((value, key) => value?.[key], document)
const conflicts = []

for (const collectionName of collections) {
  const localCollection = localDatabase.getCollection(collectionName)
  const atlasCollection = atlasDatabase.getCollection(collectionName)
  const uniqueIndexes = localCollection.getIndexes().filter((index) => index.unique && index.name !== '_id_')
  for (const document of sourceDocuments.get(collectionName)) {
    for (const index of uniqueIndexes) {
      const filter = {}
      let complete = true
      for (const field of Object.keys(index.key)) {
        const value = nestedValue(document, field)
        if (value === undefined || value === null || value === '') {
          complete = false
          break
        }
        filter[field] = value
      }
      if (!complete) continue
      const existing = atlasCollection.findOne(filter, { projection: { _id: 1 } })
      if (existing && String(existing._id) !== String(document._id)) conflicts.push({ collection: collectionName, index: index.name })
    }
  }
}

if (conflicts.length) {
  print(`ABORTED: ${conflicts.length} unique-key conflict(s) detected.`)
  for (const conflict of conflicts) print(`${conflict.collection}: ${conflict.index}`)
  quit(2)
}

if (mode === 'dry-run') {
  print('Dry run passed. No Atlas data was changed.')
  quit(0)
}

const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
const backupName = `edw_backup_${timestamp.slice(0, 14)}`
const backupDatabase = atlasDatabase.getSiblingDB(backupName)

for (const collectionName of atlasDatabase.getCollectionNames()) {
  const documents = atlasDatabase.getCollection(collectionName).find({}).toArray()
  try { backupDatabase.createCollection(collectionName) } catch {}
  if (documents.length) backupDatabase.getCollection(collectionName).insertMany(documents, { ordered: false })
}
print(`Atlas backup created: ${backupName}`)

for (const collectionName of collections) {
  const documents = sourceDocuments.get(collectionName)
  if (!documents.length) continue
  const operations = documents.map((document) => ({
    replaceOne: { filter: { _id: document._id }, replacement: document, upsert: true },
  }))
  const result = atlasDatabase.getCollection(collectionName).bulkWrite(operations, { ordered: true })
  print(`${collectionName}: matched=${result.matchedCount}, modified=${result.modifiedCount}, inserted=${result.upsertedCount}`)
}

let missing = 0
for (const collectionName of collections) {
  const ids = sourceDocuments.get(collectionName).map((document) => document._id)
  if (!ids.length) continue
  const synced = atlasDatabase.getCollection(collectionName).countDocuments({ _id: { $in: ids } })
  missing += ids.length - synced
}

if (missing) throw new Error(`Atlas verification failed: ${missing} local record(s) are missing`)
print('Atlas sync completed and verified successfully.')
