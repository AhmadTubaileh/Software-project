import React from "react";
import { Link } from "react-router-dom";
import { storeProducts } from "../../data/storeProducts";
import { cartProducts } from "../../data/cartProducts";


export default function Items() {


    function addToCart(product,quantity=1){
        const existingIndex = cartProducts.findIndex((item)=>item.id===product.id);
        

        if(existingIndex!==-1){
            const item = cartProducts[existingIndex]

            item.quantity+=quantity;
            item.subtotal = item.price*item.quantity;
            cartProducts[existingIndex]  = item

        } else {
            cartProducts.push({
                  id: product.id,
                  img: product.img,
                  name: product.name,
                  price: product.price,
                  quantity: quantity,
                  subtotal: product.price * quantity
                });
                console.log("Added to cart:", product.name);
                alert(`${product.name} added to cart!`);
              }
    }
    

    return (
        <div className="items-grid">
        {storeProducts.map((product) => (
            <div key={product.id} className="item-card">
            <Link to={`/store/product/${product.id}`}>
                <img src={product.img} className="item-image" alt={product.name} />
            </Link>

            <h3 className="item-title">{product.name}</h3>
            <p className="item-price">${product.price}</p>

            <button className="item-btn" onClick={()=>addToCart(product,1)}>Add to Cart</button>
            </div>
        ))}
        </div>
  );
}
