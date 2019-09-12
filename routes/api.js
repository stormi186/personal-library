/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var mongoose = require('mongoose');
var mongooseConfig = require('../config/mongoose_config');
var ObjectId = require('mongodb').ObjectId;
var MONGODB_CONNECTION_STRING = process.env.MONGO_DB;
mongoose.connect(MONGODB_CONNECTION_STRING, mongooseConfig);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Library = db.collection('books');

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res, next){
      var books = [];
      Library.find({}).forEach(book => {
        const { _id, title, comments } = book;
        books.push({ _id, title, commentcount: comments.length });
      }, err => {
        if (err) next(err);
        return res.status(200).json(books);
      }); 
    })
    
    .post(function (req, res, next){
      var title = req.body.title;
      const _id = new ObjectId();
      if (!title) return res.status(400).send('missing book title');
      Library.findOne({ title }, (err, book) => {
        if (err) next(err);
        if (book) return res.status(200).json(book);
        Library.insertOne({ _id, title, comments: [] }, (err, newBook) => {
          if (err) next(err);
          if (!newBook.comments) return res.status(200).json({ _id, title, comments: [] });
          else return res.status(200).json({ _id, title, comments: newBook.comments });
        });
      });
    })
    
    .delete(function(req, res, next){
      //if successful response will be 'complete delete successful'
      Library.deleteMany({}, (err, emptyLibrary) => {
        if (err) next(err);
        return res.status(200).send('complete delete successful');
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res, next){
      var _id = req.params.id;
      if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
      Library.findOne({ _id: ObjectId(_id) }, (err, book) => {
        if (err) next(err);
        if (!book) return res.status(200).send('no book exists');
        const { _id, title, comments } = book;
        return res.status(200).json({ _id, title, comments });
      });
    })
    
    .post(function(req, res, next){
      var _id = req.params.id;
      var comment = req.body.comment;
      if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
      Library.findOneAndUpdate({ _id: ObjectId(_id) }, {
        $push: { comments: comment } 
      }, { new: true }, (err, updatedBook) => {
        if (err) next(err);
        const { _id, title, comments } = updatedBook.value;
        if (!comments) return res.status(200).json({ _id, title, comments: [comment] });
        const commentsArray = comments;
        commentsArray.push(comment);
        return res.status(200).json({ _id, title, comments: commentsArray });
      });
    })
    
    .delete(function(req, res, next){
      var _id = req.params.id;
      if (!ObjectId.isValid(_id)) return res.status(200).send('no book exists');
      Library.deleteOne({ _id: ObjectId(_id) }, (err, updatedLibrary) => {
        if (err) next(err);
        return res.status(200).send('delete successful');
      });
    });
  
};
