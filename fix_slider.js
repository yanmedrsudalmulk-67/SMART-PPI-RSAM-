const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/index.tsx', 'utf8');

// Replace Swiper modules import
code = code.replace(
  /import { Autoplay, Pagination, Navigation, EffectFade } from "swiper\/modules";/,
  'import { Autoplay, Pagination, Navigation, EffectFade, EffectCreative, Parallax } from "swiper/modules";'
);

// Replace SliderImage
const targetSliderImage = `const SliderImage = ({
  slide,
  setImageErrors,
}: {
  slide: any;
  setImageErrors: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-[40px] saturate-200 scale-125 transition-opacity duration-700 ease-out"
        style={{
          backgroundImage: \`url(\${slide.image_url})\`,
          opacity: isLoaded ? 0.4 : 0,
        }}
      />
      <div className="absolute inset-0 w-full h-full bg-slate-950/20" />
      <img
        ref={imgRef}
        src={slide.image_url}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover drop-shadow-2xl scale-100 group-[.swiper-slide-active]:scale-105"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 700ms ease-out, transform 15000ms ease-out",
        }}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error("Slider image error", slide.image_url);
          setImageErrors((prev: any) => ({ ...prev, [slide.id]: true }));
        }}
      />
    </>
  );
};`;

const replSliderImage = `const SliderImage = ({
  slide,
  setImageErrors,
}: {
  slide: any;
  setImageErrors: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-[30px] saturate-150 scale-110 transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: \`url(\${slide.image_url})\`,
          opacity: isLoaded ? 0.5 : 0,
        }}
      />
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent z-10" />
      <div 
        className="absolute inset-0 w-full h-full transform origin-center transition-transform duration-[10000ms] ease-out scale-100 group-[.swiper-slide-active]:scale-110"
        data-swiper-parallax="20%"
        data-swiper-parallax-scale="1.15"
      >
        <img
          ref={imgRef}
          src={slide.image_url}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 1000ms ease-out",
          }}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            console.error("Slider image error", slide.image_url);
            setImageErrors((prev: any) => ({ ...prev, [slide.id]: true }));
          }}
        />
      </div>
      
      {/* Title overlay with parallax */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-14 md:pb-16 text-white overflow-hidden pointer-events-none">
        <div data-swiper-parallax="-300" data-swiper-parallax-opacity="0" className="transition-all duration-1000">
           <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tight drop-shadow-lg">{slide.title}</h2>
        </div>
        <div data-swiper-parallax="-150" data-swiper-parallax-opacity="0" className="transition-all duration-1000 delay-100">
           <p className="text-sm md:text-lg text-slate-200 font-medium max-w-2xl drop-shadow-md">{slide.subtitle}</p>
        </div>
      </div>
    </>
  );
};`;

code = code.replace(targetSliderImage, replSliderImage);

// Replace HeroSlider swiper props
const targetSwiper = `<Swiper
        key={visibleSlides.map((s) => s.id).join(",")}
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        spaceBetween={0}
        slidesPerView={1}
        loop={visibleSlides.length > 1}
        navigation={{
          prevEl: ".slider-prev",
          nextEl: ".slider-next",
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="w-full h-full bg-transparent transition-all duration-300 ease-in-out transform-gpu will-change-[width,height]"
      >`;

const replSwiper = `<Swiper
        key={visibleSlides.map((s) => s.id).join(",")}
        modules={[Autoplay, Pagination, Navigation, EffectCreative, Parallax]}
        speed={1200}
        parallax={true}
        effect="creative"
        creativeEffect={{
          prev: {
            shadow: true,
            translate: ["-20%", 0, -1],
            scale: 1.1,
          },
          next: {
            translate: ["100%", 0, 0],
          },
        }}
        spaceBetween={0}
        slidesPerView={1}
        loop={visibleSlides.length > 1}
        navigation={{
          prevEl: ".slider-prev",
          nextEl: ".slider-next",
        }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="w-full h-full bg-transparent transition-all duration-300 ease-in-out transform-gpu will-change-[width,height]"
      >`;

code = code.replace(targetSwiper, replSwiper);

fs.writeFileSync('src/pages/dashboard/index.tsx', code);
console.log('Patched');
