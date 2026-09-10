const db = require('./config/db');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateCommentMiddleware } = require('./middleware/commentValidator');

// Run database migrations on startup
const runMigration = require('./migrate');
runMigration().catch(err => {
    console.error("Auto DB migration failed:", err);
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)!'));
        }
    }
});

// Multer Specific Upload Middlewares
const handleAddBlogUpload = (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            return res.render('addBlog', { error: err.message, success: null });
        }
        next();
    });
};

const handleAdminEditBlogUpload = (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            const blogId = req.params.id;
            db.query("SELECT * FROM blogs WHERE id = ?", [blogId], (err2, result2) => {
                return res.render('editBlog', { error: err.message, success: null, blog: result2 ? result2[0] : null });
            });
            return;
        }
        next();
    });
};

const handleUserEditBlogUpload = (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            const blogId = req.params.id;
            db.query("SELECT * FROM blogs WHERE id = ?", [blogId], (err2, result2) => {
                return res.render('editBlogUser', { error: err.message, success: null, blog: result2 ? result2[0] : null });
            });
            return;
        }
        next();
    });
};

// Category badge color helper function
const getCategoryColor = (cat) => {
    switch (cat) {
        case 'Historical Places': return 'bg-secondary text-white';
        case 'Temples': return 'bg-danger text-white';
        case 'Waterfalls': return 'bg-primary text-white';
        case 'Wildlife': return 'bg-success text-white';
        case 'Adventure': return 'bg-dark text-white';
        case 'Cultural Heritage': return 'bg-warning text-dark';
        case 'Nature Tourism': return 'bg-info text-dark';
        default: return 'bg-light text-dark';
    }
};

const app = express();

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session Middleware
app.use(session({
    secret: 'telangana_tourism_secret',
    resave: false,
    saveUninitialized: false
}));

// Pass user session and helper functions to all EJS views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.getCategoryColor = getCategoryColor;
    next();
});

// Middleware to protect routes (require login)
const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Middleware to protect admin routes
const requireAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.redirect('/login');
    }
    next();
};

