const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/SearchController');

// Normalize keyword from query/body and pass to controller
const normalizeKeyword = (req) => {
  return (req.query && (req.query.q || req.query.keyword)) ||
         (req.body && (req.body.q || req.body.keyword)) ||
         '';
};

router.get('/results', (req, res, next) => {
  req.searchTerm = normalizeKeyword(req);
  return SearchController.search(req, res, next);
});

router.post('/results', (req, res, next) => {
  req.searchTerm = normalizeKeyword(req);
  return SearchController.search(req, res, next);
});

module.exports = router;
