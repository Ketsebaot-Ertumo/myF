const cloudinary= require('../utils/cloudinary');
const Post= require('../models/postModel');
const ErrorResponse= require('../utils/errorResponse');
//const { json } = require('express');
const jwt= require('jsonwebtoken');

//create post
exports.createPost = async (req, res, next) => {
    const {title, content, postedBy, image, } = req.body;
    console.log(req.body);

    try{
        
        //upload image in cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "posts",
            width: 1200,
            crop: "scale"
        });
        const post = await Post.create({
            title, 
            content, 
            postedBy: "req.body._id",
            image:{
                public_id: result.public_id,
                url: result.secure_url },
            });
            // //save the post to the database
            //const savedPost = await post.save();
            res.status(201).json({
                success: true,
                post
                //post: savedPost
            })
        }
            catch(error){
                console.log(error);
                next(error);
            }
}


//cretae post with authentication
// function createPost(req, res) {
// // get token from request headers
// const token = req.headers.authorization?.split(' ')[1];

// // verify token
// jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//   if (err) {
//     // if token is invalid, send error response
//     res.status(401).json({ success: false, message: 'Invalid token' });
//   } else {
//     // if token is valid, create post and send success response
//     const post = new Post({ title: req.body.title, content: req.body.content });
//     post.save()
//       .then(() => {
//         res.status(201).json({ success: true, post });
//       })
//       .catch(error => {
//         res.status(500).json({ success: false, message: error.message });
//       });
//   }
// });
// }


// //create post
// exports.createPost = async(req, res) => {
//     // console.log(req.body)
//     const post= new Post({...req.body, postedBy: "req.user._id",});
//     try{
//         await post.save();
//         res.status(201).send(post);
//     }catch(e){
//         res.status(400).send(e);
//     }
// // console.log(post)
// }



//show all posts
exports.showPost = async (req, res,next) =>{
    //console.log(req.body);
    try{
        const posts = await Post.find().sort({createdAt: -1}).populate('postedBy','name');
        console.log(posts);

          if (!posts) {
            return res.status(404).json({ message: 'No Posts found' });
          }
        res.status(200).json({
            success: true,
            posts
        })
    }
 catch (error){
    console.log(error);
    next(error);
}
}


//show posts by id on user
exports.showPostById= async(req, res, next) => {
    console.log(req.params.id)
        try{
          const post = await Post.findById(req.params.id).sort({createdAt: -1}).populate('postedBy', 'name');
          console.log(post);
          if (!post) {
            return res.status(405).json({ message: 'Posts not found' });
          }
          res.status(201).json({
            success: true,
            post
          })
    } catch (error){
            res.status(500);
            next(error);
        }
}


//   exports.showPostById = async (req, res) => {
//   const { author } = req.query;
//   const query = author ? { author } : {};
//   try {
//     const blogPosts = await BlogPost.find(query).populate('author');
//     res.send(blogPosts);
//   } catch (e) {
//     res.status(500).send();
//   }
// };

      




//show single post
exports.showSinglePost = async (req, res,next) =>{
    try{
        const post = await Post.findById(req.params.id).populate('comments.postedBy', 'name');
        res.status(201).json({
            success: true,
            post
        })
    }
 catch (error){
    next(error);
}
}


//delete post
exports.deletePost = async (req, res,next) =>{
    console.log(req.params.id);
    const currentPost = await Post.findById(req.params.id);
    console.log(currentPost);

    if (!currentPost) {
        return res.status(404).json({
            success: false,
            message: "Post not found",
        });
    }
    //delete the post image in cloudinary
    const ImgId = currentPost.image.public_id;
    if(ImgId){
        await cloudinary.uploader.destroy(ImgId);
    }
    try{
        const Post = await Post.findByIdAndRemove(req.params.id);
        res.status(200).json({
            success: true,
            message:"post delete"
        })
    }
 catch (error){
    next(error);
}
}


//update post
exports.updatePost = async (req, res,next) =>{
    try{
        const {title, content, image} = req.body;
        const currentPost = await Post.findById(req.params.id);
        console.log(req.body);
        console.log(currentPost);

        if (!currentPost) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        //build the object data
        const data = {
            title: title || currentPost.title,
            content: content || currentPost.content,
            image: image || currentPost.image,
        }

        //modify post image conditionally
        if(req.body.image !== '' ){
            const ImgId = currentPost.image.public_id;
            if (ImgId) {
                await cloudinary.uploader.destroy(ImgId);
            }

            const newImage = await cloudinary.uploader.upload(req.body.image, {
                 folder: 'posts', 
                 width: 1200, 
                 crop: "scale"
            });

            data.image = {
                public_id: newImage.public_id,
                url: newImage.secure_url
            }
        }
            const postUpdate = await Post.findByIdAndUpdate(req.params.id, date, {new: true});
            res.status(200).json({
                success: true,
                postUpdate
            })
    } catch(error){
        next(error);
    }
        }

//add comment
exports.addComment = async (req, res,next) =>{
    const {comment} = req.body;
    try{
        const post = await Post.findByIdAndUpdate(req.params.id, {
            $push: {comments: {text: comment, postedBy: req.user._id}}
        },
            {new: true}
        )
        res.status(200).json({
            success: true,
            post
        })
    }  catch (error){
        next(error);
    }
}


//add like
exports.addLike = async (req, res,next) =>{
    try{
        const post = await Post.findByIdAndUpdate(req.params.id,{
            $addToSet: {likes: req.user._id}
        },
            {new: true}
        ) 
        res.status(200).json({
            success: true,
            post
        })
    } catch (error){
        next(error);
}
}


//remove like
exports.removeLike = async (req, res,next) =>{
    try{
        const post = await Post.findByIdAndUpdate(req.params.id,{
            $pull: {likes: req.user._id}
        },
            {new: true}
        ) 
        res.status(200).json({
            success: true,
            post
        })
    } catch (error){
        next(error);
}
}

//// routes/PostRoutes.js

// const express = require('express');
// const Post = require('../models/postModel');

// const router = express.Router();

//     router.get('/', async (req, res) => {
//         const { postedBy } = req.query;
//         const query = postedBy ? { postedBy } : {};
//             try {
//                 const posts = await Post.find(query).populate('postedBy');
//                 res.send(blogPosts);
//             } catch (e) {
//                 res.status(500).send();
//             }
//         });

//     router.post('/', async (req, res) => {
//         const post = new Post({
//         ...req.body,
//         postedBy: req.user._id,
//         });
//             try {
//                 await post.save();
//                 res.status(201).send(post);
//             } catch (e) {
//                 res.status(400).send(e);
//         }
//     });

//module.exports = router;


// const sendTokenResponse = async (user, codeStatus, res)=>{
//     const token = await user.getJwtToken();
//     res
//       .status(codeStatus)
//       .cookie('token', token, {maxAge: 60 * 60 * 1000, httpOnly: true})
//          .json({
//             success: true,
//             id: user._id,
//             role: user.role,
//          })
// }