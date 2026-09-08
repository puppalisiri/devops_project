const db = require('./config/db');

function runMigration() {
    return new Promise((resolve, reject) => {
        console.log('Starting DB Migration...');
        
        // 1. Describe blogs table to check existing columns
        db.query('DESCRIBE blogs', (err, columns) => {
            if (err) {
                console.error('Error describing blogs table:', err);
                return reject(err);
            }
            
            const existingColumns = columns.map(c => c.Field);
            const alterQueries = [];
            
            if (!existingColumns.includes('category')) {
                alterQueries.push("ALTER TABLE blogs ADD COLUMN category VARCHAR(100) DEFAULT 'Historical Places'");
            }
            if (!existingColumns.includes('image_url')) {
                alterQueries.push("ALTER TABLE blogs ADD COLUMN image_url VARCHAR(255) DEFAULT NULL");
            }
            if (!existingColumns.includes('user_id')) {
                alterQueries.push("ALTER TABLE blogs ADD COLUMN user_id INT DEFAULT NULL");
            }
            if (!existingColumns.includes('created_at')) {
                alterQueries.push("ALTER TABLE blogs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            }
            
            const runAlterQueries = (index) => {
                if (index >= alterQueries.length) {
                    return createLikesTable();
                }
                
                const query = alterQueries[index];
                console.log(`Running: ${query}`);
                db.query(query, (err) => {
                    if (err) {
                        console.error(`Error running alter query "${query}":`, err);
                        return reject(err);
                    }
                    runAlterQueries(index + 1);
                });
            };
            
            const createLikesTable = () => {
                const sql = `
                CREATE TABLE IF NOT EXISTS likes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    blog_id INT NOT NULL,
                    user_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_like (blog_id, user_id),
                    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                `;
                console.log('Running: Creating likes table (if not exists)...');
                db.query(sql, (err) => {
                    if (err) {
                        console.error('Error creating likes table:', err);
                        return reject(err);
                    }
                    createCommentsTable();
                });
            };
            
            const createCommentsTable = () => {
                const sql = `
                CREATE TABLE IF NOT EXISTS comments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    blog_id INT NOT NULL,
                    user_id INT NOT NULL,
                    comment_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) DEFAULT 'approved',
                    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
                `;
                console.log('Running: Creating comments table (if not exists)...');
                db.query(sql, (err) => {
                    if (err) {
                        console.error('Error creating comments table:', err);
                        return reject(err);
                    }
                    
                    // Check if 'status' column exists in case the table was created before
                    db.query('DESCRIBE comments', (errDesc, columns) => {
                        if (errDesc) {
                            console.error('Error describing comments table:', errDesc);
                            return reject(errDesc);
                        }
                        const existingColumns = columns.map(c => c.Field);
                        if (!existingColumns.includes('status')) {
                            const alterSql = "ALTER TABLE comments ADD COLUMN status VARCHAR(20) DEFAULT 'approved'";
                            console.log(`Running: ${alterSql}`);
                            db.query(alterSql, (errAlter) => {
                                if (errAlter) {
                                    console.error('Error adding status column to comments:', errAlter);
                                    return reject(errAlter);
                                }
                                console.log('DB Migration completed successfully.');
                                resolve();
                            });
                        } else {
                            console.log('DB Migration completed successfully.');
                            resolve();
                        }
                    });
                });
            };
            
            runAlterQueries(0);
        });
    });
}

// If run directly
if (require.main === module) {
    runMigration().then(() => {
        db.end();
        process.exit(0);
    }).catch(err => {
        db.end();
        process.exit(1);
    });
}

module.exports = runMigration;
