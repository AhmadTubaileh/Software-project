import React from "react";

export default function Slider() {
const [currentSlide, setCurrentSlide] = React.useState(0);
                const slides = [
                    {
                        id: 1,
                        image: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                        title: "Latest Smartphones",
                        description: "Discover the newest mobile technology"
                    },
                    {
                        id: 2,
                        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
                        title: "Gaming Laptops",
                        description: "High-performance laptops for gamers"
                    },
                    {
                        id: 3,
                        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                        title: "Premium Headphones",
                        description: "Experience sound like never before"
                    },
                    {
                        id: 4,
                        image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
                        title: "Gaming Consoles",
                        description: "Next-gen gaming experience"
                    }
                ];

                function nextSlide(){
                    setCurrentSlide ((next)=>(next === slides.length-1?0:next+1));
                }

                function prevSlide(){
                    setCurrentSlide ((prev)=>(prev === 0?slides.length-1:prev-1));
                }

                function goToSlide(index){
                    setCurrentSlide(index);
                }

                React.useEffect(()=>{
                    const interval = setInterval(()=>{
                        setCurrentSlide ((next)=>(next === slides.length-1?0:next+1));
                    },4000);
                    return () => clearInterval(interval);
                },[slides.length]);

                return(
                    <div className='slider-container'>
                        <div 
                        className="slider"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >

                        {slides.map((slide)=>(
                            <div key={slide.id} className="slide">
                                <img src={slide.image} alt={slide.title} />
                                <div className="slide-content">
                                    <h3 className="slide-title">{slide.title}</h3>
                                    <p className="slide-description">{slide.description}</p>
                                </div>
                            </div>
                        ))}

                        </div>

                        <button className="slider-btn prev-btn" onClick={prevSlide}>
                            ‹
                        </button>

                        <button className="slider-btn next-btn" onClick={nextSlide}>
                            ›
                        </button>

                        <div className="slider-dots">

                        {slides.map((_,index)=>(
                            <div
                            key={index}
                            className = {`dot ${index===currentSlide?'active':''}`}
                            onClick={()=>goToSlide(index)}
                            />
                            
                        ))}

                    </div>



                    </div>
                );
}
