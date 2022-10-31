var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelpers= require('../helpers/product-helpers')
var userHelpers= require('../helpers/user-helpers')


const verifyAdmin = (req,res,next)=>{
  if(req.session.user.admin){
    next()
  }else{
    res.redirect('/')
  }
}

router.get('/',verifyAdmin, function(req, res, next) {
  let user = req.session.user
  productHelpers.getAllproducts().then((products)=>{
    res.render('admin/view-products', {user,products})
  })
});

router.get('/add-product',verifyAdmin, (req,res)=>{
  let user = req.session.user
  res.render('admin/add-product',{user})
})

router.post('/add-product',verifyAdmin, (req,res)=>{
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.Image
    image.mv('./public/product-images/'+id+'.png',(err, done)=>{
      if(!err){
        res.render("admin/add-product")
      }else{
        console.log(err)
      }
    })
  })
})

router.get('/delete-product',verifyAdmin,(req,res)=>{
  let user = req.session.user
  let productId = req.query.id
  productHelpers.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/',{user})
  })
  // const fs = require('fs')
  // const path = './public/images/product-images/'+productId+'.png'
  // try{
  //   fs.unlinkSync(path)
  //   console.log('Deleted')
  // }catch(err){
  //   console.log(err);
  // }
})

router.get('/edit-product',verifyAdmin,async(req,res)=>{
  let user = req.session.user
  let product =await productHelpers.getProduct(req.query.id)
  res.render('admin/edit-product',{product,user})
})

router.post('/edit-product',verifyAdmin,(req,res)=>{
  productHelpers.updateProduct(req.query.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/product-images/'+req.query.id+'.png')
    }
  })
})







module.exports = router;
