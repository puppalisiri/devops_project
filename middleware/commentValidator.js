const db = require('../config/db');

// In-memory rate limiting store (maps userId -> array of comment timestamps)
const commentRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_COMMENTS_PER_WINDOW = 3;

// Profanity / Bad words list
const BAD_WORDS = [
    'badword', 'spamword', 'abuse', 'offensive',
    'idiot', 'stupid', 'crap', 'fudge', 'fool', 'jerk',
    'sh1t', 'asshole', 'bastard', 'bitch', 'dumbass', 'moron',
    'spam', 'scam', 'fake'
];

/**
 * Validates a comment string against content rules.
 * Returns an error message string if invalid, or null if valid.
 */
function validateCommentText(text) {
    const trimmed = text ? text.trim() : '';

    // 1. Empty Comment Restriction
    if (!trimmed) {
        return 'Comment cannot be empty';
    }

    // 2. Minimum and Maximum Comment Length Validation
    const MIN_LENGTH = 5;
    const MAX_LENGTH = 500;
    if (trimmed.length < MIN_LENGTH) {
        return 'Comment is too short';
    }
    if (trimmed.length > MAX_LENGTH) {
        return 'Comment exceeds maximum allowed length';
    }

    // 6. Link / URL Restriction (http://, https://, www.)
    if (/https?:\/\/|www\./i.test(trimmed)) {
        return 'Links are not allowed in comments';
    }

    // 7. Special Character Spam Restriction (e.g., @@@@@####$$$$)
    // Counts non-alphanumeric, non-whitespace, non-standard punctuation characters
    const specialChars = trimmed.replace(/[a-zA-Z0-9\s.,!?'"\(\)\-]/g, '');
    if (specialChars.length > 5 || (trimmed.length > 0 && (specialChars.length / trimmed.length) > 0.2)) {
        return 'Comment contains excessive unnecessary symbols or random characters';
    }

    // 5. Repeated Character Spam Prevention
    // Detects consecutive character repetition (5+ times e.g. aaaaa, !!!)
    // Detects pattern/substring repetition (e.g. hahahahahahaha -> ha repeated 4+ times)
    if (/(.)\1{4,}/.test(trimmed) || /(.{2,4})\1{3,}/i.test(trimmed)) {
        return 'Comment contains excessive repeated characters';
    }

    // 3. Bad Word / Profanity Filter
    const lower = trimmed.toLowerCase();
    for (const word of BAD_WORDS) {
        if (lower.includes(word)) {
            return 'Inappropriate comment not allowed';
        }
    }

    return null;
}

/**
 * Express middleware for comment validation and rate limiting.
 */
const validateCommentMiddleware = (req, res, next) => {
    // 8. Logged-in Users Only
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Please login to write a comment.', redirect: '/login' });
    }

    const userId = req.session.user.id;
    const blogId = req.params.id;
    const { comment_text } = req.body;

    const trimmedText = comment_text ? comment_text.trim() : '';

    // Perform validation rules on content
    const syncError = validateCommentText(trimmedText);
    if (syncError) {
        return res.status(400).json({ error: syncError });
    }

    // 9. Comment Rate Limiting (per user)
    const now = Date.now();
    if (!commentRateLimits.has(userId)) {
        commentRateLimits.set(userId, []);
    }
    const timestamps = commentRateLimits.get(userId);
    // Filter timestamps to only keep those within the rate limit window
    const recentTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);

    if (recentTimestamps.length >= MAX_COMMENTS_PER_WINDOW) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait before posting another comment.' });
    }

    // 4. Duplicate Comment Prevention
    const dupSql = "SELECT id FROM comments WHERE blog_id = ? AND user_id = ? AND comment_text = ?";
    db.query(dupSql, [blogId, userId, trimmedText], (errDup, dupRes) => {
        if (errDup) {
            console.error('Database error checking duplicate comment:', errDup);
            return res.status(500).json({ error: 'Database error checking duplicate comment.' });
        }
        if (dupRes && dupRes.length > 0) {
            return res.status(400).json({ error: 'Duplicate comments are not allowed' });
        }

        // Add current timestamp to rate limits list
        recentTimestamps.push(now);
        commentRateLimits.set(userId, recentTimestamps);

        // Store cleaned comment text on request object for subsequent middleware
        req.validatedCommentText = trimmedText;
        next();
    });
};

module.exports = {
    validateCommentText,
    validateCommentMiddleware
};
