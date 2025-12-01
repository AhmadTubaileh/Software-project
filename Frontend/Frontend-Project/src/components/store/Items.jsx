import React from "react";

export default function Items() {

    const products = [
                    {
                        id: 1,
                        name: "iPhone 15 Pro",
                        price: "$1099",
                        image: "https://images.macrumors.com/t/TkNh1oQ0-9TnnBjDnLyuz6yLkjE=/1600x0/article-new/2023/09/iPhone-15-General-Feature-Black.jpg"
                    },
                    {
                        id: 2,
                        name: "PlayStation 5",
                        price: "$499",
                        image: "https://m.media-amazon.com/images/I/51eOztNdCkL._AC_SL1500_.jpg"
                    },
                    {
                        id: 3,
                        name: "Gaming Headset",
                        price: "$89",
                        image: "https://m.media-amazon.com/images/I/61CGHv6kmWL._AC_SL1500_.jpg"
                    },
                    {
                        id: 4,
                        name: "Asus Gaming Laptop",
                        price: "$1399",
                        image: "https://www.asus.com/media/Odin/Websites/global/ProductLine/20200824120814.jpg"
                    }
                ];

                return (
                    
                    <div className="items-grid">
                        {products.map((product) => (
                            <div key={product.id} className="item-card">
                                <img src={product.image} className="item-image" />

                                <h3 className="item-title">{product.name}</h3>

                                <p className="item-price">{product.price}</p>

                                <button className="item-btn">Add to Cart</button>
                            </div>
                        ))}
                    </div>
                            
                    
                );
}