app.get('/', (req, res) => {
    const recentSql = `
        SELECT b.*, 
               (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS likes_count
        FROM blogs b
        ORDER BY b.created_at DESC
        LIMIT 3
    `;
    db.query(recentSql, (err, result) => {
        if (err) {
            console.log(err);
            res.render('index', { recentBlogs: [] });
        } else {
            res.render('index', { recentBlogs: result });
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.render('register', { error: 'Database Error.', success: null });
        }
        if (results.length > 0) {
            return res.render('register', { error: 'Email already exists. Please login.', success: null });
        }

        const sql = `
        INSERT INTO users(name, email, password)
        VALUES (?, ?, ?)
        `;

        db.query(sql, [name, email, password], (err, result) => {
            if (err) {
                console.log(err);
                res.render('register', { error: 'Database Error.', success: null });
            } else {
                res.render('login', { error: null, success: 'User Registered Successfully. Please Login.' });
            }
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null, success: null });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const emailCheckSql = "SELECT * FROM users WHERE email = ?";
    db.query(emailCheckSql, [email], (err, emailResult) => {
        if (err) {
            console.log(err);
            res.render('login', { error: 'Database Error', success: null });
        } else if (emailResult.length === 0) {
            res.render('login', { error: 'User not registered. Please register first.', success: null });
        } else {
            const user = emailResult.find(u => u.password === password);
            if (user) {
                req.session.user = user;
                res.redirect('/blogs');
            } else {
                res.render('login', { error: 'Incorrect password. Please try again.', success: null });
            }
        }
    });
});

app.get('/admin-login', (req, res) => {
    res.render('admin-login', { error: null, success: null });
});

app.post('/admin-login', (req, res) => {
    const { email, password } = req.body;

    // Admin credentials
    if (email === 'admin@telangana.com' && password === 'admin123') {
        req.session.user = { id: 0, name: 'Admin', email: 'admin@telangana.com', isAdmin: true };
        return res.redirect('/admin');
    } else {
        res.render('admin-login', { error: 'Invalid Admin Credentials', success: null });
    }
});

app.get('/add-blog', requireLogin, (req, res) => {
    res.render('addBlog', { error: null, success: null });
});

app.post('/add-blog', requireLogin, handleAddBlogUpload, (req, res) => {
    const { title, description, district, author, category } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : null;
    const user_id = req.session.user.id;

    const sql = `
    INSERT INTO blogs(title, description, district, author, category, image_url, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [title, description, district, author, category, image_url, user_id], (err, result) => {
        if (err) {
            console.error(err);
            res.render('addBlog', { error: 'Database Error adding blog.', success: null });
        } else {
            res.redirect('/blogs');
        }
    });
});

app.get('/blogs', (req, res) => {
    const { search, district, category } = req.query;
    const currentUserId = req.session.user ? req.session.user.id : 0;

    let sql = `
        SELECT b.*,
               (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS likes_count,
               (SELECT COUNT(*) FROM likes WHERE blog_id = b.id AND user_id = ?) AS user_liked
        FROM blogs b
        WHERE 1=1
    `;
    const params = [currentUserId];

    if (search && search.trim() !== '') {
        sql += " AND (b.title LIKE ? OR b.description LIKE ?)";
        params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    if (district && district.trim() !== '') {
        sql += " AND b.district = ?";
        params.push(district);
    }
    if (category && category.trim() !== '') {
        sql += " AND b.category = ?";
        params.push(category);
    }

    sql += " ORDER BY b.created_at DESC";

    db.query(sql, params, (err, blogsResult) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error fetching blogs");
        }

        // Fetch comments and join with users to get comment author names
        const commentsSql = `
            SELECT c.*, u.name AS username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.status = 'approved'
            ORDER BY c.created_at ASC
        `;

        db.query(commentsSql, (err, commentsResult) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error fetching comments");
            }

            // Group comments by blog_id
            const commentsGrouped = {};
            commentsResult.forEach(c => {
                if (!commentsGrouped[c.blog_id]) {
                    commentsGrouped[c.blog_id] = [];
                }
                commentsGrouped[c.blog_id].push(c);
            });

            res.render('blogs', {
                blogs: blogsResult,
                commentsGrouped: commentsGrouped,
                filters: req.query || {}
            });
        });
    });
});

// Like / Unlike Toggle API Route
app.post('/blogs/:id/like', requireLogin, (req, res) => {
    const blogId = req.params.id;
    const userId = req.session.user.id;

    // Check if user already liked this blog
    const checkSql = "SELECT * FROM likes WHERE blog_id = ? AND user_id = ?";
    db.query(checkSql, [blogId, userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            // Unlike: Remove like record
            const deleteSql = "DELETE FROM likes WHERE blog_id = ? AND user_id = ?";
            db.query(deleteSql, [blogId, userId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }
                // Fetch updated count
                db.query("SELECT COUNT(*) AS count FROM likes WHERE blog_id = ?", [blogId], (err, countRes) => {
                    res.json({ liked: false, likesCount: countRes[0].count });
                });
            });
        } else {
            // Like: Insert like record
            const insertSql = "INSERT INTO likes (blog_id, user_id) VALUES (?, ?)";
            db.query(insertSql, [blogId, userId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }
                // Fetch updated count
                db.query("SELECT COUNT(*) AS count FROM likes WHERE blog_id = ?", [blogId], (err, countRes) => {
                    res.json({ liked: true, likesCount: countRes[0].count });
                });
            });
        }
    });
});

app.post('/blogs/:id/comment', (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Please login to write a comment.', redirect: '/login' });
    }
    next();
}, validateCommentMiddleware, (req, res) => {
    const blogId = req.params.id;
    const userId = req.session.user.id;
    const text = req.validatedCommentText;

    // Insert comment after passing all checks
    const sql = "INSERT INTO comments (blog_id, user_id, comment_text, status) VALUES (?, ?, ?, 'approved')";
    db.query(sql, [blogId, userId, text], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error while saving comment.' });
        }
        res.json({
            success: true,
            comment: {
                username: req.session.user.name,
                comment_text: text,
                created_at: new Date()
            }
        });
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// User Profile Dashboard
app.get('/profile', requireLogin, (req, res) => {
    const userId = req.session.user.id;

    // Fetch user's blogs with their likes count
    const blogsSql = `
        SELECT b.*,
               (SELECT COUNT(*) FROM likes WHERE blog_id = b.id) AS likes_count
        FROM blogs b
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;

    db.query(blogsSql, [userId], (err, userBlogs) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error fetching profile blogs");
        }

        // Fetch total likes received on user's blogs
        const likesSql = `
            SELECT COUNT(*) AS total_likes
            FROM likes l
            JOIN blogs b ON l.blog_id = b.id
            WHERE b.user_id = ?
        `;

        db.query(likesSql, [userId], (err, likesResult) => {
            const totalLikes = likesResult ? likesResult[0].total_likes : 0;
            res.render('profile', { blogs: userBlogs, totalLikes: totalLikes, error: null, success: null });
        });
    });
});

// Edit Blog (User Perspective)
app.get('/profile/edit-blog/:id', requireLogin, (req, res) => {
    const blogId = req.params.id;
    const userId = req.session.user.id;

    const sql = "SELECT * FROM blogs WHERE id = ? AND user_id = ?";
    db.query(sql, [blogId, userId], (err, result) => {
        if (err || result.length === 0) {
            console.error(err);
            return res.redirect('/profile');
        }
        res.render('editBlogUser', { error: null, success: null, blog: result[0] });
    });
});

app.post('/profile/edit-blog/:id', requireLogin, handleUserEditBlogUpload, (req, res) => {
    const blogId = req.params.id;
    const userId = req.session.user.id;
    const { title, description, district, category } = req.body;

    db.query("SELECT * FROM blogs WHERE id = ? AND user_id = ?", [blogId, userId], (err, checkRes) => {
        if (err || checkRes.length === 0) {
            return res.redirect('/profile');
        }

        const currentBlog = checkRes[0];
        const image_url = req.file ? '/uploads/' + req.file.filename : currentBlog.image_url;

        const sql = "UPDATE blogs SET title = ?, description = ?, district = ?, category = ?, image_url = ? WHERE id = ? AND user_id = ?";
        db.query(sql, [title, description, district, category, image_url, blogId, userId], (err, result) => {
            if (err) {
                console.error(err);
                res.render('editBlogUser', { error: 'Database Error updating blog.', success: null, blog: currentBlog });
            } else {
                res.redirect('/profile');
            }
        });
    });
});

// Delete Blog (User Perspective)
app.post('/profile/delete-blog/:id', requireLogin, (req, res) => {
    const blogId = req.params.id;
    const userId = req.session.user.id;

    const sql = "DELETE FROM blogs WHERE id = ? AND user_id = ?";
    db.query(sql, [blogId, userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting blog");
        }
        res.redirect('/profile');
    });
});

