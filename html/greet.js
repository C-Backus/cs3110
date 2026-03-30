document.addEventListener('DOMContentLoaded', function () {

    const nameInput = document.getElementById('name');
    const greetBtn = document.getElementById('greet');
    const output = document.getElementById('output');

    function greet() {
        const name = nameInput.value || '';
        output.textContent = `Hello, ${name}!`;
    }

    greetBtn.addEventListener('click', greet);

    nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            greet();
        }
    });

});