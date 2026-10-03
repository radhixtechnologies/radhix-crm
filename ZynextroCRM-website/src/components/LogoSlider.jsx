import { useState } from "react";
import i1 from "../assets/i.png";
import i2 from "../assets/i2.png";
import i3 from "../assets/i3.png";
import i4 from "../assets/i4.png";
import i5 from "../assets/i5.png";
import i6 from "../assets/i6.png";
import i7 from "../assets/i7.png";

const logos = [
  { name: "Logo 1", src: i1 },
  { name: "Logo 2", src: i2 },
  { name: "Logo 3", src: i3 },
  { name: "Logo 4", src: i4 },
  { name: "Logo 5", src: i5 },
  { name: "Logo 6", src: i6 },
  { name: "Logo 7", src: i7 },
];

function LogoSlider() {
  const allLogos = [...logos, ...logos, ...logos, ...logos, ...logos, ...logos];
  const [isActive, setIsActive] = useState(false);

  const handleWrapperClick = () => {
    setIsActive((prev) => !prev);
  };

  return (
    <section
      className="group bg-white py-8 sm:py-12"
      role="button"
      tabIndex={0}
      onClick={handleWrapperClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleWrapperClick();
        }
      }}
    >
      <div className="overflow-hidden relative w-full cursor-pointer">
        <div className="flex animate-logo-scroll items-center whitespace-nowrap">
          {allLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="mx-4 sm:mx-6 md:mx-8 flex h-8 sm:h-10 md:h-12 shrink-0 items-center"
            >
              <div className="transition-all duration-300 opacity-100 grayscale-0">
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-8 sm:h-12 md:h-16 w-auto object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LogoSlider;
