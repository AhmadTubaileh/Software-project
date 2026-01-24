import React from "react";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">

                <div className="footer-section">
                    <h3>About Us</h3>
                    <p>
                        MARS is your trusted destination for the latest electronics,
                        gaming gear, and premium tech products.
                    </p>
                </div>

                <div className="footer-section">
                    <h3>Customer Service</h3>
                    <ul>
                        <li><a href="#">Contact Us</a></li>
                        <li><a href="#">Shipping Policy</a></li>
                        <li><a href="#">Return Policy</a></li>
                        <li><a href="#">FAQ</a></li>
                    </ul>
                </div>

                {/*<div className="footer-section">
                    <h3>Categories</h3>
                    <ul>
                        <li><a href="#">Mobile</a></li>
                        <li><a href="#">Laptops</a></li>
                        <li><a href="#">Accessories</a></li>
                        <li><a href="#">Consoles</a></li>
                    </ul>
                </div>
                */}
                
                <div className="footer-section">
                    <h3>Follow Us</h3>
                    <div className="socials">
                        
                        <a href="https://www.facebook.com/ahmad.tubaileh.7/" aria-label="Facebook">
                            <i className="fa-brands fa-facebook-f"></i>
                        </a>
                        <a href="https://www.instagram.com/ahmad.tubaileh.7/" aria-label="Instagram">
                            <i className="fa-brands fa-instagram"></i>
                        </a>
                        <a href="#" aria-label="X (Twitter)">
                            <i className="fa-brands fa-x-twitter"></i>
                        </a>
                        <a href="https://www.youtube.com/@ahmadtubaileh7186" aria-label="YouTube">
                            <i className="fa-brands fa-youtube"></i>
                        </a>
                    </div>

                </div>

            </div>

            <div className="footer-bottom">
                © {new Date().getFullYear()} MARS Electronics. All rights reserved.
            </div>
        </footer>
    );
}
