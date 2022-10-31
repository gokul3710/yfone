var db = require('../config/connection');
var collection=require("../config/collections");
const { response } = require('../app');
const  ObjectID  = require('mongodb').ObjectID

module.exports={

    addProduct:(product, callback)=>{
        
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllproducts:(callback)=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectID(productId)}).then((response)=>{
                resolve(response)
            })
        }) 
    },
    getProduct:(productId)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectID(productId)}).then((product)=>{
                resolve(product)
            })
        }) 
    },
    updateProduct:(productId,product)=>{
        return new Promise((resolve,reject) =>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectID(productId)},{
                $set:{
                    Name:product.Name,
                    Company:product.Company,
                    cPrice:product.cPrice,
                    mPrice:product.mPrice,
                    Date:product.Date,
                    Display:product.Display,
                    RAM:product.RAM,
                    ROM:product.ROM
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getCategoryProducts:(category)=>{
        return new Promise((resolve,reject) =>{
            let categoryproducts = db.get().collection(collection.PRODUCT_COLLECTION).find({Company:category}).toArray()
            resolve(categoryproducts)
        }) 
    },
}