// Upgraded Admin Panel Dashboard
app.get('/admin', requireAdmin, (req, res) => {
    const usersSql = "SELECT * FROM users";
    const blogsSql = "SELECT * FROM blogs ORDER BY created_at DESC";
    const commentsSql = `
        SELECT c.*, u.name AS username, b.title AS blog_title
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN blogs b ON c.blog_id = b.id
        ORDER BY c.created_at DESC
    `;
    const likesCountSql = "SELECT COUNT(*) AS total_likes FROM likes";
    const commentsCountSql = "SELECT COUNT(*) AS total_comments FROM comments";

    db.query(usersSql, (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error fetching users");
        }
        db.query(blogsSql, (err, blogs) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error fetching blogs");
            }
            db.query(commentsSql, (err, comments) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database error fetching comments");
                }
                db.query(likesCountSql, (err, likesResult) => {
                    const totalLikes = likesResult ? likesResult[0].total_likes : 0;
                    db.query(commentsCountSql, (err, commentsResult) => {
                        const totalComments = commentsResult ? commentsResult[0].total_comments : 0;
                        res.render('admin', {
                            users: users,
                            blogs: blogs,
                            comments: comments,
                            totalLikes: totalLikes,
                            totalComments: totalComments
                        });
                    });
                });
            });
        });
    });
});

app.post('/admin/delete-blog/:id', requireAdmin, (req, res) => {
    const blogId = req.params.id;
    const sql = "DELETE FROM blogs WHERE id = ?";
    db.query(sql, [blogId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting blog");
        }
        res.redirect('/admin');
    });
});

app.get('/admin/edit-blog/:id', requireAdmin, (req, res) => {
    const blogId = req.params.id;
    const sql = "SELECT * FROM blogs WHERE id = ?";
    db.query(sql, [blogId], (err, result) => {
        if (err || result.length === 0) {
            console.error(err);
            return res.status(500).send("Error fetching blog for edit");
        }
        res.render('editBlog', { error: null, success: null, blog: result[0] });
    });
});

app.post('/admin/edit-blog/:id', requireAdmin, handleAdminEditBlogUpload, (req, res) => {
    const blogId = req.params.id;
    const { title, description, district, author, category } = req.body;

    db.query("SELECT * FROM blogs WHERE id = ?", [blogId], (err, checkRes) => {
        if (err || checkRes.length === 0) {
            return res.redirect('/admin');
        }

        const currentBlog = checkRes[0];
        const image_url = req.file ? '/uploads/' + req.file.filename : currentBlog.image_url;

        const sql = "UPDATE blogs SET title = ?, description = ?, district = ?, author = ?, category = ?, image_url = ? WHERE id = ?";
        db.query(sql, [title, description, district, author, category, image_url, blogId], (err, result) => {
            if (err) {
                console.error(err);
                res.render('editBlog', { error: 'Database Error updating blog.', success: null, blog: currentBlog });
            } else {
                res.redirect('/admin');
            }
        });
    });
});

// Admin Delete Comment Route
app.post('/admin/delete-comment/:id', requireAdmin, (req, res) => {
    const commentId = req.params.id;
    const sql = "DELETE FROM comments WHERE id = ?";
    db.query(sql, [commentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting comment");
        }
        res.redirect('/admin');
    });
});

app.post('/admin/delete-user/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error deleting user");
        }
        res.redirect('/admin');
    });
});

app.get('/admin/edit-user/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if (err || result.length === 0) {
            console.error(err);
            return res.status(500).send("Error fetching user for edit");
        }
        res.render('editUser', { error: null, success: null, user: result[0] });
    });
});

app.post('/admin/edit-user/:id', requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { name, email, password } = req.body;

    let sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
    let params = [name, email, userId];

    if (password && password.trim() !== "") {
        sql = "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
        params = [name, email, password, userId];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            db.query("SELECT * FROM users WHERE id = ?", [userId], (err2, result2) => {
                res.render('editUser', { error: 'Database Error updating user.', success: null, user: result2 ? result2[0] : null });
            });
        } else {
            res.redirect('/admin');
        }
    });
});

if (require.main === module) {
    app.listen(3000, () => {
        console.log('Server running on port 3000');
    });
}

module.exports = app;