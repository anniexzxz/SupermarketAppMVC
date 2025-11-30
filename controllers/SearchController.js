// Function-based Search controller
// Renders search.ejs with results or messages
const Search = require('../models/Search');

const SearchController = {
    search(req, res) {
        // keyword may come from router-normalized req.searchTerm, query, or body
        const keyword = (req.searchTerm || req.query.q || req.query.keyword || req.body.q || req.body.keyword || '').trim();
        const user = req.session ? req.session.user : null;

        if (!keyword) {
            return res.render('search', {
                results: [],
                keyword: '',
                message: 'Please enter a search term.',
                error: null,
                user
            });
        }

        Search.search(keyword, (err, results) => {
            if (err) {
                console.error('Search error:', err);
                return res.status(500).render('search', {
                    results: [],
                    keyword,
                    message: null,
                    error: 'Failed to perform search.',
                    user
                });
            }

            const hasResults = Array.isArray(results) && results.length > 0;
            return res.render('search', {
                results: hasResults ? results : [],
                keyword,
                message: hasResults ? null : 'No results found.',
                error: null,
                user
            });
        });
    }
};

module.exports = SearchController;
