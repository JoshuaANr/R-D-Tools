const triggers = document.querySelectorAll(".mega-trigger");

triggers.forEach(trigger => {

  let timeout;

  trigger.addEventListener("mouseenter", () => {

    clearTimeout(timeout);

    const menu = trigger.querySelector(".mega-menu");

    menu.style.visibility = "visible";
    menu.style.opacity = "1";
    menu.style.transform = "translateY(0px)";
  });

  trigger.addEventListener("mouseleave", () => {

    const menu = trigger.querySelector(".mega-menu");

    timeout = setTimeout(() => {

      menu.style.opacity = "0";
      menu.style.transform = "translateY(-12px)";

      setTimeout(() => {
        menu.style.visibility = "hidden";
      }, 300);

    }, 150);

  });

});