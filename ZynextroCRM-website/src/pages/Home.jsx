import Hero from "../components/Hero";
import LogoSlider from "../components/LogoSlider";
import Tagline from "../components/Tagline";
import Features from "../components/Features";
import IndustrySolutions from "../components/IndustrySolutions";
import DeveloperSection from "../components/DeveloperSection";
import InnovationSection from "../components/InnovationSection";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";

function Home() {
    return (
        <main>
            <Hero />
            <LogoSlider />
            <Tagline />
            <Features />
            <IndustrySolutions />
            <InnovationSection />
            {/* <DeveloperSection /> */}
            <Testimonials />
            <CTASection />
        </main>
    );
}

export default Home;
