import logoDark from "../src/assets/mago_bank_cla.png";
import logoLight from "../src/assets/mago_bank_osc.png";

export default function MagoLogo({ size = 40, variant = "dark", className = "" }) {
    const logoSrc = variant === "dark" ? logoDark : logoLight;

    return (
        <img
            src={logoSrc}
            alt="Mago Bank Logo"
            width={size}
            height={size}
            className={`${className} inline-block`}
            style={{ width: size, height: size }}
        />
    );
}
