const dangerAlert = (text) => {
    const alert = document.getElementById('my-alert')
    alert.classList.remove('hidden')
    alert.classList.add('flex')

    const intext = document.querySelector('#my-alert > div')
    intext.innerHTML = `<span class="font-medium text-xl">Info alert!</span> <span class="text-xl">${text}</span>.`
}