/* FLOATING NAVBAR */

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {

    if(window.scrollY > 60){

        navbar.classList.add('scrolled');

    }else{

        navbar.classList.remove('scrolled');

    }

});

/* SPOTLIGHT EFFECT */

const cards = document.querySelectorAll('.spotlight-card');

cards.forEach(card => {

    const spotlight = card.querySelector('.spotlight');

    card.addEventListener('mousemove', (e) => {

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        spotlight.style.background = `
        radial-gradient(
            circle 220px at ${x}px ${y}px,
            rgba(255,255,255,.12),
            transparent 60%
        )
        `;

    });

});