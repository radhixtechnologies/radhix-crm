import logo from '../../assets/radhix-technologies-logo.webp';
import './BrandLogo.css';

const variants = {
  navbar: 'brand-logo-navbar',
  rail: 'brand-logo-rail',
  mobile: 'brand-logo-mobile',
  login: 'brand-logo-login',
};

const BrandLogo = ({ variant = 'navbar' }) => (
  <img
    src={logo}
    alt="Radhix Technologies"
    className={`brand-logo ${variants[variant] || variants.navbar}`}
  />
);

export default BrandLogo;