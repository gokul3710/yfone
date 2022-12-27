const { response } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
var productHelpers= require('../helpers/product-helpers')
var userHelpers= require('../helpers/user-helpers')
var ObjectID = require('mongodb').ObjectId

const verifyLogin = (req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

const verifyAdmin = (req,res,next)=>{
  if(req.session.user.admin){
    next()
  }else{
    res.redirect('/')
  }
}

const cartCheck = (user,cartProducts,allProducts)=>{
  if(user){
    cartProducts.forEach(cartProduct =>{
      allProducts.forEach(product=>{
        if(product._id.toString() == cartProduct.item.toString()){
          product.cart=true
        }
      })
    })
  }
  return allProducts;
}

const cartCheckSingle =(user,cartProducts,product)=>{
  if(user){
    cartProducts.forEach(cartProduct =>{
      if(product._id.toString() == cartProduct.item.toString()){
        product.cart = true
      }
    })
  }
  return product;
}

/* GET home page. */
router.get('/', async(req, res, next)=> {
  let user = req.session.user
  let cartCount = 0
  let products=null
  if(user){
    cartCount = await userHelpers.getCartCount(user._id)
    products = await userHelpers.getCartProducts(user._id)
  }
  productHelpers.getAllproducts().then((allProducts)=>{
    let slicedProducts = allProducts.slice(allProducts.length-4, allProducts.length).reverse();
    slicedProducts = cartCheck(user,products,slicedProducts);

    allProducts = cartCheck(user,products,allProducts);
    let temp;
    for(i=0;i<allProducts.length;i++){
      for(j=i+1;j<allProducts.length;j++){
          if(allProducts[i].Date<allProducts[j].Date){
            temp = allProducts[i];
            allProducts[i] = allProducts[j];
            allProducts[j]=temp
          }
      }
    }
    res.render('user/view-products', {slicedProducts,user,cartCount,products,allProducts})
  })
});


router.get('/login', (req, res)=> {
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    res.render('user/login', {'loginErr':req.session.userLoginErr})
    req.session.userLoginErr=false
  } 
});

router.get('/signup', (req, res)=> {
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    res.render('user/signup',)
  }
});

router.post('/signup', (req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    req.session.userLoggedIn = true
    req.session.user=response
    res.redirect('/')
  })
})

router.post('/login', (req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.userLoggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.userLoginErr=response.loginErr
      res.redirect('/login')
    }
  })
})


router.get('/logout',(req,res)=>{
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect('/')
})

router.get('/cart',verifyLogin, async(req, res)=> {
  let user = req.session.user
  let cartCount = 0
  let cartProducts=null
  if(user){
    cartCount = await userHelpers.getCartCount(user._id)
    cartProducts = await userHelpers.getCartProducts(user._id)
  }
  cartProducts.forEach(cartProduct=>{
    if(cartProduct.quantity == 1){
      cartProduct.disabled = true
    }

  })
  let total = await userHelpers.getTotal(req.session.user._id)
  productHelpers.getAllproducts().then((products)=>{
    products = cartCheck(user,cartProducts,products)
    res.render('user/cart', {user,products,cartCount,cartProducts,total})
  })
});

router.get('/products',verifyLogin, async(req, res)=> {
  let user = req.session.user
  let cartCount = 0
  let cartProducts=null
  if(user){
    cartCount = await userHelpers.getCartCount(user._id)
    cartProducts = await userHelpers.getCartProducts(user._id)
  }
  productHelpers.getAllproducts().then((products)=>{
    products = cartCheck(user,cartProducts,products)
    res.render('user/all-products', {user,products,cartCount})
  })
});

router.get('/add-to-cart',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.query.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotal(req.body.userId)
    res.json(response)
  })
})

router.post('/remove-from-cart', (req,res,next)=>{
  userHelpers.removeFromCart(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotal(req.body.userId)
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let total = await userHelpers.getTotal(user._id)
  res.render('user/place-order',{cartCount,user,total})
})

router.post('/place-order',async(req,res)=>{
  let products = await userHelpers.getCartProductsList(req.body.userId)
  let total = await userHelpers.getTotal(req.body.userId)
  userHelpers.placeOrder(req.body,products,total).then((response)=>{
    res.json({status:true})
  })
})

router.get('/orders',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  userHelpers.viewOrders(user._id).then((orders)=>{
    orders.forEach(order => {
      order.date = order.date.toString()
      order.time = order.date.slice(16,24)
      order.day = order.date.toString().slice(4,15)
      
      console.log(order);
      
    })
    res.render('user/orders',{orders,user,cartCount})
  })
  
})

router.get('/view-order-products',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let products = await userHelpers.viewOrderProducts(req.query.id)
  let cartCount = await userHelpers.getCartCount(user._id)
  res.render('user/view-order-products',{user,products,cartCount})
})

router.get('/product',verifyLogin,async(req,res)=>{
  let user = req.session.user
  let cartCount = await userHelpers.getCartCount(user._id)
  let products = await userHelpers.getCartProducts(user._id)
  let product =await productHelpers.getProduct(req.query.id)
  product = cartCheckSingle(user,products,product)
  let categoryProducts = await productHelpers.getCategoryProducts(product.Company)
  res.render('user/single-product',{product,user,cartCount,categoryProducts})
})

router.get('/all-users',verifyAdmin,(req,res)=>{
  userHelpers.getAllUsers().then((allUsers)=>{
    res.render('admin/all-users',{allUsers})
  })
})

router.get('/delete-user',verifyAdmin,(req,res)=>{
  userHelpers.deleteUser(req.query.id).then((response)=>{
    res.redirect('/all-users')
  })
})

router.get('/edit-user',verifyLogin,(req,res)=>{
  let user = req.session.user
  res.render('user/edit-user',{user})
})

router.post('/edit-user',(req,res)=>{
  userHelpers.editUser(req.body).then((response)=>{
    res.redirect('/')
  })
})


module.exports = router;
