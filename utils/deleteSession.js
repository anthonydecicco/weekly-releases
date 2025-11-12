const db = require('./db');
const logger = require('./logger');

const client = db.client;
const database = db.db;
const collection = database.collection(process.env.DATABASE_COLLECTION_SESSIONS);

async function deleteSession(userId) {
    if (userId) {
        const filterSession = { "session.userId": userId }
        
        try {
            await client.connect();
            const result = await collection.deleteMany(filterSession);

            if (result) {
                const deletedCount = result.deletedCount;
                return deletedCount;
            } else {
                logger.info("No session found using that id, no data deleted.")
            } 
        } catch (error) {
            logger.error(`Error deleting user's session, userId submitted: ${userId}`);
        } finally {
            await client.close();
        }
    } else {
        logger.info(`No session deleted. userId =  ${userId}`);
    }
}

module.exports = {
    deleteSession,
}