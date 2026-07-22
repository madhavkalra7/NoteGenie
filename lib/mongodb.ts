import mongoose from 'mongoose'
import dns from 'dns'

// Fix Node.js Windows DNS SRV lookup issue for MongoDB Atlas (+srv)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (err) {
  console.warn('Could not set custom DNS servers:', err)
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env or .env.local')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (MONGODB_URI?.includes('<db_password>')) {
    throw new Error('MongoDB Password Missing: Please replace <db_password> in your .env / .env.local file with your actual MongoDB Atlas cluster password.')
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    }

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
      console.log('🟢 Successfully connected to MongoDB Atlas!')
      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e: any) {
    cached.promise = null
    console.error('🔴 MongoDB Connection Error Details:', e)
    
    if (e.message?.includes('bad auth') || e.message?.includes('Authentication failed')) {
      throw new Error('MongoDB Auth Failed: Password or username is incorrect in .env / .env.local.')
    }
    
    if (e.message?.includes('ECONNREFUSED') || e.message?.includes('querySrv')) {
      throw new Error(`MongoDB Connection Failed: ${e.message}`)
    }
    
    throw e
  }

  return cached.conn
}

export default connectToDatabase
