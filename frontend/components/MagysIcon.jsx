import magysLight from "../src/assets/magys_cla.png";
import magysDark from "../src/assets/magys_osc.png";

export default function MagysIcon({ size = 24, variant = "dark", className = "" }) {
    const iconSrc = variant === "dark" ? magysDark : magysLight;

    return (
        <img
            src={iconSrc}
            alt="Magys Icon"
            width={size}
            height={size}
            className={`${className} inline-block`}
            style={{ width: size, height: size }}
        />
    );
}