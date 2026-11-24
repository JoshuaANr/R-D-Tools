function toggleProfile(button){

    const profile =
        button.parentElement.querySelector('.full-profile');

    profile.classList.toggle('active');

    if(profile.classList.contains('active')){

        button.textContent = 'HIDE PROFILE ▲';

    }else{

        button.textContent = 'VIEW PROFILE ▼';
    }
}