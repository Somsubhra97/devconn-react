const express = require('express');
const router = express.Router();
const {
  check,
  validationResult
} = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const User = require('../../models/User');
const checkObjectId = require('../../middleware/checkObjectId');

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/post',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      await newPost.save();

      const posts = await Post.find().sort({
        date: -1
      });
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//Update Post
router.put('/post/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
   async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try{
      const post=await Post.findById(req.params.id);
      if(!post){
        return res.status(400).json(msg: 'Post not found');
      }

      post=await Post.findOneAndUpdate(
       req.params.id,
       req.body,
       {new:true}
      );
    //   post = await Post.findByIdAndUpdate(
    //   req.params.id,
    //   {$set: req.body},
    //   {new: true},
    // );
      res.status(201).json(post);
     }
    catch(e){
      res.status(500).send('Server Error');
    }
   }
 )



// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({
      date: -1
    });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        msg: 'Not found'
      });
    }
    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      res.status(404).json({
        msg: 'unformatted ObjectId'
      });
    }
    res.status(500).json({
      msg: 'server error'
    })
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({
        msg: 'Post not found'
      });
    }
    // Check user
    if (post.user.toString() !== req.user.id) {
      res.status(401).json({
        msg: 'User not authorized'
      });
    }
    await post.remove();

    res.json({
      msg: 'Post removed'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    const check = post.likes.some(like => like.user.toString() === req.user.id)
    if (!check) {
      post.likes.unshift({
        user: req.user.id
      });
      post.unlikes = post.unlikes.filter(item => item.user.toString() != req.user.id);
    } else {
      post.likes = post.likes.filter(
        ({
          user
        }) => user.toString() !== req.user.id
      );
    }
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has not yet been liked
    const check = post.unlikes.some(unlike => unlike.user.toString() === req.user.id)
    if (!check) {
      post.unlikes.unshift({
        user: req.user.id
      });
      post.likes = post.likes.filter(
        ({
          user
        }) => user.toString() !== req.user.id
      );
    } else {
      post.unlikes = post.unlikes.filter(
        ({
          user
        }) => user.toString() !== req.user.id
      );
    }
    await post.save();

    res.json(post.unlikes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  '/comment/:id',
  [
    auth,
    checkObjectId('id'),
    [check('text', 'Text is required').not().isEmpty()]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      const post = await Post.findById(req.params.id);
      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      res.status(404).json({
        msg: 'Comment does not exist'
      });
    }
    // Check user
    if (comment.user.toString() !== req.user.id) {
      res.status(401).json({
        msg: 'User not authorized'
      });
    }

    post.comments = post.comments.filter(
      ({
        id
      }) => id !== req.params.comment_id
    );

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/comment/:id/:comment_id', auth, async (req, res) => {

  const post = await Post.findById(req.params.id);
  const comment = post.comments.find(c => c.id === req.params.comment_id);
  if (!comment) {
    res.status(404).json({
      msg: 'Comment does not exist'
    });
  }
  comment.text = req.body.text;

  post.comments = post.comments.map(item => {
    item.id == req.params.comment_id ? {...item, text:req.body.text} : item
  })

  await post.save();
  res.json(post.comments);

})

module.exports = router;