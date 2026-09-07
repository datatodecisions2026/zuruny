"use client";

import StaggeredMenu from "@/components/StaggeredMenu";

const items = [
  { label: "Shop", ariaLabel: "Everything we make, with prices", link: "/shop" },
  { label: "The names", ariaLabel: "The oils and molasses, by name", link: "#names" },
  { label: "The range", ariaLabel: "Everything we make", link: "#range" },
  { label: "The table", ariaLabel: "Carafes and cedar", link: "#table" },
  { label: "Shipping", ariaLabel: "Where we ship", link: "#shipping" },
];

const socials = [
  { label: "Instagram", link: "https://instagram.com" },
  { label: "Email", link: "mailto:hello@zuruny.co" },
];

export function Menu() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <StaggeredMenu
        isFixed
        position="right"
        items={items}
        socialItems={socials}
        displaySocials
        displayItemNumbering={false}
        logoUrl="/emblem-mark.png"
        colors={["#EADFCB", "#611217"]}
        accentColor="#611217"
        menuButtonColor="#241611"
        openMenuButtonColor="#241611"
        changeMenuColorOnOpen={false}
        closeOnClickAway
      />
    </div>
  );
}

export default Menu;
