function addToCart(productId,userId){
    $.ajax({
        url:'/add-to-cart?id='+productId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count = $('#cartCount').html()
                count = parseInt(count)+1
                $('#cartCount').html(count)

                const cartIcons = document.getElementsByClassName('cartIcon'+productId);
                [].slice.call( cartIcons ).forEach(function ( cartIcon ) {
                    cartIcon.innerHTML = '<img src="/icons/shopping-cart (1).png" alt="">';
                });

                const cartButtons = document.getElementsByClassName('cartButton'+productId);
                [].slice.call( cartButtons ).forEach(function ( cartButton ) {
                    cartButton.style.backgroundColor = 'transparent';
                    cartButton.style.color='#000'
                    cartButton.style.borderColor = '#000';
                    cartButton.innerHTML = 'Added To Cart';
                });
            }
        }
    })
}


function changeQuantity(cartId, productId,userId, count) {
    let quantity = parseInt(document.getElementById(productId).value);
    count = parseInt(count);


    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: productId,
            count: count,
            quantity:quantity,
            userId:userId
        },
        method: 'post',
        success: (response) => {
            if(response){
                document.getElementById(productId).value=quantity+count;
                document.getElementById('totalValue').innerHTML='₹'+response.total.totalPrice;
                document.getElementById('total-quantity').innerHTML = response.total.totalQuantity;
                
            }
        }
    })
}

function removeProduct(cartId,productId,userId){
    $.ajax({
        url: '/remove-from-cart',
        data: {
            cart: cartId,
            product: productId,
            userId:userId,
        },
        method: 'post',
        success: (response) => {
           if(response.removeProduct){
                document.getElementById('cart'+productId).style.display = 'none';
                document.getElementById('totalValue').innerHTML ='₹'+ response.total.totalPrice;
                document.getElementById('total-quantity').innerHTML = response.total.totalQuantity;
                
           }
        }
    })
}
