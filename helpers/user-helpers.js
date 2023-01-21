var db = require('../config/connection');
var collection=require("../config/collections")
var bcrypt = require('bcrypt');
const { response } = require('../app');
const  ObjectID  = require('mongodb').ObjectID

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            userData.Password =await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                userData._id=data.insertedId
                resolve(userData)
            })
        })
        
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let user =await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log('login succes')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log('Wrong Password')
                        resolve({status:false,loginErr:'Wrong Password'})
                    }
                })
            }else{
                console.log('wrong Email')
                resolve({status:false,loginErr:'wrong Email'})
            }
        })
    },
    addToCart:(productId,userId)=>{
        productObj={
            item:ObjectID(productId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
            if(userCart){
                let productExist= userCart.products.findIndex(product=> product.item==productId)
                if(productExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:ObjectID(userId),'products.item':ObjectID(productId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve();
                    })
                }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:ObjectID(userId)},
                        {
                            $push:{products:productObj}
                            
                        }
                    ).then((response)=>{
                        resolve()
                    })
                }
            }else{
                let cartObj={
                    user:ObjectID(userId),
                    products:[productObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartCount = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
            if(cart){
                cartCount = cart.products.length
            }
            resolve(cartCount)
        })
    },
    changeProductQuantity:(details)=>{
        count=parseInt(details.count);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:ObjectID(details.cart), 'products.item':ObjectID(details.product)},
                    {
                        $inc:{'products.$.quantity':count}
                    }
                    ).then((response)=>{
                        resolve(response);
                    })
        })
    },
    removeFromCart:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:ObjectID(details.cart)},
                    {
                        $pull:{products:{item:ObjectID(details.product)}}
                    }
                    ).then((response)=>{
                        resolve({removeProduct:true});
                    })
        })
    },
    getTotal:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total= await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectID(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        totalPrice:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.cPrice',to:'int'}}]}},
                        totalQuantity:{$sum:{$multiply:['$quantity',1]}}
                    }
                }
            ]).toArray()
            resolve(total[0])
        })
    },
    getCartProductsList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart =await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectID(userId)})
            resolve(cart.products)
        })
    },
    placeOrder:(order,products,total,cartCount)=>{
        return new Promise((resolve,reject)=>{
            let status = order['payment-method']==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    Name:order.firstName+' '+order.lastName,
                    Email:order.Email,
                    Phone:order.Phone,
                    Address:order.Address,
                    City:order.City,
                    State:order.State,
                    Country:order.Country,
                    Pincode:order.Pincode,
                },
                userId:ObjectID(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total.totalPrice,
                totalItems:total.totalQuantity,
                status:status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectID(order.userId)});
                resolve()
            })
        })
    },
    viewOrders:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectID(userId)}).toArray().then((response)=>{
                resolve(response)
            })
        })
    },
    viewOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectID(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users =await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            resolve(users)
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:ObjectID(userId)}).then((response)=>{
                resolve(response)
            })
        }) 
    },
    editUser:(user)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectID(user.userId)},{
                $set:{
                    firstName:user.firstName,
                    lastName:user.lastName,
                    Email:user.Email,
                    Phone:user.Phone,
                    Address:user.Address,
                    City:user.City,
                    State:user.State,
                    Pincode:user.Pincode
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}